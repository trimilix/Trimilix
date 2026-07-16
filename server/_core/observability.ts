import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, Express, Request, RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { logEvent } from "./logger";

export const REQUEST_ID_HEADER = "x-request-id";
export const DEFAULT_READINESS_TIMEOUT_MS = 1_000;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

type ReadinessProbe = () => Promise<void>;

type SliState = {
  requestsTotal: number;
  serverErrorsTotal: number;
  readinessFailuresTotal: number;
  durationMsTotal: number;
  statusClasses: Record<string, number>;
};

const sliState: SliState = {
  requestsTotal: 0,
  serverErrorsTotal: 0,
  readinessFailuresTotal: 0,
  durationMsTotal: 0,
  statusClasses: {},
};

function requestIdFrom(request: Request): string {
  const candidate = request.header(REQUEST_ID_HEADER)?.trim();
  return candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();
}

function routeClass(request: Request): string {
  const path = request.path;
  if (path === "/healthz") return "health";
  if (path === "/readyz") return "readiness";
  if (path.startsWith("/api/trpc")) return "trpc";
  if (path.startsWith("/api/oauth")) return "oauth";
  if (path.startsWith("/manus-storage")) return "storage";
  return "web";
}

function statusClass(statusCode: number): string {
  return `${Math.floor(statusCode / 100)}xx`;
}

export const requestObservabilityMiddleware: RequestHandler = (req, res, next) => {
  const requestId = requestIdFrom(req);
  const startedAt = performance.now();
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  res.once("finish", () => {
    const durationMs = Math.max(0, Math.round((performance.now() - startedAt) * 100) / 100);
    const responseClass = statusClass(res.statusCode);
    sliState.requestsTotal += 1;
    sliState.durationMsTotal += durationMs;
    sliState.statusClasses[responseClass] = (sliState.statusClasses[responseClass] ?? 0) + 1;
    if (res.statusCode >= 500) sliState.serverErrorsTotal += 1;

    logEvent(res.statusCode >= 500 ? "error" : "info", "http_request_completed", {
      requestId,
      method: req.method,
      routeClass: routeClass(req),
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};

export async function defaultDatabaseReadinessProbe(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DatabaseUnavailable");
  await db.execute(sql`SELECT 1`);
}

async function withTimeout(
  operation: Promise<void>,
  timeoutMs: number,
): Promise<void> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error("ReadinessTimeout")), timeoutMs);
    timeout.unref?.();
  });

  try {
    await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function registerHealthRoutes(
  app: Express,
  options: {
    readinessProbe?: ReadinessProbe;
    readinessTimeoutMs?: number;
  } = {},
): void {
  const readinessProbe = options.readinessProbe ?? defaultDatabaseReadinessProbe;
  const readinessTimeoutMs =
    options.readinessTimeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS;

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/readyz", async (_req, res) => {
    try {
      await withTimeout(readinessProbe(), readinessTimeoutMs);
      res.status(200).json({
        status: "ready",
        checks: { database: "up" },
      });
    } catch (error) {
      sliState.readinessFailuresTotal += 1;
      logEvent("warn", "readiness_failed", {
        requestId: res.locals.requestId,
        dependency: "database",
        error,
      });
      res.status(503).json({
        status: "not_ready",
        checks: { database: "down" },
      });
    }
  });
}

export const expressErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  logEvent("error", "express_unhandled_error", {
    requestId: res.locals.requestId,
    error,
  });

  if (res.headersSent) {
    next(error);
    return;
  }
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    requestId: res.locals.requestId,
  });
};

export function getSliSnapshot() {
  return {
    requestsTotal: sliState.requestsTotal,
    serverErrorsTotal: sliState.serverErrorsTotal,
    readinessFailuresTotal: sliState.readinessFailuresTotal,
    averageDurationMs:
      sliState.requestsTotal === 0
        ? 0
        : sliState.durationMsTotal / sliState.requestsTotal,
    statusClasses: { ...sliState.statusClasses },
  };
}

export function resetSliStateForTests(): void {
  sliState.requestsTotal = 0;
  sliState.serverErrorsTotal = 0;
  sliState.readinessFailuresTotal = 0;
  sliState.durationMsTotal = 0;
  sliState.statusClasses = {};
}
