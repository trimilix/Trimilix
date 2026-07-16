import process from "node:process";
import mysql from "mysql2/promise";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const attempts = 40;
const delayMs = 1_000;
let lastErrorName = "UnknownError";

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  let connection;
  try {
    connection = await mysql.createConnection(connectionString);
    await connection.query("SELECT 1");
    await connection.end();
    console.log(JSON.stringify({ ready: true, attempt }));
    process.exit(0);
  } catch (error) {
    lastErrorName = error instanceof Error ? error.name : "UnknownError";
    await connection?.end().catch(() => undefined);
    if (attempt < attempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

console.error(
  JSON.stringify({
    ready: false,
    attempts,
    errorName: lastErrorName,
  }),
);
process.exit(1);
