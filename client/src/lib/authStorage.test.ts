import { describe, expect, it, vi } from "vitest";
import {
  clearLegacyAuthStorage,
  LEGACY_SESSION_TOKEN_KEY,
  LEGACY_USER_PROFILE_KEY,
} from "./authStorage";

describe("clearLegacyAuthStorage", () => {
  it("removes the legacy profile and session bearer keys", () => {
    const local = { removeItem: vi.fn() };
    const session = { removeItem: vi.fn() };

    clearLegacyAuthStorage(local, session);

    expect(local.removeItem).toHaveBeenCalledWith(LEGACY_USER_PROFILE_KEY);
    expect(session.removeItem).toHaveBeenCalledWith(LEGACY_SESSION_TOKEN_KEY);
  });

  it("fails safely when privacy mode blocks storage access", () => {
    const blocked = {
      removeItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
    };

    expect(() => clearLegacyAuthStorage(blocked, blocked)).not.toThrow();
  });
});
