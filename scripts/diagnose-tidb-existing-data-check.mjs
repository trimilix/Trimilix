import "dotenv/config";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({ passed: false, error: "DATABASE_URL ontbreekt" }, null, 2));
  process.exit(1);
}

const base = new URL(databaseUrl);
const sourceDatabase = base.pathname.replace(/^\//, "");
const diagnosticDatabase = `trimilix_check_diag_${crypto.randomBytes(6).toString("hex")}`;
const adminUrl = new URL(databaseUrl);
adminUrl.pathname = "/test";

const connection = await mysql.createConnection(adminUrl.toString());
const quote = identifier => `\`${identifier.replaceAll("`", "``")}\``;
const report = {
  isolated: true,
  sourceDataModified: false,
  diagnosticDatabaseDropped: false,
  sourceDatabase,
  diagnosticDatabase,
  attempts: [],
};

try {
  await connection.query(`CREATE DATABASE ${quote(diagnosticDatabase)}`);
  await connection.query(`USE ${quote(diagnosticDatabase)}`);
  await connection.query(
    `CREATE TABLE etfs (
      id int NOT NULL AUTO_INCREMENT,
      symbol varchar(10) NOT NULL,
      ter int DEFAULT NULL,
      riskScore int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY symbol_unique (symbol)
    )`,
  );
  await connection.query(
    `INSERT INTO etfs (id, symbol, ter, riskScore)
     SELECT id, symbol, ter, riskScore FROM ${quote(sourceDatabase)}.etfs`,
  );

  const [rows] = await connection.query(
    `SELECT symbol, ter, riskScore,
            (ter IS NULL OR ter >= 0) AS originalTer,
            (COALESCE(ter, 0) >= 0) AS coalesceTer,
            (riskScore IS NULL OR riskScore BETWEEN 1 AND 5) AS originalRisk,
            (COALESCE(riskScore, 1) BETWEEN 1 AND 5) AS coalesceRisk
       FROM etfs ORDER BY symbol`,
  );
  report.rows = rows;

  const tryConstraint = async (name, expression) => {
    try {
      await connection.query(
        `ALTER TABLE etfs ADD CONSTRAINT ${quote(name)} CHECK (${expression})`,
      );
      report.attempts.push({ name, expression, added: true });
      await connection.query(`ALTER TABLE etfs DROP CONSTRAINT ${quote(name)}`);
    } catch (error) {
      report.attempts.push({
        name,
        expression,
        added: false,
        errorCode: error?.code ?? null,
        errno: error?.errno ?? null,
        sqlState: error?.sqlState ?? null,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  await tryConstraint("diag_original_ter", "ter IS NULL OR ter >= 0");
  await tryConstraint("diag_standard_ter", "ter >= 0");
  await tryConstraint("diag_coalesce_ter", "COALESCE(ter, 0) >= 0");
  await tryConstraint(
    "diag_original_risk",
    "riskScore IS NULL OR (riskScore BETWEEN 1 AND 5)",
  );
  await tryConstraint(
    "diag_standard_risk",
    "riskScore BETWEEN 1 AND 5",
  );
  await tryConstraint(
    "diag_coalesce_risk",
    "COALESCE(riskScore, 1) BETWEEN 1 AND 5",
  );

  report.passed = true;
} catch (error) {
  report.passed = false;
  report.error = error instanceof Error ? error.message : String(error);
} finally {
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quote(diagnosticDatabase)}`);
    report.diagnosticDatabaseDropped = true;
  } catch (cleanupError) {
    report.cleanupError =
      cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
  }
  await connection.end();
}

console.log(JSON.stringify(report, null, 2));
if (!report.passed || !report.diagnosticDatabaseDropped) process.exitCode = 1;
