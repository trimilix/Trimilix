import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTableConfig } from "drizzle-orm/mysql-core";

import {
  etfs,
  goals,
  holdings,
  portfolios,
  users,
} from "../drizzle/schema";
import { executeInTransaction } from "./db";
import {
  assertDatabaseIntegrity,
  EXPECTED_DATABASE_CHECKS,
} from "./_core/databaseIntegrity";
import { setLogSinkForTests } from "./_core/logger";

function checkNames(table: Parameters<typeof getTableConfig>[0]): string[] {
  return getTableConfig(table).checks.map(item => item.name).sort();
}

const integrityLogLines: string[] = [];

beforeEach(() => {
  integrityLogLines.length = 0;
  setLogSinkForTests(line => integrityLogLines.push(line));
});

afterEach(() => {
  setLogSinkForTests(null);
});

function indexConfigs(table: Parameters<typeof getTableConfig>[0]) {
  return getTableConfig(table).indexes.map(item => ({
    name: item.config.name,
    unique: item.config.unique === true,
  }));
}

describe("database integrity schema", () => {
  it("enforces positive session versions", () => {
    expect(checkNames(users)).toEqual(["users_session_version_positive"]);
  });

  it("enforces nonnegative portfolio values and indexes ownership lookups", () => {
    expect(checkNames(portfolios)).toContain(
      "portfolios_total_value_nonnegative",
    );
    expect(indexConfigs(portfolios)).toContainEqual({
      name: "portfolios_user_id_idx",
      unique: false,
    });
  });

  it("enforces valid holdings and one ticker per portfolio", () => {
    expect(checkNames(holdings)).toEqual([
      "holdings_current_price_nonnegative",
      "holdings_purchase_price_nonnegative",
      "holdings_shares_positive",
    ]);
    expect(indexConfigs(holdings)).toEqual(
      expect.arrayContaining([
        { name: "holdings_portfolio_id_idx", unique: false },
        { name: "holdings_portfolio_ticker_unique", unique: true },
      ]),
    );
  });

  it("enforces valid goal amounts and indexes ownership lookups", () => {
    expect(checkNames(goals)).toEqual([
      "goals_current_amount_nonnegative",
      "goals_target_amount_positive",
    ]);
    expect(indexConfigs(goals)).toContainEqual({
      name: "goals_user_id_idx",
      unique: false,
    });
  });

  it("enforces ETF fee and educational-risk boundaries", () => {
    expect(checkNames(etfs)).toEqual([
      "etfs_risk_score_range",
      "etfs_ter_nonnegative",
    ]);
  });
});

describe("database startup integrity preflight", () => {
  it("accepts only enabled enforcement with the exact normalized constraint set", async () => {
    const checks = Array.from(EXPECTED_DATABASE_CHECKS).reverse();
    const snapshot = await assertDatabaseIntegrity(async () => ({
      capabilityEnabled: 1,
      checkNames: checks,
    }));

    expect(snapshot.capabilityEnabled).toBe(1);
    expect(snapshot.checkNames).toEqual(Array.from(EXPECTED_DATABASE_CHECKS).sort());
    expect(integrityLogLines.join("\n")).toContain(
      "database_integrity_preflight_passed",
    );
  });

  it("fails closed when TiDB CHECK enforcement is disabled", async () => {
    await expect(
      assertDatabaseIntegrity(async () => ({
        capabilityEnabled: 0,
        checkNames: Array.from(EXPECTED_DATABASE_CHECKS),
      })),
    ).rejects.toThrow("DatabaseCheckCapabilityDisabled");
    expect(integrityLogLines.join("\n")).toContain(
      "check_capability_disabled",
    );
  });

  it("fails closed on missing or unexpected constraints", async () => {
    await expect(
      assertDatabaseIntegrity(async () => ({
        capabilityEnabled: 1,
        checkNames: [
          ...Array.from(EXPECTED_DATABASE_CHECKS).slice(1),
          "unexpected_check",
        ],
      })),
    ).rejects.toThrow("DatabaseConstraintSetMismatch");

    const output = integrityLogLines.join("\n");
    expect(output).toContain("constraint_set_mismatch");
    expect(output).toContain(EXPECTED_DATABASE_CHECKS[0]);
    expect(output).toContain("unexpected_check");
  });

  it("fails within the configured deadline when the integrity probe stalls", async () => {
    await expect(
      assertDatabaseIntegrity(() => new Promise(() => undefined), 10),
    ).rejects.toThrow("DatabaseIntegrityTimeout");
    expect(integrityLogLines.join("\n")).toContain("probe_failed");
  });
});

describe("transaction boundary", () => {
  it("delegates an operation exactly once and returns its result", async () => {
    const transaction = vi.fn(
      async <TResult>(operation: (tx: { id: string }) => Promise<TResult>) =>
        operation({ id: "tx-1" }),
    );

    const result = await executeInTransaction(
      { transaction },
      async tx => `completed:${tx.id}`,
    );

    expect(result).toBe("completed:tx-1");
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("propagates operation failures so the database can roll back", async () => {
    const transaction = vi.fn(
      async <TResult>(operation: (tx: { id: string }) => Promise<TResult>) =>
        operation({ id: "tx-2" }),
    );

    await expect(
      executeInTransaction({ transaction }, async () => {
        throw new Error("financial mutation failed");
      }),
    ).rejects.toThrow("financial mutation failed");
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
