import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const batchSize = 500;

function collectDependencies(container, collected) {
  if (!container || typeof container !== "object") return;

  for (const dependencyGroup of ["dependencies", "optionalDependencies"]) {
    const dependencies = container[dependencyGroup];
    if (!dependencies || typeof dependencies !== "object") continue;

    for (const [name, metadata] of Object.entries(dependencies)) {
      if (!metadata || typeof metadata !== "object") continue;
      const version = metadata.version;
      if (typeof version === "string" && /^\d+\.\d+\.\d+/.test(version)) {
        collected.set(`${name}@${version}`, { name, version });
      }
      collectDependencies(metadata, collected);
    }
  }
}

async function queryOsv(packages) {
  const findings = [];

  for (let start = 0; start < packages.length; start += batchSize) {
    const batch = packages.slice(start, start + batchSize);
    const response = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        queries: batch.map(({ name, version }) => ({
          package: { ecosystem: "npm", name },
          version,
        })),
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`OSV API antwoordde met HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.results) || payload.results.length !== batch.length) {
      throw new Error("OSV API gaf een onverwachte batchrespons terug");
    }

    payload.results.forEach((result, index) => {
      const vulnerabilities = Array.isArray(result.vulns) ? result.vulns : [];
      if (vulnerabilities.length === 0) return;

      findings.push({
        package: batch[index],
        ids: [...new Set(vulnerabilities.map(vulnerability => vulnerability.id))].sort(),
      });
    });
  }

  return findings;
}

try {
  const { stdout } = await execFileAsync(
    "pnpm",
    ["list", "--prod", "--json", "--depth", "Infinity"],
    { cwd: root, maxBuffer: 50 * 1024 * 1024 },
  );
  const dependencyTree = JSON.parse(stdout);
  const collected = new Map();

  for (const project of dependencyTree) {
    collectDependencies(project, collected);
  }

  const packages = [...collected.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`),
  );

  if (packages.length === 0) {
    throw new Error("Geen geïnstalleerde productiepackages gevonden");
  }

  const findings = await queryOsv(packages);
  if (findings.length > 0) {
    console.error(`OSV-dependencyaudit vond kwetsbaarheden in ${findings.length} packageversie(s):`);
    for (const finding of findings) {
      console.error(`- ${finding.package.name}@${finding.package.version}: ${finding.ids.join(", ")}`);
    }
    process.exit(1);
  }

  console.log(
    `OSV-dependencyaudit geslaagd: ${packages.length} geïnstalleerde productiepackageversies gecontroleerd.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`OSV-dependencyaudit kon niet betrouwbaar worden uitgevoerd: ${message}`);
  process.exit(1);
}
