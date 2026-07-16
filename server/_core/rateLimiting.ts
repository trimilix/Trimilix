import { COOKIE_NAME } from "@shared/const";
import { createHash } from "crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, RequestHandler } from "express";
import rateLimit, {
  ipKeyGenerator,
  MemoryStore,
  type Store,
} from "express-rate-limit";
import { ENV } from "./env";
import { getSdk } from "./sdk";

export type RateLimitRouteClass = "oauth" | "storage" | "trpc";

export type RateLimitPolicy = Readonly<{
  windowMs: number;
  limit: number;
}>;

export const RATE_LIMIT_POLICIES: Readonly<
  Record<RateLimitRouteClass, RateLimitPolicy>
> = Object.freeze({
  oauth: Object.freeze({ windowMs: 10 * 60_000, limit: 30 }),
  storage: Object.freeze({ windowMs: 60_000, limit: 120 }),
  trpc: Object.freeze({ windowMs: 60_000, limit: 300 }),
});

/**
 * Store boundary for rate limiting. A future Redis/edge implementation only
 * needs to replace this factory; route policies and HTTP behaviour stay intact.
 */
export interface RateLimitStoreFactory {
  readonly kind: string;
  readonly distributed: boolean;
  create(routeClass: RateLimitRouteClass): Store;
}

export class LocalMemoryRateLimitStoreFactory
  implements RateLimitStoreFactory
{
  readonly kind = "local-memory";
  readonly distributed = false;

  create(_routeClass: RateLimitRouteClass): Store {
    // Each limiter requires its own store instance. MemoryStore explicitly
    // declares localKeys=true, making the autoscale limitation observable.
    return new MemoryStore();
  }
}

export const defaultRateLimitStoreFactory: RateLimitStoreFactory =
  new LocalMemoryRateLimitStoreFactory();

const exceededCounters: Record<RateLimitRouteClass, number> = {
  oauth: 0,
  storage: 0,
  trpc: 0,
};

export function getRateLimitExceededSnapshot(): Readonly<
  Record<RateLimitRouteClass, number>
> {
  return Object.freeze({ ...exceededCounters });
}

function getSessionToken(req: Request): string | undefined {
  return parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
}

function hashIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function rateLimitKey(req: Request): Promise<string> {
  const sessionToken = getSessionToken(req);
  if (sessionToken) {
    const session = await getSdk().verifySession(sessionToken);
    if (session?.appId === ENV.appId) {
      return `user:${hashIdentity(session.openId)}`;
    }
  }

  const address = req.ip || req.socket.remoteAddress || "unknown";
  return `ip:${ipKeyGenerator(address)}`;
}

export function createRouteRateLimiter(
  routeClass: RateLimitRouteClass,
  options: {
    storeFactory?: RateLimitStoreFactory;
    policy?: RateLimitPolicy;
  } = {},
): RequestHandler {
  const storeFactory = options.storeFactory ?? defaultRateLimitStoreFactory;
  const policy = options.policy ?? RATE_LIMIT_POLICIES[routeClass];

  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: storeFactory.create(routeClass),
    keyGenerator: rateLimitKey,
    handler: (req, res) => {
      exceededCounters[routeClass] += 1;
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "rate_limit_exceeded",
          routeClass,
          requestId: res.getHeader("X-Request-Id") || undefined,
          storeKind: storeFactory.kind,
          distributedStore: storeFactory.distributed,
        }),
      );
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please retry later.",
          routeClass,
        },
      });
    },
  });
}

export function configureRateLimiting(
  app: Express,
  storeFactory: RateLimitStoreFactory = defaultRateLimitStoreFactory,
): void {
  app.use(
    "/api/oauth",
    createRouteRateLimiter("oauth", { storeFactory }),
  );
  app.use(
    "/manus-storage",
    createRouteRateLimiter("storage", { storeFactory }),
  );
  app.use(
    "/api/trpc",
    createRouteRateLimiter("trpc", { storeFactory }),
  );
}
