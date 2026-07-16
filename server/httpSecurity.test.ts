import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureHttpSecurity,
  configureRequestParsers,
  requestSizeErrorHandler,
} from "./_core/httpSecurity";
import { validateCriticalRuntimeEnvironment } from "./_core/env";

const servers: Server[] = [];

async function startTestServer(app: express.Express): Promise<string> {
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      server =>
        new Promise<void>((resolve, reject) => {
          server.close(error => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("HTTP security baseline", () => {
  it("sets the production security headers and hides the framework", async () => {
    const app = express();
    configureHttpSecurity(app, {
      isProduction: true,
      analyticsEndpoint: "https://analytics.example.com/collect",
    });
    app.get("/health", (_req, res) => res.json({ ok: true }));

    const baseUrl = await startTestServer(app);
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age=31536000",
    );

    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://analytics.example.com");
  });

  it("keeps Vite development compatible while retaining non-CSP headers", async () => {
    const app = express();
    configureHttpSecurity(app, { isProduction: false });
    app.get("/", (_req, res) => res.send("ok"));

    const baseUrl = await startTestServer(app);
    const response = await fetch(baseUrl);

    expect(response.headers.get("content-security-policy")).toBeNull();
    expect(response.headers.get("strict-transport-security")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("rejects oversized JSON with a bounded sanitized response", async () => {
    const app = express();
    configureRequestParsers(app);
    app.post("/echo", (req, res) => res.json(req.body));
    app.use(requestSizeErrorHandler);

    const baseUrl = await startTestServer(app);
    const response = await fetch(`${baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(300 * 1024) }),
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the 256kb limit.",
    });
  });
});

describe("critical runtime configuration", () => {
  const validEnvironment = {
    DATABASE_URL: "mysql://user:password@database.example.com:3306/trimilix",
    JWT_SECRET: "test-secret-not-used-outside-this-test",
    VITE_APP_ID: "trimilix-test",
    OAUTH_SERVER_URL: "https://oauth.example.com",
    BUILT_IN_FORGE_API_URL: "https://forge.example.com",
    BUILT_IN_FORGE_API_KEY: ["forge", "test", "value"].join("-"),
  };

  it("accepts a complete runtime configuration", () => {
    expect(validateCriticalRuntimeEnvironment(validEnvironment)).toMatchObject({
      VITE_APP_ID: "trimilix-test",
      OAUTH_SERVER_URL: "https://oauth.example.com",
    });
  });

  it("fails fast by field name without exposing provided secret values", () => {
    const secretValue = "must-never-appear-in-an-error";
    const invalidEnvironment = {
      ...validEnvironment,
      JWT_SECRET: secretValue,
      DATABASE_URL: "",
      OAUTH_SERVER_URL: "javascript:alert(1)",
    };

    expect(() => validateCriticalRuntimeEnvironment(invalidEnvironment)).toThrow(
      /DATABASE_URL, OAUTH_SERVER_URL/,
    );

    try {
      validateCriticalRuntimeEnvironment(invalidEnvironment);
    } catch (error) {
      expect(String(error)).not.toContain(secretValue);
    }
  });

  it.each([
    ["JWT_SECRET", { JWT_SECRET: "" }],
    ["BUILT_IN_FORGE_API_URL", { BUILT_IN_FORGE_API_URL: "ftp://forge.example.com" }],
    ["BUILT_IN_FORGE_API_KEY", { BUILT_IN_FORGE_API_KEY: "" }],
  ])("rejects invalid %s configuration before startup", (field, override) => {
    expect(() =>
      validateCriticalRuntimeEnvironment({ ...validEnvironment, ...override }),
    ).toThrow(new RegExp(String(field)));
  });
});
