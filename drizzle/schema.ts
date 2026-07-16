import { sql } from "drizzle-orm";
import {
  check,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable(
  "users",
  {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: int("id").autoincrement().primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    /** Incrementing logout/security epoch embedded in session JWTs. */
    sessionVersion: int("sessionVersion").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [
    check("users_session_version_positive", sql`${table.sessionVersion} >= 1`),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Portefeuille-tabel: Slaat gebruikers' beleggingsportefeuilles op.
 */
export const portfolios = mysqlTable(
  "portfolios",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    totalValue: int("totalValue").default(0).notNull(), // In cents
    currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("portfolios_user_id_idx").on(table.userId),
    check("portfolios_total_value_nonnegative", sql`${table.totalValue} >= 0`),
  ],
);

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

/**
 * ETF-holdings: Individuele ETF-posities in een portefeuille.
 */
export const holdings = mysqlTable(
  "holdings",
  {
    id: int("id").autoincrement().primaryKey(),
    portfolioId: int("portfolioId").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
    etfTicker: varchar("etfTicker", { length: 20 }).notNull(),
    etfName: varchar("etfName", { length: 255 }).notNull(),
    shares: int("shares").notNull(), // Aantal aandelen
    purchasePrice: int("purchasePrice").notNull(), // In cents
    currentPrice: int("currentPrice").notNull(), // In cents (van API)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("holdings_portfolio_id_idx").on(table.portfolioId),
    uniqueIndex("holdings_portfolio_ticker_unique").on(
      table.portfolioId,
      table.etfTicker,
    ),
    check("holdings_shares_positive", sql`${table.shares} > 0`),
    check("holdings_purchase_price_nonnegative", sql`${table.purchasePrice} >= 0`),
    check("holdings_current_price_nonnegative", sql`${table.currentPrice} >= 0`),
  ],
);

export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = typeof holdings.$inferInsert;

/**
 * Financiële doelen: Gebruikers kunnen doelen stellen (b.v. €100k in 10 jaar).
 */
export const goals = mysqlTable(
  "goals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: int("targetAmount").notNull(), // In cents
    currentAmount: int("currentAmount").default(0).notNull(), // In cents
    targetDate: timestamp("targetDate").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("goals_user_id_idx").on(table.userId),
    check("goals_target_amount_positive", sql`${table.targetAmount} > 0`),
    check("goals_current_amount_nonnegative", sql`${table.currentAmount} >= 0`),
  ],
);

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Abonnementen: Premium-status en betalingsgegevens.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  plan: mysqlEnum("plan", ["free", "premium"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const etfs = mysqlTable(
  "etfs",
  {
    id: int("id").autoincrement().primaryKey(),
    symbol: varchar("symbol", { length: 10 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    isin: varchar("isin", { length: 12 }).unique(),
    ter: int("ter"), // Total Expense Ratio in basis points (e.g., 20 for 0.20%)
    currency: varchar("currency", { length: 3 }).notNull(),
    assetClass: varchar("assetClass", { length: 50 }),
    region: varchar("region", { length: 50 }),
    /** Optional 1–5 Trimilix educational indicator; null means analysis is incomplete. */
    riskScore: int("riskScore"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    // SQL CHECK treats NULL as UNKNOWN (accepted); only FALSE is rejected.
    check("etfs_ter_nonnegative", sql`${table.ter} >= 0`),
    check("etfs_risk_score_range", sql`${table.riskScore} BETWEEN 1 AND 5`),
  ],
);

export type Etf = typeof etfs.$inferSelect;
export type InsertEtf = typeof etfs.$inferInsert;