import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ontbreekt");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [journal] = await connection.query(
    "SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY created_at ASC, id ASC",
  );
  const [checks] = await connection.query(
    `SELECT CONSTRAINT_NAME AS constraintName, TABLE_NAME AS tableName,
            CHECK_CLAUSE AS checkClause
       FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY CONSTRAINT_NAME`,
  );
  console.log(
    JSON.stringify(
      {
        readOnly: true,
        journal: journal.map(row => ({
          id: String(row.id),
          hash: String(row.hash),
          createdAt: Number(row.created_at),
        })),
        checks,
      },
      null,
      2,
    ),
  );
} finally {
  connection.destroy();
}
