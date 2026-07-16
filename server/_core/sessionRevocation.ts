import type { User } from "../../drizzle/schema";
import * as db from "../db";

/**
 * Persistence boundary for session revocation.
 *
 * Fase A uses a user-level monotonically increasing version. A future
 * device-session adapter may resolve a jti/device record instead while keeping
 * callers and HTTP/authentication boundaries unchanged.
 */
export interface SessionRevocationAdapter {
  readonly strategy: "user-version" | "device-session";
  isCurrent(sessionVersion: number, user: User): Promise<boolean>;
  revokeAllForUser(openId: string): Promise<boolean>;
}

export class UserVersionSessionRevocationAdapter
  implements SessionRevocationAdapter
{
  readonly strategy = "user-version" as const;

  async isCurrent(sessionVersion: number, user: User): Promise<boolean> {
    return (
      Number.isSafeInteger(sessionVersion) &&
      sessionVersion > 0 &&
      sessionVersion === user.sessionVersion
    );
  }

  async revokeAllForUser(openId: string): Promise<boolean> {
    return db.rotateUserSessionVersion(openId);
  }
}

export const sessionRevocationAdapter: SessionRevocationAdapter =
  new UserVersionSessionRevocationAdapter();
