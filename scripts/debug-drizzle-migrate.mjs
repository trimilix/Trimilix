import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL ontbreekt; migratiediagnose is gestopt.");
  process.exit(1);
}

const connection = await mysql.createConnection(databaseUrl);
const db = drizzle(connection);

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log(JSON.stringify({ passed: true }, null, 2));
} catch (error) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
  const sanitize = value => {
    if (!value || typeof value !== "object") return String(value ?? "");
    return {
      name: value.name,
      message: value.message,
      code: value.code,
      errno: value.errno,
      sqlState: value.sqlState,
      sqlMessage: value.sqlMessage,
    };
  };

  console.error(
    JSON.stringify(
      {
        passed: false,
        error: sanitize(error),
        cause: sanitize(cause),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
