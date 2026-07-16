import { and, asc, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertEtf,
  InsertGoal,
  InsertHolding,
  InsertPortfolio,
  InsertSubscription,
  InsertUser,
  etfs,
  goals,
  holdings,
  portfolios,
  subscriptions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

type AppDatabase = ReturnType<typeof drizzle>;
type TransactionCallback = Parameters<AppDatabase["transaction"]>[0];
export type AppTransaction = TransactionCallback extends (
  transaction: infer TTransaction
) => Promise<unknown>
  ? TTransaction
  : never;

export interface TransactionExecutor<TTransaction> {
  transaction<TResult>(
    operation: (transaction: TTransaction) => Promise<TResult>
  ): Promise<TResult>;
}

let _db: AppDatabase | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb(): Promise<AppDatabase> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database is unavailable");
  }
  return db;
}

export async function executeInTransaction<TResult, TTransaction>(
  executor: TransactionExecutor<TTransaction>,
  operation: (transaction: TTransaction) => Promise<TResult>
): Promise<TResult> {
  return executor.transaction(operation);
}

export async function withTransaction<TResult>(
  operation: (transaction: AppTransaction) => Promise<TResult>
): Promise<TResult> {
  const db = await requireDb();
  return executeInTransaction(db, operation);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function rotateUserSessionVersion(
  openId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot revoke sessions: database not available");
    return false;
  }

  const result = await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.openId, openId));

  return Number(result[0]?.affectedRows ?? 0) === 1;
}

export interface CursorPageOptions {
  limit: number;
  cursor?: number;
}

export interface CursorPage<TItem> {
  items: TItem[];
  nextCursor: number | null;
}

const boundedPageLimit = (limit: number) =>
  Math.min(Math.max(Math.trunc(limit), 1), 100);

// Portfolio queries
export async function getUserPortfolios(
  userId: number,
  options: CursorPageOptions
): Promise<CursorPage<typeof portfolios.$inferSelect>> {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null };

  const limit = boundedPageLimit(options.limit);
  const rows = await db
    .select()
    .from(portfolios)
    .where(
      and(
        eq(portfolios.userId, userId),
        options.cursor === undefined
          ? undefined
          : gt(portfolios.id, options.cursor)
      )
    )
    .orderBy(asc(portfolios.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
  };
}

export async function getPortfolioWithHoldings(
  portfolioId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return null;

  const portfolio = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);

  if (portfolio.length === 0) return null;

  const portfolioHoldings = await db
    .select()
    .from(holdings)
    .where(eq(holdings.portfolioId, portfolioId));

  return { ...portfolio[0], holdings: portfolioHoldings };
}

export async function createPortfolio(
  userId: number,
  data: Omit<InsertPortfolio, "userId">
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(portfolios).values({ ...data, userId });
  return result;
}

// Goal queries
export async function getUserGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(eq(goals.userId, userId));
}

// Subscription queries
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

type SubscriptionMutation = Omit<
  Partial<InsertSubscription>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export async function upsertSubscription(
  userId: number,
  data: SubscriptionMutation
): Promise<void> {
  const db = await requireDb();
  const updatedAt = new Date();

  await db
    .insert(subscriptions)
    .values({ ...data, userId, updatedAt })
    .onDuplicateKeyUpdate({
      set: { ...data, updatedAt },
    });
}

export async function getEtfBySymbol(symbol: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ETF: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(etfs)
    .where(eq(etfs.symbol, symbol))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEtf(etf: InsertEtf) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create ETF: database not available");
    return undefined;
  }
  const result = await db.insert(etfs).values(etf);
  return result;
}

export async function getEtfsBySymbols(symbols: string[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ETF batch: database not available");
    return [];
  }

  const uniqueSymbols = Array.from(new Set(symbols));
  if (uniqueSymbols.length === 0) return [];
  return db.select().from(etfs).where(inArray(etfs.symbol, uniqueSymbols));
}

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export async function listEtfs(
  options: CursorPageOptions & { query?: string }
): Promise<CursorPage<typeof etfs.$inferSelect>> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list ETFs: database not available");
    return { items: [], nextCursor: null };
  }

  const limit = boundedPageLimit(options.limit);
  const normalizedQuery = options.query?.trim();
  const searchPattern = normalizedQuery
    ? `%${escapeLikePattern(normalizedQuery)}%`
    : undefined;
  const rows = await db
    .select()
    .from(etfs)
    .where(
      and(
        options.cursor === undefined ? undefined : gt(etfs.id, options.cursor),
        searchPattern
          ? or(like(etfs.symbol, searchPattern), like(etfs.name, searchPattern))
          : undefined
      )
    )
    .orderBy(asc(etfs.id))
    .limit(limit + 1);

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasNextPage ? (items.at(-1)?.id ?? null) : null,
  };
}
