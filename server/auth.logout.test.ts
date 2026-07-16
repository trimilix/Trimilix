import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { sessionRevocationAdapter } from "./_core/sessionRevocation";

 type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(authenticated = true): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    sessionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: authenticated ? user : null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth.logout", () => {
  it("revokes all user sessions, clears the cookie and reports success", async () => {
    const revoke = vi
      .spyOn(sessionRevocationAdapter, "revokeAllForUser")
      .mockResolvedValue(true);
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(revoke).toHaveBeenCalledWith("sample-user");
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("clears an anonymous stale cookie without a database revocation", async () => {
    const revoke = vi.spyOn(sessionRevocationAdapter, "revokeAllForUser");
    const { ctx, clearedCookies } = createAuthContext(false);

    await expect(appRouter.createCaller(ctx).auth.logout()).resolves.toEqual({
      success: true,
    });
    expect(revoke).not.toHaveBeenCalled();
    expect(clearedCookies).toHaveLength(1);
  });

  it("clears the cookie but fails closed when revocation cannot be confirmed", async () => {
    vi.spyOn(sessionRevocationAdapter, "revokeAllForUser").mockResolvedValue(
      false,
    );
    const { ctx, clearedCookies } = createAuthContext();

    await expect(appRouter.createCaller(ctx).auth.logout()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(clearedCookies).toHaveLength(1);
  });
});
