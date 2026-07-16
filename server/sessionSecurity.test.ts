import { COOKIE_NAME, SESSION_DURATION_MS } from "@shared/const";
import { decodeJwt } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";
import * as db from "./db";
import { getSdk } from "./_core/sdk";
import { UserVersionSessionRevocationAdapter } from "./_core/sessionRevocation";

const user = (sessionVersion: number): User => ({
  id: 42,
  openId: "session-test-user",
  name: "Session Test",
  email: null,
  loginMethod: "manus",
  role: "user",
  sessionVersion,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("session security", () => {
  it("issues a claim-bound JWT capped at seven days", async () => {
    const token = await getSdk().createSessionToken("session-test-user", {
      name: "Session Test",
      sessionVersion: 3,
      expiresInMs: 365 * 24 * 60 * 60 * 1000,
    });
    const claims = decodeJwt(token);

    expect(claims.iss).toBe(`trimilix:${claims.appId}`);
    expect(claims.aud).toBe(claims.appId);
    expect(claims.sub).toBe("session-test-user");
    expect(claims.openId).toBe("session-test-user");
    expect(claims.sessionVersion).toBe(3);
    expect(claims.jti).toEqual(expect.any(String));
    expect(Number(claims.exp) - Number(claims.iat)).toBe(
      SESSION_DURATION_MS / 1000,
    );

    await expect(getSdk().verifySession(token)).resolves.toMatchObject({
      openId: "session-test-user",
      sessionVersion: 3,
      jti: claims.jti,
    });
  });

  it("rejects expired sessions", async () => {
    const token = await getSdk().createSessionToken("session-test-user", {
      name: "Session Test",
      sessionVersion: 1,
      expiresInMs: -10_000,
    });

    await expect(getSdk().verifySession(token)).resolves.toBeNull();
  });

  it("does not accept an Authorization bearer token without the HttpOnly cookie", async () => {
    const token = await getSdk().createSessionToken("session-test-user", {
      name: "Session Test",
      sessionVersion: 1,
    });
    const request = {
      headers: { authorization: `Bearer ${token}` },
    } as Parameters<ReturnType<typeof getSdk>["authenticateRequest"]>[0];

    await expect(getSdk().authenticateRequest(request)).rejects.toThrow(
      "Invalid session cookie",
    );
  });

  it("rejects a cryptographically valid cookie after its user version changes", async () => {
    const token = await getSdk().createSessionToken("session-test-user", {
      name: "Session Test",
      sessionVersion: 1,
    });
    vi.spyOn(db, "getUserByOpenId").mockResolvedValue(user(2));
    vi.spyOn(db, "upsertUser").mockResolvedValue(undefined);
    const request = {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    } as Parameters<ReturnType<typeof getSdk>["authenticateRequest"]>[0];

    await expect(getSdk().authenticateRequest(request)).rejects.toThrow(
      "Session has been revoked",
    );
  });

  it("keeps the revocation decision behind the adapter boundary", async () => {
    const adapter = new UserVersionSessionRevocationAdapter();

    await expect(adapter.isCurrent(4, user(4))).resolves.toBe(true);
    await expect(adapter.isCurrent(3, user(4))).resolves.toBe(false);
    await expect(adapter.isCurrent(0, user(4))).resolves.toBe(false);
  });
});
