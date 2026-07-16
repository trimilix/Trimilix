import { SESSION_DURATION_MS } from "@shared/const";
import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}

export function getPersistentSessionCookieOptions(
  req: Request,
): Pick<
  CookieOptions,
  "domain" | "httpOnly" | "maxAge" | "path" | "sameSite" | "secure"
> {
  return {
    ...getSessionCookieOptions(req),
    maxAge: SESSION_DURATION_MS,
  };
}
