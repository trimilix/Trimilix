import { createHash, randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const projectRoot = process.cwd();
const migrationsDirectory = path.join(projectRoot, "drizzle");
const tablesInRestoreOrder = [
  "users",
  "etfs",
  "portfolios",
  "holdings",
  "goals",
  "subscriptions",
];

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error("Unsafe SQL identifier");
  }
  return `\`${identifier}\``;
}

function databaseUrl(databaseName) {
  const parsed = new URL(connectionString);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

async function migrationFiles() {
  const files = (await readdir(migrationsDirectory))
    .filter(file => /^\d{4}_.+\.sql$/.test(file))
    .sort();

  const journal = JSON.parse(
    await readFile(path.join(migrationsDirectory, "meta", "_journal.json"), "utf8"),
  );
  const journalFiles = journal.entries.map(entry => `${entry.tag}.sql`);

  if (JSON.stringify(files) !== JSON.stringify(journalFiles)) {
    throw new Error("Migration files and Drizzle journal are out of sync");
  }

  return files;
}

async function applyMigrations(connection, files) {
  for (const file of files) {
    const contents = await readFile(path.join(migrationsDirectory, file), "utf8");
    const statements = contents
      .split(/-->\s*statement-breakpoint/g)
      .map(statement => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await connection.query(statement);
    }
  }
}

async function insertRepresentativeData(connection) {
  const [userResult] = await connection.execute(
    "INSERT INTO users (openId, name, email, loginMethod, role, sessionVersion) VALUES (?, ?, ?, ?, ?, ?)",
    ["restore-rehearsal-user", "Restore rehearsal", "restore@example.invalid", "test", "user", 1],
  );
  const userId = Number(userResult.insertId);

  const [portfolioResult] = await connection.execute(
    "INSERT INTO portfolios (userId, name, description, totalValue, currency) VALUES (?, ?, ?, ?, ?)",
    [userId, "Recovery proof", "Isolated restore rehearsal", 125000, "EUR"],
  );
  const portfolioId = Number(portfolioResult.insertId);

  await connection.execute(
    "INSERT INTO etfs (symbol, name, isin, ter, currency, assetClass, region, riskScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ["TEST", "Recovery test instrument", "ZZ0000000001", 20, "EUR", "Equity", "Global", 4],
  );
  await connection.execute(
    "INSERT INTO holdings (portfolioId, etfTicker, etfName, shares, purchasePrice, currentPrice) VALUES (?, ?, ?, ?, ?, ?)",
    [portfolioId, "TEST", "Recovery test instrument", 10, 10000, 12500],
  );
  await connection.execute(
    "INSERT INTO goals (userId, name, targetAmount, currentAmount, targetDate) VALUES (?, ?, ?, ?, ?)",
    [userId, "Recovery target", 500000, 125000, new Date("2030-01-01T00:00:00.000Z")],
  );
  await connection.execute(
    "INSERT INTO subscriptions (userId, plan, status) VALUES (?, ?, ?)",
    [userId, "free", "active"],
  );

  return { userId, portfolioId };
}

function normalizeForChecksum(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  return value;
}

function checksum(rows) {
  const canonical = JSON.stringify(
    rows.map(row =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, normalizeForChecksum(value)]),
      ),
    ),
  );
  return createHash("sha256").update(canonical).digest("hex");
}

async function exportTables(connection) {
  const backup = {};
  for (const table of tablesInRestoreOrder) {
    const [rows] = await connection.query(
      `SELECT * FROM ${quoteIdentifier(table)} ORDER BY id ASC`,
    );
    backup[table] = rows;
  }
  return backup;
}

async function restoreTables(connection, backup) {
  for (const table of tablesInRestoreOrder) {
    for (const row of backup[table]) {
      const columns = Object.keys(row);
      const columnSql = columns.map(quoteIdentifier).join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      await connection.execute(
        `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders})`,
        Object.values(row),
      );
    }
  }
}

async function proveConstraints(connection, portfolioId) {
  let invalidHoldingRejected = false;
  try {
    await connection.execute(
      "INSERT INTO holdings (portfolioId, etfTicker, etfName, shares, purchasePrice, currentPrice) VALUES (?, ?, ?, ?, ?, ?)",
      [portfolioId, "INVALID", "Invalid holding", 0, -1, -1],
    );
  } catch {
    invalidHoldingRejected = true;
  }

  let duplicateHoldingRejected = false;
  try {
    await connection.execute(
      "INSERT INTO holdings (portfolioId, etfTicker, etfName, shares, purchasePrice, currentPrice) VALUES (?, ?, ?, ?, ?, ?)",
      [portfolioId, "TEST", "Duplicate holding", 1, 1, 1],
    );
  } catch {
    duplicateHoldingRejected = true;
  }

  let nullableEtfAccepted = false;
  try {
    await connection.execute(
      "INSERT INTO etfs (symbol, name, ter, currency, riskScore) VALUES (?, ?, ?, ?, ?)",
      ["NULLCHK", "Nullable constraint proof", null, "EUR", null],
    );
    nullableEtfAccepted = true;
  } catch {
    nullableEtfAccepted = false;
  }

  let negativeTerRejected = false;
  try {
    await connection.execute(
      "INSERT INTO etfs (symbol, name, ter, currency, riskScore) VALUES (?, ?, ?, ?, ?)",
      ["NEGTER", "Negative TER proof", -1, "EUR", 3],
    );
  } catch {
    negativeTerRejected = true;
  }

  let invalidRiskRejected = false;
  try {
    await connection.execute(
      "INSERT INTO etfs (symbol, name, ter, currency, riskScore) VALUES (?, ?, ?, ?, ?)",
      ["BADRISK", "Invalid risk proof", 10, "EUR", 6],
    );
  } catch {
    invalidRiskRejected = true;
  }

  return {
    invalidHoldingRejected,
    duplicateHoldingRejected,
    nullableEtfAccepted,
    negativeTerRejected,
    invalidRiskRejected,
  };
}

async function proveAtomicUpsert(connection, userId) {
  await connection.execute(
    `INSERT INTO subscriptions (userId, plan, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE plan = VALUES(plan), status = VALUES(status)`,
    [userId, "premium", "active"],
  );
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS rowCount, MAX(plan) AS plan FROM subscriptions WHERE userId = ?",
    [userId],
  );
  return Number(rows[0].rowCount) === 1 && rows[0].plan === "premium";
}

async function proveRollback(connection, userId) {
  const [beforeRows] = await connection.execute(
    "SELECT COUNT(*) AS rowCount FROM portfolios WHERE userId = ?",
    [userId],
  );

  await connection.beginTransaction();
  try {
    await connection.execute(
      "INSERT INTO portfolios (userId, name, totalValue, currency) VALUES (?, ?, ?, ?)",
      [userId, "Must roll back", 1, "EUR"],
    );
  } finally {
    await connection.rollback();
  }

  const [afterRows] = await connection.execute(
    "SELECT COUNT(*) AS rowCount FROM portfolios WHERE userId = ?",
    [userId],
  );
  return Number(beforeRows[0].rowCount) === Number(afterRows[0].rowCount);
}

async function schemaEvidence(connection) {
  const [tables] = await connection.query(
    "SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name",
  );
  const [checks] = await connection.query(
    "SELECT CONSTRAINT_NAME AS constraintName, CHECK_CLAUSE AS checkClause FROM information_schema.TIDB_CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() ORDER BY CONSTRAINT_NAME",
  );
  const [indexes] = await connection.query(
    "SELECT DISTINCT index_name AS indexName FROM information_schema.statistics WHERE table_schema = DATABASE() AND index_name IN ('goals_user_id_idx', 'holdings_portfolio_id_idx', 'holdings_portfolio_ticker_unique', 'portfolios_user_id_idx') ORDER BY index_name",
  );

  return {
    tables: tables.map(row => row.tableName),
    checks: checks.map(row => ({
      constraintName: row.constraintName,
      checkClause: row.checkClause,
    })),
    indexes: indexes.map(row => row.indexName),
  };
}

const suffix = `${Date.now()}_${randomBytes(3).toString("hex")}`;
const sourceDatabase = `trimilix_verify_source_${suffix}`;
const restoredDatabase = `trimilix_verify_restore_${suffix}`;
const admin = await mysql.createConnection(connectionString);
let source;
let restored;
let exitCode = 0;

try {
  const files = await migrationFiles();
  await admin.query(`CREATE DATABASE ${quoteIdentifier(sourceDatabase)}`);
  await admin.query(`CREATE DATABASE ${quoteIdentifier(restoredDatabase)}`);

  source = await mysql.createConnection(databaseUrl(sourceDatabase));
  restored = await mysql.createConnection(databaseUrl(restoredDatabase));

  await applyMigrations(source, files);
  const ids = await insertRepresentativeData(source);
  const sourceEvidence = await schemaEvidence(source);
  const constraints = await proveConstraints(source, ids.portfolioId);
  const atomicUpsertPassed = await proveAtomicUpsert(source, ids.userId);
  const rollbackPassed = await proveRollback(source, ids.userId);

  const backup = await exportTables(source);
  await applyMigrations(restored, files);
  await restoreTables(restored, backup);
  const restoredBackup = await exportTables(restored);

  const tableEvidence = Object.fromEntries(
    tablesInRestoreOrder.map(table => [
      table,
      {
        sourceRows: backup[table].length,
        restoredRows: restoredBackup[table].length,
        sourceChecksum: checksum(backup[table]),
        restoredChecksum: checksum(restoredBackup[table]),
        checksumMatches: checksum(backup[table]) === checksum(restoredBackup[table]),
      },
    ]),
  );

  const expectedTables = [...tablesInRestoreOrder].sort();
  const normalizeClause = value =>
    String(value)
      .replace(/`/g, "")
      .replace(/[()]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
  const etfTerClause = sourceEvidence.checks.find(
    check => check.constraintName === "etfs_ter_nonnegative",
  );
  const etfRiskClause = sourceEvidence.checks.find(
    check => check.constraintName === "etfs_risk_score_range",
  );
  const nullableCheckClausesPassed =
    normalizeClause(etfTerClause?.checkClause) === "ter>=0" &&
    normalizeClause(etfRiskClause?.checkClause) === "riskscorebetween1and5";

  const passed =
    JSON.stringify(sourceEvidence.tables) === JSON.stringify(expectedTables) &&
    sourceEvidence.checks.length === 9 &&
    sourceEvidence.indexes.length === 4 &&
    constraints.invalidHoldingRejected &&
    constraints.duplicateHoldingRejected &&
    constraints.nullableEtfAccepted &&
    constraints.negativeTerRejected &&
    constraints.invalidRiskRejected &&
    nullableCheckClausesPassed &&
    atomicUpsertPassed &&
    rollbackPassed &&
    Object.values(tableEvidence).every(item => item.checksumMatches);

  const report = {
    passed,
    migrationCount: files.length,
    migrationFiles: files,
    isolatedDatabases: true,
    productionDataTouched: false,
    schema: sourceEvidence,
    integrity: constraints,
    nullableCheckClausesPassed,
    atomicUpsertPassed,
    rollbackPassed,
    restore: tableEvidence,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!passed) exitCode = 1;
} catch (error) {
  exitCode = 1;
  console.error(
    JSON.stringify(
      {
        passed: false,
        error: error instanceof Error ? error.message : "Unknown recovery rehearsal error",
      },
      null,
      2,
    ),
  );
} finally {
  await source?.end().catch(() => undefined);
  await restored?.end().catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(sourceDatabase)}`).catch(() => undefined);
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(restoredDatabase)}`).catch(() => undefined);
  await admin.end().catch(() => undefined);
  process.exit(exitCode);
}
