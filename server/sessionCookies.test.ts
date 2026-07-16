import { SESSION_DURATION_MS } from "@shared/const";
import type { Request } from "express";
import { describe, expect, it } from "vitest";
import {
  getPersistentSessionCookieOptions,
  getSessionCookieOptions,
} from "./_core/cookies";

function request(
  protocol: string,
  forwardedProto?: string,
): Request {
  return {
    protocol,
    headers: forwardedProto
      ? { "x-forwarded-proto": forwardedProto }
      : {},
  } as Request;
}

describe("session cookie policy", () => {
  it("uses a seven-day HttpOnly cookie for HTTPS sessions", () => {
    expect(getPersistentSessionCookieOptions(request("https"))).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: SESSION_DURATION_MS,
    });
  });

  it("recognizes HTTPS at the trusted proxy boundary", () => {
    expect(
      getSessionCookieOptions(request("http", "http, https")),
    ).toMatchObject({ secure: true, httpOnly: true });
  });

  it("does not mark a truly local HTTP request secure", () => {
    expect(getSessionCookieOptions(request("http"))).toMatchObject({
      secure: false,
      httpOnly: true,
    });
  });
});
