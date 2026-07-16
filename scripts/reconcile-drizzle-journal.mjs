import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({ passed: false, error: "DATABASE_URL ontbreekt" }, null, 2));
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const MIGRATIONS_DIR = path.resolve("drizzle");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta", "_journal.json");
const TARGET_TAGS = [
  "0004_spicy_hercules",
  "0005_nice_retro_girl",
  "0006_funny_madripoor",
];
const EXPECTED_CHECKS = [
  "etfs_risk_score_range",
  "etfs_ter_nonnegative",
  "goals_current_amount_nonnegative",
  "goals_target_amount_positive",
  "holdings_current_price_nonnegative",
  "holdings_purchase_price_nonnegative",
  "holdings_shares_positive",
  "portfolios_total_value_nonnegative",
  "users_session_version_positive",
];
const EXPECTED_INDEXES = [
  "goals_user_id_idx",
  "holdings_portfolio_id_idx",
  "holdings_portfolio_ticker_unique",
  "portfolios_user_id_idx",
];

const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8"));
const migrations = journal.entries.map(entry => {
  const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
  const query = fs.readFileSync(sqlPath, "utf8");
  return {
    idx: entry.idx,
    tag: entry.tag,
    when: Number(entry.when),
    hash: crypto.createHash("sha256").update(query).digest("hex"),
  };
});
const targets = migrations.filter(migration => TARGET_TAGS.includes(migration.tag));
const expectedPrefix = migrations.filter(migration => migration.idx < 4);
const expectedAfterReconciliation = migrations.filter(migration => migration.idx <= 6);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const asNumber = value => Number(value);
const normalizeRows = rows =>
  rows.map(row => ({
    id: String(row.id),
    hash: String(row.hash),
    createdAt: asNumber(row.created_at),
  }));
const comparable = rows => rows.map(row => ({ hash: row.hash, createdAt: row.createdAt }));
const expectedComparable = entries =>
  entries.map(entry => ({ hash: entry.hash, createdAt: entry.when }));
const arraysEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const connection = await mysql.createConnection(databaseUrl);
let transactionOpen = false;

try {
  const [[capability]] = await connection.query(
    "SELECT @@GLOBAL.tidb_enable_check_constraint AS enabled",
  );
  assert(
    asNumber(capability.enabled) === 1,
    "TiDB CHECK-enforcement staat niet aan; journalreconciliatie is geblokkeerd.",
  );

  const [columns] = await connection.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
            DATA_TYPE AS dataType, IS_NULLABLE AS isNullable,
            COLUMN_DEFAULT AS columnDefault
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND ((TABLE_NAME = 'users' AND COLUMN_NAME = 'sessionVersion')
          OR (TABLE_NAME = 'etfs' AND COLUMN_NAME = 'riskScore'))
      ORDER BY TABLE_NAME, COLUMN_NAME`,
  );
  const sessionVersion = columns.find(
    column => column.tableName === "users" && column.columnName === "sessionVersion",
  );
  const riskScore = columns.find(
    column => column.tableName === "etfs" && column.columnName === "riskScore",
  );
  assert(
    sessionVersion?.dataType === "int" &&
      sessionVersion?.isNullable === "NO" &&
      String(sessionVersion?.columnDefault) === "1",
    "Migratie 0004 is niet schema-equivalent; journalreconciliatie is geblokkeerd.",
  );
  assert(
    riskScore?.dataType === "int" &&
      riskScore?.isNullable === "YES" &&
      riskScore?.columnDefault === null,
    "Migratie 0005 is niet schema-equivalent; journalreconciliatie is geblokkeerd.",
  );

  const [checks] = await connection.query(
    `SELECT CONSTRAINT_NAME AS name
       FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY CONSTRAINT_NAME`,
  );
  const actualChecks = checks.map(row => row.name).sort();
  assert(
    arraysEqual(actualChecks, EXPECTED_CHECKS),
    `Migratie 0006 mist of bevat onverwachte CHECKs: ${JSON.stringify(actualChecks)}`,
  );

  const [indexes] = await connection.query(
    `SELECT INDEX_NAME AS name, NON_UNIQUE AS nonUnique,
            GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND INDEX_NAME IN (${EXPECTED_INDEXES.map(() => "?").join(", ")})
      GROUP BY INDEX_NAME, NON_UNIQUE
      ORDER BY INDEX_NAME`,
    EXPECTED_INDEXES,
  );
  const actualIndexes = indexes.map(row => row.name).sort();
  assert(
    arraysEqual(actualIndexes, EXPECTED_INDEXES),
    `Migratie 0006 mist vereiste indexen: ${JSON.stringify(actualIndexes)}`,
  );
  const uniqueHolding = indexes.find(row => row.name === "holdings_portfolio_ticker_unique");
  assert(
    uniqueHolding && asNumber(uniqueHolding.nonUnique) === 0 && uniqueHolding.columns === "portfolioId,etfTicker",
    "De holdings business-key is niet als unieke samengestelde index geregistreerd.",
  );

  const violationQueries = {
    etfs:
      "SELECT COUNT(*) AS count FROM etfs WHERE (ter IS NOT NULL AND ter < 0) OR (riskScore IS NOT NULL AND (riskScore < 1 OR riskScore > 5))",
    goals:
      "SELECT COUNT(*) AS count FROM goals WHERE targetAmount <= 0 OR currentAmount < 0",
    holdings:
      "SELECT COUNT(*) AS count FROM holdings WHERE shares <= 0 OR purchasePrice < 0 OR currentPrice < 0",
    portfolios: "SELECT COUNT(*) AS count FROM portfolios WHERE totalValue < 0",
    users: "SELECT COUNT(*) AS count FROM users WHERE sessionVersion < 1",
    duplicateHoldings:
      "SELECT COUNT(*) AS count FROM (SELECT portfolioId, etfTicker FROM holdings GROUP BY portfolioId, etfTicker HAVING COUNT(*) > 1) duplicates",
  };
  const violations = {};
  for (const [name, query] of Object.entries(violationQueries)) {
    const [[row]] = await connection.query(query);
    violations[name] = asNumber(row.count);
  }
  assert(
    Object.values(violations).every(count => count === 0),
    `Bestaande data schendt de gereconcilieerde garanties: ${JSON.stringify(violations)}`,
  );

  const [beforeRowsRaw] = await connection.query(
    "SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY created_at ASC, id ASC",
  );
  const before = normalizeRows(beforeRowsRaw);
  assert(targets.length === 3, "De lokale migratiedoelen 0004–0006 zijn niet exact gevonden.");
  assert(
    before.length <= migrations.length &&
      arraysEqual(comparable(before), expectedComparable(migrations.slice(0, before.length))),
    "Het bestaande Drizzle-journal is geen exacte officiële prefix van de lokale migratieketen; reconciliatie is geblokkeerd.",
  );
  assert(
    before.length === expectedPrefix.length || before.length >= expectedAfterReconciliation.length,
    "Het Drizzle-journal bevat een gedeeltelijke 0004–0006-reconciliatie; automatische voortzetting is fail-closed geblokkeerd.",
  );

  const alreadyReconciled = before.length >= expectedAfterReconciliation.length;
  const planned = alreadyReconciled
    ? []
    : targets.map(({ tag, when, hash }) => ({ tag, createdAt: when, hash }));
  const pendingAfterReconciliation = migrations
    .slice(expectedAfterReconciliation.length)
    .map(migration => migration.tag);

  if (!APPLY || alreadyReconciled) {
    console.log(
      JSON.stringify(
        {
          passed: true,
          mode: APPLY ? "apply-no-op" : "dry-run",
          readOnly: true,
          schemaEquivalent: true,
          journalState: alreadyReconciled ? "already-reconciled" : "requires-0004-0006",
          existingDataViolations: violations,
          before,
          planned,
          pendingAfterReconciliation: alreadyReconciled ? [] : pendingAfterReconciliation,
        },
        null,
        2,
      ),
    );
  } else {
    await connection.beginTransaction();
    transactionOpen = true;
    for (const migration of targets) {
      await connection.execute(
        "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)",
        [migration.hash, migration.when],
      );
    }

    const [transactionRowsRaw] = await connection.query(
      "SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY created_at ASC, id ASC",
    );
    const transactionRows = normalizeRows(transactionRowsRaw);
    assert(
      arraysEqual(
        comparable(transactionRows),
        expectedComparable(expectedAfterReconciliation),
      ),
      "De journalinhoud wijkt binnen de transactie af; rollback wordt uitgevoerd.",
    );

    await connection.commit();
    transactionOpen = false;

    const [afterRowsRaw] = await connection.query(
      "SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY created_at ASC, id ASC",
    );
    const after = normalizeRows(afterRowsRaw);
    assert(
      arraysEqual(comparable(after), expectedComparable(expectedAfterReconciliation)),
      "De gecommitte journalinhoud is niet exact 0000–0006.",
    );

    console.log(
      JSON.stringify(
        {
          passed: true,
          mode: "apply",
          schemaEquivalent: true,
          journalState: "reconciled-0004-0006",
          existingDataViolations: violations,
          before,
          inserted: planned,
          after,
          pendingAfterReconciliation,
        },
        null,
        2,
      ),
    );
  }
} catch (error) {
  if (transactionOpen) {
    try {
      await connection.rollback();
    } catch {
      // De oorspronkelijke fout blijft leidend; connection.destroy() volgt.
    }
  }
  console.error(
    JSON.stringify(
      {
        passed: false,
        mode: APPLY ? "apply" : "dry-run",
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  connection.destroy();
}
