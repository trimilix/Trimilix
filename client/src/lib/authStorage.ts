export const LEGACY_SESSION_TOKEN_KEY = "manus-cookie";
export const LEGACY_USER_PROFILE_KEY = "manus-runtime-user-info";

type RemovableStorage = Pick<Storage, "removeItem">;

export function clearLegacyAuthStorage(
  localStorageRef?: RemovableStorage,
  sessionStorageRef?: RemovableStorage,
): void {
  try {
    const local =
      localStorageRef ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    local?.removeItem(LEGACY_USER_PROFILE_KEY);
  } catch {
    // Storage can be unavailable in privacy modes; absence is already safe.
  }

  try {
    const session =
      sessionStorageRef ??
      (typeof window !== "undefined" ? window.sessionStorage : undefined);
    session?.removeItem(LEGACY_SESSION_TOKEN_KEY);
  } catch {
    // Storage can be unavailable in privacy modes; absence is already safe.
  }
}
