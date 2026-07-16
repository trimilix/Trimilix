// Preconfigured storage helpers for Manus WebDev templates.
// Uploads are restricted to explicit public or user-owned private namespaces.

import { ENV } from "./_core/env";
import {
  classifyStorageKey,
  normalizeStorageKey,
  privateStorageKey,
  publicStorageKey,
} from "./_core/storagePolicy";

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error("Storage configuration unavailable");
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function requireManagedKey(relKey: string): string {
  const key = normalizeStorageKey(relKey);
  if (!key || classifyStorageKey(key).kind === "denied") {
    throw new Error("Storage key is outside an allowed namespace");
  }
  return key;
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

async function putManagedObject(
  managedKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(requireManagedKey(managedKey));

  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResponse = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResponse.ok) {
    throw new Error(`Storage presign failed (${presignResponse.status})`);
  }

  const payload = (await presignResponse.json()) as { url?: unknown };
  if (typeof payload.url !== "string") {
    throw new Error("Storage service returned an invalid upload URL");
  }

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as BlobPart], { type: contentType });

  const uploadResponse = await fetch(payload.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Storage upload failed (${uploadResponse.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export function storagePutPublic(
  relativeKey: string,
  data: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<{ key: string; url: string }> {
  return putManagedObject(publicStorageKey(relativeKey), data, contentType);
}

export function storagePutPrivate(
  openId: string,
  relativeKey: string,
  data: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<{ key: string; url: string }> {
  return putManagedObject(privateStorageKey(openId, relativeKey), data, contentType);
}

/**
 * Retained for compatibility. Callers must provide a fully managed key under
 * `public/` or `private/users/<owner-namespace>/`.
 */
export function storagePut(
  managedKey: string,
  data: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<{ key: string; url: string }> {
  return putManagedObject(managedKey, data, contentType);
}

export async function storageGet(
  managedKey: string,
): Promise<{ key: string; url: string }> {
  const key = requireManagedKey(managedKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(managedKey: string): Promise<string> {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = requireManagedKey(managedKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const response = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!response.ok) {
    throw new Error(`Storage signed URL failed (${response.status})`);
  }

  const payload = (await response.json()) as { url?: unknown };
  if (typeof payload.url !== "string") {
    throw new Error("Storage service returned an invalid download URL");
  }
  return payload.url;
}
