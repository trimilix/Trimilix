import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { logEvent } from "./logger";

export const EXPECTED_DATABASE_CHECKS = [
  "etfs_risk_score_range",
  "etfs_ter_nonnegative",
  "goals_current_amount_nonnegative",
  "goals_target_amount_positive",
  "holdings_current_price_nonnegative",
  "holdings_purchase_price_nonnegative",
  "holdings_shares_positive",
  "portfolios_total_value_nonnegative",
  "users_session_version_positive",
] as const;

export const DATABASE_INTEGRITY_TIMEOUT_MS = 10_000;

type DatabaseIntegritySnapshot = {
  capabilityEnabled: number;
  checkNames: string[];
};

export type DatabaseIntegrityReader = () => Promise<DatabaseIntegritySnapshot>;

function normalizedCheckNames(checkNames: string[]): string[] {
  return Array.from(new Set(checkNames)).sort();
}

async function readDatabaseIntegritySnapshot(): Promise<DatabaseIntegritySnapshot> {
  const db = await getDb();
  if (!db) throw new Error("DatabaseUnavailable");

  const [capabilityRows] = await db.execute(
    sql`SELECT @@GLOBAL.tidb_enable_check_constraint AS enabled`,
  ) as unknown as [Array<{ enabled: number | string }>, unknown];
  const [checkRows] = await db.execute(sql`
    SELECT CONSTRAINT_NAME AS name
    FROM INFORMATION_SCHEMA.TIDB_CHECK_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    ORDER BY CONSTRAINT_NAME
  `) as unknown as [Array<{ name: string }>, unknown];

  return {
    capabilityEnabled: Number(capabilityRows[0]?.enabled ?? 0),
    checkNames: normalizedCheckNames(checkRows.map(row => String(row.name))),
  };
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error("DatabaseIntegrityTimeout")), timeoutMs);
    timeout.unref?.();
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function assertDatabaseIntegrity(
  reader: DatabaseIntegrityReader = readDatabaseIntegritySnapshot,
  timeoutMs = DATABASE_INTEGRITY_TIMEOUT_MS,
): Promise<DatabaseIntegritySnapshot> {
  let snapshot: DatabaseIntegritySnapshot;
  try {
    snapshot = await withTimeout(reader(), timeoutMs);
  } catch (error) {
    logEvent("error", "database_integrity_preflight_failed", {
      reason: "probe_failed",
      error,
    });
    throw error;
  }

  if (snapshot.capabilityEnabled !== 1) {
    logEvent("error", "database_integrity_preflight_failed", {
      reason: "check_capability_disabled",
    });
    throw new Error("DatabaseCheckCapabilityDisabled");
  }

  const actual = normalizedCheckNames(snapshot.checkNames);
  const expected: string[] = Array.from(EXPECTED_DATABASE_CHECKS).sort();
  const missing = expected.filter(name => !actual.includes(name));
  const unexpected = actual.filter(name => !expected.includes(name));

  if (missing.length > 0 || unexpected.length > 0) {
    logEvent("error", "database_integrity_preflight_failed", {
      reason: "constraint_set_mismatch",
      missingConstraints: missing,
      unexpectedConstraints: unexpected,
    });
    throw new Error("DatabaseConstraintSetMismatch");
  }

  logEvent("info", "database_integrity_preflight_passed", {
    checkConstraintCount: actual.length,
  });
  return {
    capabilityEnabled: snapshot.capabilityEnabled,
    checkNames: actual,
  };
}
