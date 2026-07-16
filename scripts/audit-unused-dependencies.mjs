import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_PATH = path.join(ROOT, "package.json");
const packageJson = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));

const INCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".manus-logs",
  "coverage",
  "dist",
  "node_modules",
  "terminal_full_output",
]);

const files = [];
const walk = async directory => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".") {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) await walk(absolutePath);
      continue;
    }

    if (INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }
};

await walk(ROOT);

const packageNameFromSpecifier = specifier => {
  if (specifier.startsWith("node:") || specifier.startsWith(".") || specifier.startsWith("/")) {
    return null;
  }
  if (specifier.startsWith("@")) return specifier.split("/").slice(0, 2).join("/");
  return specifier.split("/")[0];
};

const usedPackages = new Set();
const importPatterns = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  /@(import|plugin)\s+["']([^"']+)["']/g,
];

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const pattern of importPatterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[2] ?? match[1];
      const packageName = packageNameFromSpecifier(specifier);
      if (packageName) usedPackages.add(packageName);
    }
  }
}

const scriptsText = Object.values(packageJson.scripts ?? {}).join("\n");
const directPackages = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};

for (const packageName of Object.keys(directPackages)) {
  const commandName = packageName.includes("/") ? packageName.split("/").at(-1) : packageName;
  const commandPattern = new RegExp(`(^|[\\s&|])${commandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\s&|:]|$)`);
  if (commandPattern.test(scriptsText)) usedPackages.add(packageName);
}

const implicitTooling = new Set([
  "@types/express",
  "@types/google.maps",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "typescript",
]);
for (const packageName of implicitTooling) usedPackages.add(packageName);

const unused = Object.keys(directPackages)
  .filter(packageName => !usedPackages.has(packageName))
  .sort();

const report = {
  status: unused.length === 0 ? "passed" : "failed",
  scannedFiles: files.length,
  directPackageCount: Object.keys(directPackages).length,
  unused,
};

console.log(JSON.stringify(report, null, 2));
if (unused.length > 0) process.exitCode = 1;
