import express from "express";
import { createServer, type Server } from "http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryStore, type Store } from "express-rate-limit";
import { COOKIE_NAME } from "@shared/const";
import {
  createRouteRateLimiter,
  getRateLimitExceededSnapshot,
  LocalMemoryRateLimitStoreFactory,
  type RateLimitRouteClass,
  type RateLimitStoreFactory,
} from "./_core/rateLimiting";
import { getSdk } from "./_core/sdk";

const servers: Server[] = [];

async function listen(app: express.Express): Promise<string> {
  const server = createServer(app);
  servers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not expose a TCP address");
  }

  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>(resolve => server.close(() => resolve())),
    ),
  );
});

describe("rate limiting", () => {
  it("exposes an explicit local store adapter boundary", () => {
    const factory = new LocalMemoryRateLimitStoreFactory();

    expect(factory.kind).toBe("local-memory");
    expect(factory.distributed).toBe(false);
    expect(factory.create("oauth")).toBeInstanceOf(MemoryStore);
    expect(factory.create("oauth")).not.toBe(factory.create("oauth"));
  });

  it("returns a standards-based 429 response and privacy-safe event", async () => {
    const app = express();
    app.set("trust proxy", 1);
    app.use(
      "/api/oauth",
      createRouteRateLimiter("oauth", {
        policy: { windowMs: 60_000, limit: 1 },
      }),
    );
    app.get("/api/oauth/callback", (_req, res) => res.json({ ok: true }));

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const baseUrl = await listen(app);
    const first = await fetch(`${baseUrl}/api/oauth/callback`);
    const second = await fetch(`${baseUrl}/api/oauth/callback`);

    expect(first.status).toBe(200);
    expect(first.headers.get("ratelimit-policy")).toContain("1;w=60");
    expect(first.headers.get("x-ratelimit-limit")).toBeNull();
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please retry later.",
        routeClass: "oauth",
      },
    });

    const log = String(warn.mock.calls.at(-1)?.[0]);
    expect(log).toContain('"event":"rate_limit_exceeded"');
    expect(log).toContain('"routeClass":"oauth"');
    expect(log).not.toContain("127.0.0.1");
    expect(getRateLimitExceededSnapshot().oauth).toBeGreaterThan(0);
  });

  it("uses the adapter factory independently for each route class", () => {
    const created: RateLimitRouteClass[] = [];
    const factory: RateLimitStoreFactory = {
      kind: "test-store",
      distributed: true,
      create(routeClass): Store {
        created.push(routeClass);
        return new MemoryStore();
      },
    };

    createRouteRateLimiter("oauth", { storeFactory: factory });
    createRouteRateLimiter("storage", { storeFactory: factory });
    createRouteRateLimiter("trpc", { storeFactory: factory });

    expect(created).toEqual(["oauth", "storage", "trpc"]);
  });

  it("keys authenticated requests by hashed user identity rather than changing IP", async () => {
    const app = express();
    app.set("trust proxy", 1);
    app.use(
      "/api/trpc",
      createRouteRateLimiter("trpc", {
        policy: { windowMs: 60_000, limit: 1 },
      }),
    );
    app.get("/api/trpc/auth.me", (_req, res) => res.json({ ok: true }));

    const session = await getSdk().createSessionToken("rate-limit-test-user", {
      name: "Rate Limit Test",
      sessionVersion: 1,
      expiresInMs: 60_000,
    });
    const baseUrl = await listen(app);
    const headersA = {
      cookie: `${COOKIE_NAME}=${session}`,
      "x-forwarded-for": "198.51.100.10",
    };
    const headersB = {
      cookie: `${COOKIE_NAME}=${session}`,
      "x-forwarded-for": "203.0.113.20",
    };

    const first = await fetch(`${baseUrl}/api/trpc/auth.me`, { headers: headersA });
    const second = await fetch(`${baseUrl}/api/trpc/auth.me`, { headers: headersB });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });
});
