import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("Trimilix branding integration", () => {
  it("uses the approved direction-A logo assets on the home page", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");

    expect(home).toContain(
      "/manus-storage/trimilix-logo-primary-on-black_3cfb5a41.svg"
    );
    expect(home).toContain(
      "/manus-storage/trimilix-logo-horizontal-transparent-dark-surfaces_9d8c0275.svg"
    );
    expect(home).toContain('alt="Trimilix"');
  });

  it("publishes Dutch metadata and the standalone mark as favicon", () => {
    const html = readProjectFile("client/index.html");

    expect(html).toContain('<html lang="nl">');
    expect(html).toContain("Trimilix — jouw financiële cockpit");
    expect(html).toContain(
      "/manus-storage/trimilix-favicon_f1ead857.svg"
    );
    expect(html).toContain(
      "/manus-storage/trimilix-favicon-512_98cbebea.png"
    );
  });
});
