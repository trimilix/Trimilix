import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import helmet from "helmet";

export const API_BODY_LIMIT = "256kb";

const DEFAULT_PERMISSIONS_POLICY = [
  "camera=()",
  "display-capture=()",
  "geolocation=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

type HttpSecurityOptions = {
  isProduction: boolean;
  analyticsEndpoint?: string;
};

function toAllowedOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export function configureHttpSecurity(
  app: Express,
  { isProduction, analyticsEndpoint }: HttpSecurityOptions,
): void {
  const analyticsOrigin = toAllowedOrigin(analyticsEndpoint);
  const scriptSources = ["'self'", ...(analyticsOrigin ? [analyticsOrigin] : [])];
  const connectSources = ["'self'", ...(analyticsOrigin ? [analyticsOrigin] : [])];

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              connectSrc: connectSources,
              fontSrc: ["'self'", "data:"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
              imgSrc: ["'self'", "data:", "blob:"],
              objectSrc: ["'none'"],
              scriptSrc: scriptSources,
              scriptSrcAttr: ["'none'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      frameguard: { action: "deny" },
      hsts: isProduction
        ? {
            maxAge: 31_536_000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", DEFAULT_PERMISSIONS_POLICY);
    next();
  });
}

export function configureRequestParsers(app: Express): void {
  app.use(express.json({ limit: API_BODY_LIMIT }));
  app.use(express.urlencoded({ limit: API_BODY_LIMIT, extended: true }));
}

export function requestSizeErrorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({
      error: "PAYLOAD_TOO_LARGE",
      message: `Request body exceeds the ${API_BODY_LIMIT} limit.`,
    });
    return;
  }

  next(error);
}
