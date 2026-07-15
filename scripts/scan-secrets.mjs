import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".manus-logs",
  ".pnpm-store",
  "coverage",
  "dist",
  "node_modules",
]);
const ignoredFiles = new Set(["pnpm-lock.yaml"]);
const textExtensions = new Set([
  ".cjs",
  ".css",
  ".d2",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const rules = [
  {
    name: "private-key-header",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: "aws-access-key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  },
  {
    name: "stripe-live-secret",
    pattern: /\bsk_live_[0-9A-Za-z]{16,}\b/,
  },
  {
    name: "hardcoded-secret-assignment",
    pattern:
      /(?:api[_-]?key|client[_-]?secret|jwt[_-]?secret|password|private[_-]?key)\s*[:=]\s*["'`](?!\$\{|<|YOUR_|REPLACE_|example|test|dummy|placeholder)[A-Za-z0-9_\-\/+\=.]{16,}["'`]/i,
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".env")) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectFiles(absolutePath)));
      }
      continue;
    }

    if (ignoredFiles.has(entry.name)) continue;
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    const metadata = await stat(absolutePath);
    if (metadata.size <= 2_000_000) files.push(absolutePath);
  }

  return files;
}

const findings = [];
for (const file of await collectFiles(root)) {
  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: path.relative(root, file),
          line: index + 1,
          rule: rule.name,
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error("Mogelijke hardcoded secrets gevonden (waarden bewust verborgen):");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}]`);
  }
  process.exit(1);
}

console.log("Secretscan geslaagd: geen high-confidence hardcoded secrets gevonden.");
