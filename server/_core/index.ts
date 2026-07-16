import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { validateCriticalRuntimeEnvironment } from "./env";
import { assertDatabaseIntegrity } from "./databaseIntegrity";
import {
  configureHttpSecurity,
  configureRequestParsers,
  requestSizeErrorHandler,
} from "./httpSecurity";
import { configureRateLimiting } from "./rateLimiting";
import { logEvent } from "./logger";
import {
  expressErrorHandler,
  registerHealthRoutes,
  requestObservabilityMiddleware,
} from "./observability";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateCriticalRuntimeEnvironment();
  await assertDatabaseIntegrity();

  const app = express();
  const server = createServer(app);
  const isProduction = process.env.NODE_ENV === "production";

  app.set("trust proxy", 1);
  configureHttpSecurity(app, {
    isProduction,
    analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,
  });
  configureRequestParsers(app);
  app.use(requestObservabilityMiddleware);
  registerHealthRoutes(app);
  configureRateLimiting(app);

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, ctx }) {
        logEvent(
          error.code === "INTERNAL_SERVER_ERROR" ? "error" : "warn",
          "trpc_request_failed",
          {
            requestId: ctx?.requestId ?? "unknown",
            procedure: path ?? "unknown",
            errorCode: error.code,
            error,
          },
        );
      },
    }),
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use(requestSizeErrorHandler);
  app.use(expressErrorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logEvent("warn", "server_port_fallback", {
      preferredPort,
      selectedPort: port,
    });
  }

  server.listen(port, () => {
    logEvent("info", "server_started", { port });
  });
}

startServer().catch(error => {
  logEvent("error", "server_start_failed", { error });
  process.exitCode = 1;
});
