import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ontbreekt voor queryplaninspectie.");

const connection = await mysql.createConnection(databaseUrl);

const checks = [
  {
    name: "portfolio_cursor_by_owner",
    sql: `EXPLAIN FORMAT='brief'
      SELECT id, userId, name, description, totalValue, currency, createdAt, updatedAt
      FROM portfolios
      WHERE userId = 1 AND id > 0
      ORDER BY id ASC
      LIMIT 26`,
  },
  {
    name: "etf_cursor_search",
    sql: `EXPLAIN FORMAT='brief'
      SELECT id, symbol, name, isin, ter, currency, assetClass, region, riskScore, createdAt, updatedAt
      FROM etfs
      WHERE id > 0 AND (symbol LIKE '%WORLD%' OR name LIKE '%WORLD%')
      ORDER BY id ASC
      LIMIT 26`,
  },
  {
    name: "etf_symbol_batch",
    sql: `EXPLAIN FORMAT='brief'
      SELECT id, symbol, name, isin, ter, currency, assetClass, region, riskScore, createdAt, updatedAt
      FROM etfs
      WHERE symbol IN ('VWRL', 'IWDA', 'CSPX')`,
  },
];

const plans = [];
try {
  for (const check of checks) {
    const [rows] = await connection.query(check.sql);
    plans.push({ name: check.name, rows });
  }
} finally {
  connection.destroy();
}

console.log(JSON.stringify({ status: "inspected", plans }, null, 2));
