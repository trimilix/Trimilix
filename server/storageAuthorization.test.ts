import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createStorageProxyHandler } from "./_core/storageProxy";
import {
  classifyStorageKey,
  privateStorageKey,
  publicStorageKey,
  storageNamespaceForUser,
} from "./_core/storagePolicy";

type ResponseState = {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
  redirect?: { status: number; url: string };
};

function requestFor(key: string): Request {
  return {
    params: { 0: key },
    headers: {},
  } as unknown as Request;
}

function responseRecorder(): { response: Response; state: ResponseState } {
  const state: ResponseState = { statusCode: 200, headers: {} };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    set(name: string, value: string) {
      state.headers[name] = value;
      return response;
    },
    send(body: string) {
      state.body = body;
      return response;
    },
    redirect(status: number, url: string) {
      state.redirect = { status, url };
      return response;
    },
  } as unknown as Response;
  return { response, state };
}

function successfulStorageFetch() {
  return vi.fn(async () =>
    new Response(JSON.stringify({ url: "https://storage.example.com/object?sig=redacted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("storage key policy", () => {
  it("keeps only the active legacy branding assets public", () => {
    expect(classifyStorageKey("trimilix-favicon_f1ead857.svg").kind).toBe("public");
    expect(classifyStorageKey("some-other-forge-object.pdf").kind).toBe("denied");
  });

  it("uses a stable pseudonymous namespace instead of exposing the raw openId", () => {
    const namespace = storageNamespaceForUser("user-sensitive-open-id");
    expect(namespace).toMatch(/^[a-f0-9]{32}$/);
    expect(namespace).not.toContain("user-sensitive-open-id");
    expect(storageNamespaceForUser("user-sensitive-open-id")).toBe(namespace);
  });

  it("rejects traversal, empty segments and backslash variants", () => {
    for (const key of ["../secret", "public//asset.svg", "public/./asset.svg", "public\\asset.svg"]) {
      expect(classifyStorageKey(key).kind).toBe("denied");
    }
  });

  it("creates explicit public and private managed namespaces", () => {
    expect(publicStorageKey("brand/logo.svg")).toBe("public/brand/logo.svg");
    expect(privateStorageKey("user-a", "reports/statement.pdf")).toMatch(
      /^private\/users\/[a-f0-9]{32}\/reports\/statement\.pdf$/,
    );
  });
});

describe("storage proxy authorization", () => {
  it("serves allowlisted public assets without authenticating", async () => {
    const fetchImpl = successfulStorageFetch();
    const authenticate = vi.fn();
    const handler = createStorageProxyHandler({ fetchImpl, authenticate });
    const { response, state } = responseRecorder();

    await handler(requestFor("trimilix-favicon_f1ead857.svg"), response);

    expect(authenticate).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(state.redirect?.status).toBe(307);
    expect(state.headers["Cache-Control"]).toContain("public");
  });

  it("requires authentication for a private object", async () => {
    const fetchImpl = successfulStorageFetch();
    const handler = createStorageProxyHandler({
      fetchImpl,
      authenticate: vi.fn().mockRejectedValue(new Error("missing session")),
    });
    const { response, state } = responseRecorder();

    await handler(requestFor(privateStorageKey("user-a", "report.pdf")), response);

    expect(state.statusCode).toBe(401);
    expect(state.headers["WWW-Authenticate"]).toContain("trimilix-storage");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("allows an authenticated owner to access their private object", async () => {
    const fetchImpl = successfulStorageFetch();
    const handler = createStorageProxyHandler({
      fetchImpl,
      authenticate: vi.fn().mockResolvedValue({ openId: "user-a" }),
    });
    const { response, state } = responseRecorder();

    await handler(requestFor(privateStorageKey("user-a", "report.pdf")), response);

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(state.redirect?.status).toBe(307);
    expect(state.headers["Cache-Control"]).toBe("private, no-store");
    expect(state.headers.Vary).toBe("Cookie, Authorization");
  });

  it("conceals private objects from a different authenticated user", async () => {
    const fetchImpl = successfulStorageFetch();
    const handler = createStorageProxyHandler({
      fetchImpl,
      authenticate: vi.fn().mockResolvedValue({ openId: "user-b" }),
    });
    const { response, state } = responseRecorder();

    await handler(requestFor(privateStorageKey("user-a", "report.pdf")), response);

    expect(state.statusCode).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not forward unknown object namespaces to the storage backend", async () => {
    const fetchImpl = successfulStorageFetch();
    const authenticate = vi.fn();
    const handler = createStorageProxyHandler({ fetchImpl, authenticate });
    const { response, state } = responseRecorder();

    await handler(requestFor("unmanaged/customer-export.csv"), response);

    expect(state.statusCode).toBe(404);
    expect(authenticate).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP redirect protocols from the storage backend", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ url: "javascript:alert(1)" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;
    const handler = createStorageProxyHandler({ fetchImpl });
    const { response, state } = responseRecorder();

    await handler(requestFor("trimilix-favicon_f1ead857.svg"), response);

    expect(state.statusCode).toBe(502);
    expect(state.redirect).toBeUndefined();
  });
});
