import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolios, holdings, goals, subscriptions, etfs, InsertPortfolio, InsertHolding, InsertGoal, InsertSubscription, InsertEtf } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function rotateUserSessionVersion(openId: string): Promise<boolean> {
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

// Portfolio queries
export async function getUserPortfolios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId));
}

export async function getPortfolioWithHoldings(portfolioId: number, userId: number) {
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

export async function createPortfolio(userId: number, data: Omit<InsertPortfolio, 'userId'>) {
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
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserSubscription(userId);
  if (existing) {
    await db.update(subscriptions).set(data).where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({ userId, ...data });
  }
}

export async function getEtfBySymbol(symbol: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ETF: database not available");
    return undefined;
  }
  const result = await db.select().from(etfs).where(eq(etfs.symbol, symbol)).limit(1);
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

export async function listEtfs() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list ETFs: database not available");
    return [];
  }
  return db.select().from(etfs);
}
