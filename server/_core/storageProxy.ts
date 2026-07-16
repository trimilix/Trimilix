import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { getSdk } from "./sdk";
import {
  canUserReadStorageKey,
  classifyStorageKey,
  type StorageAccess,
} from "./storagePolicy";

type StorageUser = { openId: string };

export type StorageProxyDependencies = {
  authenticate: (req: Request) => Promise<StorageUser>;
  fetchImpl: typeof fetch;
};

const defaultDependencies: StorageProxyDependencies = {
  authenticate: req => getSdk().authenticateRequest(req),
  fetchImpl: fetch,
};

function sendDenied(res: Response): void {
  // Deliberately use the same response for unknown and unauthorized keys to
  // avoid turning the proxy into a storage-object enumeration oracle.
  res.status(404).send("Storage object not found");
}

async function authorizeStorageAccess(
  req: Request,
  res: Response,
  access: StorageAccess,
  authenticate: StorageProxyDependencies["authenticate"],
): Promise<boolean> {
  if (access.kind === "public") return true;
  if (access.kind === "denied") {
    sendDenied(res);
    return false;
  }

  try {
    const user = await authenticate(req);
    if (!canUserReadStorageKey(user.openId, access)) {
      sendDenied(res);
      return false;
    }
  } catch {
    res.set("WWW-Authenticate", 'Bearer realm="trimilix-storage"');
    res.status(401).send("Authentication required");
    return false;
  }

  return true;
}

export function createStorageProxyHandler(
  overrides: Partial<StorageProxyDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...overrides };

  return async function storageProxyHandler(req: Request, res: Response) {
    const rawKey = (req.params as Record<string, string>)[0] ?? "";
    const access = classifyStorageKey(rawKey);

    if (
      !(await authorizeStorageAccess(
        req,
        res,
        access,
        dependencies.authenticate,
      ))
    ) {
      return;
    }

    if (access.kind === "denied") return;

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(503).send("Storage temporarily unavailable");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", access.key);

      const forgeResponse = await dependencies.fetchImpl(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResponse.ok) {
        console.error("[StorageProxy] Storage backend request failed", {
          status: forgeResponse.status,
        });
        res.status(502).send("Storage backend error");
        return;
      }

      const payload = (await forgeResponse.json()) as { url?: unknown };
      if (typeof payload.url !== "string") {
        res.status(502).send("Invalid storage backend response");
        return;
      }

      const redirectUrl = new URL(payload.url);
      if (!['https:', 'http:'].includes(redirectUrl.protocol)) {
        res.status(502).send("Invalid storage redirect");
        return;
      }

      if (access.kind === "public") {
        res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
      } else {
        res.set("Cache-Control", "private, no-store");
        res.set("Vary", "Cookie, Authorization");
      }

      res.redirect(307, redirectUrl.toString());
    } catch (error) {
      console.error("[StorageProxy] Request failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      res.status(502).send("Storage proxy error");
    }
  };
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", createStorageProxyHandler());
}
