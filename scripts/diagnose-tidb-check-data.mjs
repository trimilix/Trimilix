import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({ passed: false, error: "DATABASE_URL ontbreekt" }, null, 2));
  process.exit(1);
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [[capability]] = await connection.query(
    "SELECT @@GLOBAL.tidb_enable_check_constraint AS globalEnabled",
  );
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
            IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'etfs'
        AND COLUMN_NAME IN ('symbol', 'ter', 'riskScore')
      ORDER BY COLUMN_NAME`,
  );
  const [rows] = await connection.query(
    `SELECT symbol, ter, riskScore,
            (ter IS NULL) AS terIsNull,
            (ter >= 0) AS terNonnegative,
            (ter IS NULL OR ter >= 0) AS terConstraintExpression,
            (riskScore IS NULL OR (riskScore BETWEEN 1 AND 5)) AS riskConstraintExpression
       FROM etfs
      ORDER BY symbol`,
  );
  const [[counts]] = await connection.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN (ter IS NULL OR ter >= 0) THEN 0 ELSE 1 END) AS terFalse,
            SUM(CASE WHEN (ter IS NULL OR ter >= 0) IS NULL THEN 1 ELSE 0 END) AS terUnknown,
            SUM(CASE WHEN (riskScore IS NULL OR (riskScore BETWEEN 1 AND 5)) THEN 0 ELSE 1 END) AS riskFalse,
            SUM(CASE WHEN (riskScore IS NULL OR (riskScore BETWEEN 1 AND 5)) IS NULL THEN 1 ELSE 0 END) AS riskUnknown
       FROM etfs`,
  );

  console.log(
    JSON.stringify(
      {
        readOnly: true,
        capability: { tidbEnableCheckConstraintGlobal: Number(capability.globalEnabled) },
        columns,
        expressionCounts: counts,
        rows,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      { readOnly: true, error: error instanceof Error ? error.message : String(error) },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
