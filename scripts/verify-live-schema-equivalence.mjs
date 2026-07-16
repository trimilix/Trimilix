import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({ passed: false, error: "DATABASE_URL ontbreekt" }, null, 2));
  process.exit(1);
}

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

const connection = await mysql.createConnection(databaseUrl);

const normalizeDefault = value => (value === null ? null : String(value));
const asCount = rows => Number(rows[0]?.violationCount ?? 0);

try {
  const [[capability]] = await connection.query(
    "SELECT @@GLOBAL.tidb_enable_check_constraint AS enabled",
  );
  const [columns] = await connection.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
            DATA_TYPE AS dataType, COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND ((TABLE_NAME = 'users' AND COLUMN_NAME = 'sessionVersion')
          OR (TABLE_NAME = 'etfs' AND COLUMN_NAME = 'riskScore'))
      ORDER BY TABLE_NAME, COLUMN_NAME`,
  );
  const [checks] = await connection.query(
    `SELECT CONSTRAINT_NAME AS constraintName, TABLE_NAME AS tableName
       FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY CONSTRAINT_NAME`,
  );
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME AS indexName, TABLE_NAME AS tableName,
            NON_UNIQUE AS nonUnique,
            GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND INDEX_NAME IN (${EXPECTED_INDEXES.map(() => "?").join(", ")})
      GROUP BY INDEX_NAME, TABLE_NAME, NON_UNIQUE
      ORDER BY INDEX_NAME`,
    EXPECTED_INDEXES,
  );

  const violationQueries = {
    etfs: "SELECT COUNT(*) AS violationCount FROM etfs WHERE (ter IS NOT NULL AND ter < 0) OR (riskScore IS NOT NULL AND (riskScore < 1 OR riskScore > 5))",
    goals: "SELECT COUNT(*) AS violationCount FROM goals WHERE targetAmount <= 0 OR currentAmount < 0",
    holdings: "SELECT COUNT(*) AS violationCount FROM holdings WHERE shares <= 0 OR purchasePrice < 0 OR currentPrice < 0",
    portfolios: "SELECT COUNT(*) AS violationCount FROM portfolios WHERE totalValue < 0",
    users: "SELECT COUNT(*) AS violationCount FROM users WHERE sessionVersion < 1",
    duplicateHoldings: "SELECT COUNT(*) AS violationCount FROM (SELECT portfolioId, etfTicker FROM holdings GROUP BY portfolioId, etfTicker HAVING COUNT(*) > 1) duplicates",
  };

  const violations = {};
  for (const [name, query] of Object.entries(violationQueries)) {
    const [rows] = await connection.query(query);
    violations[name] = asCount(rows);
  }

  const sessionVersion = columns.find(
    column => column.tableName === "users" && column.columnName === "sessionVersion",
  );
  const riskScore = columns.find(
    column => column.tableName === "etfs" && column.columnName === "riskScore",
  );
  const actualChecks = checks.map(check => check.constraintName).sort();
  const actualIndexes = indexes.map(index => index.indexName).sort();

  const migration0004 = Boolean(
    sessionVersion &&
      sessionVersion.dataType === "int" &&
      sessionVersion.isNullable === "NO" &&
      normalizeDefault(sessionVersion.columnDefault) === "1",
  );
  const migration0005 = Boolean(
    riskScore &&
      riskScore.dataType === "int" &&
      riskScore.isNullable === "YES" &&
      normalizeDefault(riskScore.columnDefault) === null,
  );
  const migration0006 =
    Number(capability.enabled) === 1 &&
    JSON.stringify(actualChecks) === JSON.stringify(EXPECTED_CHECKS) &&
    JSON.stringify(actualIndexes) === JSON.stringify(EXPECTED_INDEXES) &&
    Object.values(violations).every(count => count === 0) &&
    indexes.some(
      index =>
        index.indexName === "holdings_portfolio_ticker_unique" &&
        Number(index.nonUnique) === 0 &&
        index.columns === "portfolioId,etfTicker",
    );

  const report = {
    passed: migration0004 && migration0005 && migration0006,
    readOnly: true,
    capability: { tidbEnableCheckConstraint: Number(capability.enabled) },
    migrations: {
      "0004_spicy_hercules": migration0004,
      "0005_nice_retro_girl": migration0005,
      "0006_funny_madripoor": migration0006,
    },
    columns,
    checks: {
      expected: EXPECTED_CHECKS,
      actual: actualChecks,
      missing: EXPECTED_CHECKS.filter(name => !actualChecks.includes(name)),
      unexpected: actualChecks.filter(name => !EXPECTED_CHECKS.includes(name)),
    },
    indexes: {
      expected: EXPECTED_INDEXES,
      actual: actualIndexes,
      details: indexes,
      missing: EXPECTED_INDEXES.filter(name => !actualIndexes.includes(name)),
    },
    violations,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} catch (error) {
  console.error(
    JSON.stringify(
      {
        passed: false,
        readOnly: true,
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
