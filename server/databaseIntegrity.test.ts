import { describe, expect, it, vi } from "vitest";
import { getTableConfig } from "drizzle-orm/mysql-core";

import {
  etfs,
  goals,
  holdings,
  portfolios,
  users,
} from "../drizzle/schema";
import { executeInTransaction } from "./db";

function checkNames(table: Parameters<typeof getTableConfig>[0]): string[] {
  return getTableConfig(table).checks.map(item => item.name).sort();
}

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
