import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

describe("performance and build architecture", () => {
  it("keeps non-home routes lazy and outside the initial app import graph", () => {
    const appSource = readProjectFile("client/src/App.tsx");

    expect(appSource).toContain('import Home from "./pages/Home"');
    expect(appSource).toContain('lazy(() => import("./pages/ETFCheck"))');
    expect(appSource).toContain(
      'lazy(() => import("./pages/PortfolioChecker"))'
    );
    expect(appSource).toContain("<Suspense fallback={<RouteFallback />}");
    expect(appSource).not.toMatch(
      /^import .* from ["']\.\/pages\/(?!Home)[^"']+["'];$/m
    );
  });

  it("runs the manifest-based bundle budget in every production build", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const budgetSource = readProjectFile("scripts/check-bundle-budget.mjs");

    expect(packageJson.scripts.build).toContain("vite build");
    expect(packageJson.scripts.build).toContain("pnpm bundle:check");
    expect(packageJson.scripts["bundle:check"]).toBe(
      "node scripts/check-bundle-budget.mjs"
    );
    expect(packageJson.scripts.verify).toContain("pnpm build");
    expect(budgetSource).toContain("manifest.json");
    expect(budgetSource).toContain("initialRawBytes");
    expect(budgetSource).toContain("initialGzipBytes");
    expect(budgetSource).toContain("asyncChunkRawBytes");
    expect(budgetSource).toContain("asyncChunkGzipBytes");
  });

  it("uses bounded cursor pages and one ETF batch query for portfolio analysis", () => {
    const dbSource = readProjectFile("server/db.ts");
    const routerSource = readProjectFile("server/routers.ts");
    const analysisSource = readProjectFile("server/portfolioAnalysis.ts");

    expect(dbSource.match(/\.limit\(limit \+ 1\)/g)).toHaveLength(2);
    expect(dbSource).toContain("gt(portfolios.id, options.cursor)");
    expect(dbSource).toContain("gt(etfs.id, options.cursor)");
    expect(routerSource.match(/\.max\(100\)\.default\(25\)/g)).toHaveLength(2);
    expect(analysisSource).toContain("getEtfsBySymbols");
    expect(analysisSource).not.toContain("getEtfBySymbol");
    expect(analysisSource).not.toContain("Promise.all");
  });

  it("shows an explicit Portfolio Checker authentication boundary before empty data states", () => {
    const portfolioSource = readProjectFile(
      "client/src/pages/PortfolioChecker.tsx"
    );

    expect(portfolioSource).toContain("enabled: isAuthenticated");
    expect(portfolioSource).toContain("loading: isLoadingAuth");
    expect(portfolioSource).toContain("if (!isAuthenticated)");
    expect(portfolioSource).toContain("Inloggen vereist");
    expect(portfolioSource).toContain("onClick={() => startLogin()}");
    expect(portfolioSource.indexOf("if (!isAuthenticated)")).toBeLessThan(
      portfolioSource.indexOf("Geen portefeuilles gevonden")
    );
  });

  it("uses only the canonical full-stack server entrypoint", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(fs.existsSync(path.join(root, "server/index.ts"))).toBe(false);
    expect(packageJson.scripts.dev).toContain("server/_core/index.ts");
    expect(packageJson.scripts.build).toContain("server/_core/index.ts");
  });
});
