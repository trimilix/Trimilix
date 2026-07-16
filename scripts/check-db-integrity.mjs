import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const connection = await mysql.createConnection(connectionString);

try {
  const [databaseRows] = await connection.query(
    "SELECT DATABASE() AS activeDatabase, VERSION() AS databaseVersion",
  );

  const [countRows] = await connection.query(`
    SELECT 'users' AS tableName, COUNT(*) AS rowCount FROM users
    UNION ALL SELECT 'portfolios', COUNT(*) FROM portfolios
    UNION ALL SELECT 'holdings', COUNT(*) FROM holdings
    UNION ALL SELECT 'goals', COUNT(*) FROM goals
    UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
    UNION ALL SELECT 'etfs', COUNT(*) FROM etfs
  `);

  const [violationRows] = await connection.query(`
    SELECT 'users.sessionVersion<1' AS violation, COUNT(*) AS violationCount
      FROM users WHERE sessionVersion < 1
    UNION ALL SELECT 'portfolios.totalValue<0', COUNT(*)
      FROM portfolios WHERE totalValue < 0
    UNION ALL SELECT 'holdings.shares<=0', COUNT(*)
      FROM holdings WHERE shares <= 0
    UNION ALL SELECT 'holdings.purchasePrice<0', COUNT(*)
      FROM holdings WHERE purchasePrice < 0
    UNION ALL SELECT 'holdings.currentPrice<0', COUNT(*)
      FROM holdings WHERE currentPrice < 0
    UNION ALL SELECT 'goals.targetAmount<=0', COUNT(*)
      FROM goals WHERE targetAmount <= 0
    UNION ALL SELECT 'goals.currentAmount<0', COUNT(*)
      FROM goals WHERE currentAmount < 0
    UNION ALL SELECT 'etfs.ter<0', COUNT(*)
      FROM etfs WHERE ter < 0
    UNION ALL SELECT 'etfs.riskScore.invalid', COUNT(*)
      FROM etfs
      WHERE riskScore IS NOT NULL AND (riskScore < 1 OR riskScore > 5)
  `);

  const [duplicateHoldingRows] = await connection.query(`
    SELECT portfolioId, etfTicker, COUNT(*) AS duplicateCount
    FROM holdings
    GROUP BY portfolioId, etfTicker
    HAVING COUNT(*) > 1
  `);

  const violations = violationRows.map((row) => ({
    violation: row.violation,
    violationCount: Number(row.violationCount),
  }));
  const duplicateHoldings = duplicateHoldingRows.map((row) => ({
    portfolioId: Number(row.portfolioId),
    etfTicker: row.etfTicker,
    duplicateCount: Number(row.duplicateCount),
  }));

  const report = {
    database: {
      activeDatabase: databaseRows[0]?.activeDatabase ?? null,
      databaseVersion: databaseRows[0]?.databaseVersion ?? null,
    },
    rowCounts: countRows.map((row) => ({
      tableName: row.tableName,
      rowCount: Number(row.rowCount),
    })),
    violations,
    duplicateHoldings,
    passed:
      violations.every((item) => item.violationCount === 0) &&
      duplicateHoldings.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await connection.end();
}
