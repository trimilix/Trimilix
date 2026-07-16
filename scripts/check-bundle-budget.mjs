import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const ROOT = process.cwd();
const BUILD_DIR = path.join(ROOT, "dist", "public");
const MANIFEST_PATH = path.join(BUILD_DIR, ".vite", "manifest.json");

const BUDGETS = Object.freeze({
  initialRawBytes: 700 * 1024,
  initialGzipBytes: 210 * 1024,
  asyncChunkRawBytes: 425 * 1024,
  asyncChunkGzipBytes: 122 * 1024,
  minimumDynamicRoutes: 5,
});

const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
const entryKey = Object.keys(manifest).find(key => manifest[key]?.isEntry);

if (!entryKey) {
  throw new Error("Bundlebudget kon geen Vite-entry in het manifest vinden.");
}

const collectStaticGraph = (key, collected = new Set()) => {
  if (collected.has(key)) return collected;
  const chunk = manifest[key];
  if (!chunk)
    throw new Error(`Bundlemanifest verwijst naar ontbrekende chunk: ${key}`);

  collected.add(key);
  for (const importedKey of chunk.imports ?? []) {
    collectStaticGraph(importedKey, collected);
  }
  return collected;
};

const initialKeys = collectStaticGraph(entryKey);
const javascriptChunks = Object.entries(manifest).filter(
  ([, chunk]) => typeof chunk.file === "string" && chunk.file.endsWith(".js")
);

const measureChunk = async ([key, chunk]) => {
  const filePath = path.join(BUILD_DIR, chunk.file);
  const contents = await readFile(filePath);
  const fileStat = await stat(filePath);
  return {
    key,
    file: chunk.file,
    rawBytes: fileStat.size,
    gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
  };
};

const measurements = await Promise.all(javascriptChunks.map(measureChunk));
const initialMeasurements = measurements.filter(chunk =>
  initialKeys.has(chunk.key)
);
const asyncMeasurements = measurements.filter(
  chunk => !initialKeys.has(chunk.key)
);

const sum = (items, field) =>
  items.reduce((total, item) => total + item[field], 0);
const initialRawBytes = sum(initialMeasurements, "rawBytes");
const initialGzipBytes = sum(initialMeasurements, "gzipBytes");
const largestAsyncRaw = asyncMeasurements.reduce(
  (largest, current) =>
    current.rawBytes > largest.rawBytes ? current : largest,
  { file: "none", rawBytes: 0, gzipBytes: 0 }
);
const largestAsyncGzip = asyncMeasurements.reduce(
  (largest, current) =>
    current.gzipBytes > largest.gzipBytes ? current : largest,
  { file: "none", rawBytes: 0, gzipBytes: 0 }
);

const dynamicRoutes = manifest[entryKey].dynamicImports ?? [];
const violations = [];

if (dynamicRoutes.length < BUDGETS.minimumDynamicRoutes) {
  violations.push(
    `slechts ${dynamicRoutes.length} lazy routes; minimaal ${BUDGETS.minimumDynamicRoutes} vereist`
  );
}
if (initialRawBytes > BUDGETS.initialRawBytes) {
  violations.push(
    `initiële JS ${initialRawBytes} B > ${BUDGETS.initialRawBytes} B`
  );
}
if (initialGzipBytes > BUDGETS.initialGzipBytes) {
  violations.push(
    `initiële JS gzip ${initialGzipBytes} B > ${BUDGETS.initialGzipBytes} B`
  );
}
if (largestAsyncRaw.rawBytes > BUDGETS.asyncChunkRawBytes) {
  violations.push(
    `grootste async chunk ${largestAsyncRaw.file} ${largestAsyncRaw.rawBytes} B > ${BUDGETS.asyncChunkRawBytes} B`
  );
}
if (largestAsyncGzip.gzipBytes > BUDGETS.asyncChunkGzipBytes) {
  violations.push(
    `grootste async gzipchunk ${largestAsyncGzip.file} ${largestAsyncGzip.gzipBytes} B > ${BUDGETS.asyncChunkGzipBytes} B`
  );
}

const report = {
  status: violations.length === 0 ? "passed" : "failed",
  budgets: BUDGETS,
  dynamicRouteCount: dynamicRoutes.length,
  initial: {
    files: initialMeasurements.map(({ file }) => file).sort(),
    rawBytes: initialRawBytes,
    gzipBytes: initialGzipBytes,
  },
  largestAsyncRaw,
  largestAsyncGzip,
  violations,
};

console.log(JSON.stringify(report, null, 2));

if (violations.length > 0) {
  process.exitCode = 1;
}
