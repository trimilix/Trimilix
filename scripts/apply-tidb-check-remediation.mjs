import "dotenv/config";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(JSON.stringify({ passed: false, error: "DATABASE_URL ontbreekt" }, null, 2));
  process.exit(1);
}

const CONSTRAINTS = [
  {
    name: "etfs_ter_nonnegative",
    table: "etfs",
    clause: "`ter` >= 0",
    violationQuery: "SELECT COUNT(*) AS count FROM etfs WHERE ter IS NOT NULL AND ter < 0",
  },
  {
    name: "etfs_risk_score_range",
    table: "etfs",
    clause: "`riskScore` BETWEEN 1 AND 5",
    violationQuery:
      "SELECT COUNT(*) AS count FROM etfs WHERE riskScore IS NOT NULL AND (riskScore < 1 OR riskScore > 5)",
  },
  {
    name: "goals_target_amount_positive",
    table: "goals",
    clause: "`targetAmount` > 0",
    violationQuery: "SELECT COUNT(*) AS count FROM goals WHERE targetAmount <= 0",
  },
  {
    name: "goals_current_amount_nonnegative",
    table: "goals",
    clause: "`currentAmount` >= 0",
    violationQuery: "SELECT COUNT(*) AS count FROM goals WHERE currentAmount < 0",
  },
  {
    name: "holdings_shares_positive",
    table: "holdings",
    clause: "`shares` > 0",
    violationQuery: "SELECT COUNT(*) AS count FROM holdings WHERE shares <= 0",
  },
  {
    name: "holdings_purchase_price_nonnegative",
    table: "holdings",
    clause: "`purchasePrice` >= 0",
    violationQuery: "SELECT COUNT(*) AS count FROM holdings WHERE purchasePrice < 0",
  },
  {
    name: "holdings_current_price_nonnegative",
    table: "holdings",
    clause: "`currentPrice` >= 0",
    violationQuery: "SELECT COUNT(*) AS count FROM holdings WHERE currentPrice < 0",
  },
  {
    name: "portfolios_total_value_nonnegative",
    table: "portfolios",
    clause: "`totalValue` >= 0",
    violationQuery: "SELECT COUNT(*) AS count FROM portfolios WHERE totalValue < 0",
  },
  {
    name: "users_session_version_positive",
    table: "users",
    clause: "`sessionVersion` >= 1",
    violationQuery: "SELECT COUNT(*) AS count FROM users WHERE sessionVersion < 1",
  },
];

const assertSafeIdentifier = value => {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`Onveilige SQL-identifier: ${value}`);
  return `\`${value}\``;
};

const connection = await mysql.createConnection(databaseUrl);

try {
  const [[capability]] = await connection.query(
    "SELECT @@GLOBAL.tidb_enable_check_constraint AS enabled",
  );
  if (Number(capability.enabled) !== 1) {
    throw new Error(
      "TiDB CHECK-enforcement staat uit; remediatie is fail-closed gestopt. Voer migratie 0007 capabilityactivatie uit of activeer de globale TiDB-capability gecontroleerd.",
    );
  }

  const violations = {};
  for (const constraint of CONSTRAINTS) {
    const [[result]] = await connection.query(constraint.violationQuery);
    violations[constraint.name] = Number(result.count);
  }
  const invalidConstraints = Object.entries(violations)
    .filter(([, count]) => count !== 0)
    .map(([name]) => name);
  if (invalidConstraints.length > 0) {
    throw new Error(
      `Bestaande data schendt de beoogde constraints: ${invalidConstraints.join(", ")}. Er zijn geen DDL-wijzigingen uitgevoerd.`,
    );
  }

  const [existingRows] = await connection.query(
    `SELECT CONSTRAINT_NAME AS name
       FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()`,
  );
  const existing = new Set(existingRows.map(row => row.name));
  const added = [];
  const preserved = [];

  for (const constraint of CONSTRAINTS) {
    if (existing.has(constraint.name)) {
      preserved.push(constraint.name);
      continue;
    }

    const table = assertSafeIdentifier(constraint.table);
    const name = assertSafeIdentifier(constraint.name);
    await connection.query(
      `ALTER TABLE ${table} ADD CONSTRAINT ${name} CHECK (${constraint.clause})`,
    );
    added.push(constraint.name);
  }

  const [verifiedRows] = await connection.query(
    `SELECT CONSTRAINT_NAME AS name
       FROM information_schema.TIDB_CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY CONSTRAINT_NAME`,
  );
  const verifiedNames = verifiedRows.map(row => row.name);
  const missing = CONSTRAINTS.map(constraint => constraint.name).filter(
    name => !verifiedNames.includes(name),
  );
  if (missing.length > 0) {
    throw new Error(
      `Constraintregistratie is onvolledig; journalreconciliatie blijft geblokkeerd. Ontbrekend: ${missing.join(", ")}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        passed: true,
        capability: { tidbEnableCheckConstraint: 1 },
        existingDataViolations: violations,
        added,
        preserved,
        verified: verifiedNames.filter(name =>
          CONSTRAINTS.some(constraint => constraint.name === name),
        ),
        migrationJournalModified: false,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        migrationJournalModified: false,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await connection.end();
}
