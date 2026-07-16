import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type NextFunction, type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logEvent, setLogSinkForTests } from "./_core/logger";
import { publicProcedure, router } from "./_core/trpc";
import {
  expressErrorHandler,
  getSliSnapshot,
  registerHealthRoutes,
  requestObservabilityMiddleware,
  resetSliStateForTests,
} from "./_core/observability";

const servers: Server[] = [];
const logLines: string[] = [];

async function startTestServer(app: express.Express): Promise<string> {
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  logLines.length = 0;
  resetSliStateForTests();
  setLogSinkForTests(line => logLines.push(line));
});

afterEach(async () => {
  setLogSinkForTests(null);
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>((resolve, reject) => {
          server.close(error => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("structured privacy-safe logging", () => {
  it("redacts sensitive fields, bounds untrusted values and protects canonical fields", () => {
    logEvent("warn", "security_test", {
      requestId: "request-123\nforged-line",
      authorization: "Bearer must-not-leak",
      cookie: "session=must-not-leak",
      body: { account: "must-not-leak" },
      email: "person@example.com",
      nested: { accessToken: "must-not-leak", safe: "kept" },
      error: new Error("secret database message"),
      event: "caller-cannot-replace-event",
      level: "info",
    });

    expect(logLines).toHaveLength(1);
    expect(logLines[0]).not.toContain("must-not-leak");
    expect(logLines[0]).not.toContain("person@example.com");
    expect(logLines[0]).not.toContain("secret database message");
    expect(logLines[0]).not.toContain("\nforged-line");

    const record = JSON.parse(logLines[0]);
    expect(record).toMatchObject({
      level: "warn",
      event: "security_test",
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
      body: "[REDACTED]",
      email: "[REDACTED]",
      nested: { accessToken: "[REDACTED]", safe: "kept" },
      error: { name: "Error" },
    });
    expect(record.requestId).toBe("request-123 forged-line");
  });
});

describe("health, readiness and HTTP correlation", () => {
  it("keeps liveness dependency-free and propagates a validated request ID", async () => {
    const app = express();
    app.use(requestObservabilityMiddleware);
    registerHealthRoutes(app, {
      readinessProbe: async () => {
        throw new Error("liveness must not invoke readiness dependencies");
      },
    });

    const baseUrl = await startTestServer(app);
    const response = await fetch(`${baseUrl}/healthz`, {
      headers: { "x-request-id": "upstream-request-42" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("upstream-request-42");
    expect(await response.json()).toEqual({ status: "ok" });
    expect(getSliSnapshot()).toMatchObject({
      requestsTotal: 1,
      serverErrorsTotal: 0,
      readinessFailuresTotal: 0,
      statusClasses: { "2xx": 1 },
    });
  });

  it("returns ready only after the read-only dependency probe succeeds", async () => {
    let probeCalls = 0;
    const app = express();
    app.use(requestObservabilityMiddleware);
    registerHealthRoutes(app, {
      readinessProbe: async () => {
        probeCalls += 1;
      },
    });

    const baseUrl = await startTestServer(app);
    const response = await fetch(`${baseUrl}/readyz`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      checks: { database: "up" },
    });
    expect(probeCalls).toBe(1);
    expect(response.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("fails readiness within its deadline without exposing dependency errors", async () => {
    const app = express();
    app.use(requestObservabilityMiddleware);
    registerHealthRoutes(app, {
      readinessProbe: () => new Promise<void>(() => undefined),
      readinessTimeoutMs: 10,
    });

    const baseUrl = await startTestServer(app);
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/readyz`);
    const durationMs = Date.now() - startedAt;

    expect(response.status).toBe(503);
    expect(durationMs).toBeLessThan(500);
    expect(await response.json()).toEqual({
      status: "not_ready",
      checks: { database: "down" },
    });
    expect(getSliSnapshot()).toMatchObject({
      requestsTotal: 1,
      serverErrorsTotal: 1,
      readinessFailuresTotal: 1,
      statusClasses: { "5xx": 1 },
    });
    expect(logLines.join("\n")).not.toContain("ReadinessTimeout");
  });

  it("redacts unexpected tRPC messages and stacks from production responses", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const testRouter = router({
      failure: publicProcedure.query(() => {
        throw new Error("private tRPC failure detail");
      }),
    });
    const app = express();
    app.use(requestObservabilityMiddleware);
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: testRouter,
        createContext: ({ req, res }) => ({
          req,
          res,
          user: null,
          requestId: String(res.locals.requestId),
        }),
      }),
    );

    try {
      const baseUrl = await startTestServer(app);
      const response = await fetch(`${baseUrl}/api/trpc/failure`);
      const responseText = await response.text();

      expect(response.status).toBe(500);
      expect(responseText).toContain("An unexpected server error occurred.");
      expect(responseText).not.toContain("private tRPC failure detail");
      expect(responseText).not.toContain("observability.test.ts");
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it("delegates an error when response headers were already sent", () => {
    const error = new Error("private streamed failure detail");
    const next = vi.fn<NextFunction>();
    const response = {
      headersSent: true,
      locals: { requestId: "streamed-failure" },
    } as Response;

    expressErrorHandler(error, {} as Request, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(logLines.join("\n")).not.toContain("private streamed failure detail");
  });

  it("returns a bounded correlated 500 response for unhandled Express errors", async () => {
    const app = express();
    app.use(requestObservabilityMiddleware);
    app.get("/failure", () => {
      throw new Error("private failure detail");
    });
    app.use(expressErrorHandler);

    const baseUrl = await startTestServer(app);
    const response = await fetch(`${baseUrl}/failure`, {
      headers: { "x-request-id": "correlated-failure" },
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "INTERNAL_SERVER_ERROR",
      requestId: "correlated-failure",
    });
    expect(logLines.join("\n")).not.toContain("private failure detail");
    expect(
      logLines.map(line => JSON.parse(line)).find(record =>
        record.event === "express_unhandled_error"),
    ).toMatchObject({
      requestId: "correlated-failure",
      error: { name: "Error" },
    });
  });
});
