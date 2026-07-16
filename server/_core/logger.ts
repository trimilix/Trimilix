import process from "node:process";

export type LogLevel = "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;
export type LogSink = (line: string, level: LogLevel) => void;

const MAX_STRING_LENGTH = 512;
const MAX_ARRAY_ITEMS = 25;
const MAX_OBJECT_DEPTH = 4;
const SAFE_EVENT_PATTERN = /^[a-z0-9_.-]{1,80}$/;
const SENSITIVE_KEY_PATTERN =
  /authorization|cookie|token|secret|password|passwd|jwt|session|email|openid|open_id|body|payload|requestheaders|responseheaders|stack|ip(address)?/i;

let testSink: LogSink | null = null;

function truncate(value: string): string {
  const normalized = value.replace(/[\r\n\u2028\u2029]+/g, " ");
  return normalized.length <= MAX_STRING_LENGTH
    ? normalized
    : `${normalized.slice(0, MAX_STRING_LENGTH)}…`;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_OBJECT_DEPTH) return "[TRUNCATED]";
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }
  if (typeof value === "string") return truncate(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: truncate(value.name || "Error") };
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map(item => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const sanitized: LogFields = {};
    for (const [key, nestedValue] of Object.entries(value as LogFields)) {
      const normalizedKey = truncate(key);
      sanitized[normalizedKey] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : sanitizeValue(nestedValue, depth + 1);
    }
    return sanitized;
  }
  return truncate(String(value));
}

function defaultSink(line: string, level: LogLevel): void {
  const stream = level === "info" ? process.stdout : process.stderr;
  stream.write(`${line}\n`);
}

export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
): void {
  const safeEvent = SAFE_EVENT_PATTERN.test(event) ? event : "invalid_event_name";
  const sanitizedFields = sanitizeValue(fields, 0) as LogFields;
  const record = {
    ...sanitizedFields,
    timestamp: new Date().toISOString(),
    level,
    service: "trimilix-web",
    environment: process.env.NODE_ENV ?? "development",
    event: safeEvent,
  };
  (testSink ?? defaultSink)(JSON.stringify(record), level);
}

export function setLogSinkForTests(sink: LogSink | null): void {
  if (!process.env.VITEST && process.env.NODE_ENV !== "test" && sink) {
    throw new Error("A custom log sink is only allowed in test mode");
  }
  testSink = sink;
}
