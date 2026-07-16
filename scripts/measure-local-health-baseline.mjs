const BASE_URL = process.env.BASELINE_BASE_URL ?? "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = 2_000;

const scenarios = [
  {
    name: "liveness",
    path: "/healthz",
    requests: 200,
    concurrency: 20,
    p95BudgetMs: 100,
  },
  {
    name: "readiness",
    path: "/readyz",
    requests: 80,
    concurrency: 8,
    p95BudgetMs: 750,
  },
];

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return null;
  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil((percentileValue / 100) * sortedValues.length) - 1,
  );
  return Number(sortedValues[Math.max(0, index)].toFixed(2));
}

async function timedRequest(url) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    await response.arrayBuffer();
    return {
      ok: response.status === 200,
      status: response.status,
      durationMs: performance.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: performance.now() - startedAt,
      failure: error instanceof Error ? error.name : "UnknownError",
    };
  }
}

async function runScenario(scenario) {
  if (scenario.requests > 500 || scenario.concurrency > 20) {
    throw new Error(`Onveilige loadbaselinegrens voor ${scenario.name}.`);
  }

  const url = new URL(scenario.path, BASE_URL).toString();
  for (let index = 0; index < 3; index += 1) {
    const warmup = await timedRequest(url);
    if (!warmup.ok) throw new Error(`${scenario.name}-warmup faalde.`);
  }

  const results = new Array(scenario.requests);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= scenario.requests) return;
      results[currentIndex] = await timedRequest(url);
    }
  };

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: scenario.concurrency }, () => worker()));
  const wallTimeMs = performance.now() - startedAt;

  const successful = results.filter(result => result.ok);
  const durations = successful
    .map(result => result.durationMs)
    .sort((left, right) => left - right);
  const successRatio = successful.length / results.length;
  const statusCounts = results.reduce((counts, result) => {
    const key = String(result.status ?? result.failure ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const p95Ms = percentile(durations, 95);

  return {
    name: scenario.name,
    path: scenario.path,
    requests: scenario.requests,
    concurrency: scenario.concurrency,
    successRatio,
    statusCounts,
    wallTimeMs: Number(wallTimeMs.toFixed(2)),
    requestsPerSecond: Number(((scenario.requests / wallTimeMs) * 1_000).toFixed(2)),
    latencyMs: {
      p50: percentile(durations, 50),
      p95: p95Ms,
      p99: percentile(durations, 99),
      max: durations.length ? Number(durations.at(-1).toFixed(2)) : null,
    },
    budget: {
      successRatio: 1,
      p95Ms: scenario.p95BudgetMs,
    },
    passed: successRatio === 1 && p95Ms !== null && p95Ms <= scenario.p95BudgetMs,
  };
}

const results = [];
for (const scenario of scenarios) results.push(await runScenario(scenario));

const report = {
  status: results.every(result => result.passed) ? "passed" : "failed",
  scope: "bounded-local-baseline-not-production-capacity-test",
  baseUrl: BASE_URL,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  results,
};

console.log(JSON.stringify(report, null, 2));
if (report.status !== "passed") process.exitCode = 1;
