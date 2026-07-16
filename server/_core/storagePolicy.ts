import { createHash } from "node:crypto";

export const MAX_STORAGE_KEY_LENGTH = 512;

const LEGACY_PUBLIC_ASSET_KEYS = new Set([
  "trimilix-favicon-512_98cbebea.png",
  "trimilix-favicon_f1ead857.svg",
  "trimilix-logo-horizontal-transparent-dark-surfaces_9d8c0275.svg",
  "trimilix-logo-primary-on-black_3cfb5a41.svg",
]);

export type StorageAccess =
  | { kind: "public"; key: string }
  | { kind: "private"; key: string; ownerNamespace: string }
  | { kind: "denied"; reason: "invalid-key" | "unknown-namespace" };

export function normalizeStorageKey(value: string): string | null {
  const key = value.replace(/^\/+/, "");
  if (!key || key.length > MAX_STORAGE_KEY_LENGTH) return null;
  if (key.includes("\\") || key.includes("\0")) return null;

  const segments = key.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === "..")) {
    return null;
  }

  return key;
}

/**
 * Produces a stable, non-PII namespace. Raw Manus openIds never appear in object
 * paths, browser URLs, CDN logs or storage-provider request logs.
 */
export function storageNamespaceForUser(openId: string): string {
  return createHash("sha256").update(openId).digest("hex").slice(0, 32);
}

export function classifyStorageKey(value: string): StorageAccess {
  const key = normalizeStorageKey(value);
  if (!key) return { kind: "denied", reason: "invalid-key" };

  if (LEGACY_PUBLIC_ASSET_KEYS.has(key) || key.startsWith("public/")) {
    return { kind: "public", key };
  }

  const privateMatch = /^private\/users\/([a-f0-9]{32})\/(.+)$/.exec(key);
  if (privateMatch) {
    return {
      kind: "private",
      key,
      ownerNamespace: privateMatch[1],
    };
  }

  return { kind: "denied", reason: "unknown-namespace" };
}

export function canUserReadStorageKey(openId: string, access: StorageAccess): boolean {
  return (
    access.kind === "private" &&
    access.ownerNamespace === storageNamespaceForUser(openId)
  );
}

export function publicStorageKey(relativeKey: string): string {
  const key = normalizeStorageKey(relativeKey);
  if (!key) throw new Error("Invalid public storage key");
  return `public/${key}`;
}

export function privateStorageKey(openId: string, relativeKey: string): string {
  const key = normalizeStorageKey(relativeKey);
  if (!key) throw new Error("Invalid private storage key");
  return `private/users/${storageNamespaceForUser(openId)}/${key}`;
}
