import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "ci.yml");

async function workflow(): Promise<string> {
  return readFile(workflowPath, "utf8");
}

describe("CI workflow contract", () => {
  it("uses least privilege, immutable actions and no privileged PR trigger", async () => {
    const contents = await workflow();

    expect(contents).toContain("permissions:\n  contents: read");
    expect(contents).not.toContain("pull_request_target");
    expect(contents).not.toMatch(/permissions:[\s\S]*?write/);

    const actionReferences = [...contents.matchAll(/uses:\s+([^\s#]+)/g)].map(
      match => match[1],
    );
    expect(actionReferences.length).toBeGreaterThanOrEqual(3);
    expect(actionReferences.every(reference => /@[0-9a-f]{40}$/.test(reference))).toBe(
      true,
    );
  });

  it("runs every release gate with locked tooling and no production secrets", async () => {
    const contents = await workflow();

    expect(contents).toContain("node-version: \"22.13.0\"");
    expect(contents).toContain("version: 10.4.1");
    expect(contents).toContain("pnpm install --frozen-lockfile");
    expect(contents).toContain("pnpm check");
    expect(contents).toContain("pnpm test");
    expect(contents).toContain("pnpm security:secrets");
    expect(contents).toContain("pnpm security:deps");
    expect(contents).toContain("node scripts/verify-migrations-and-recovery.mjs");
    expect(contents).toContain("pnpm build");
    expect(contents).not.toContain("secrets.");
    expect(contents).not.toContain("pnpm db:push");
  });
});
