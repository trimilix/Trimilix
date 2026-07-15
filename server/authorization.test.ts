import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUserPortfolios: vi.fn(),
  getPortfolioWithHoldings: vi.fn(),
  createPortfolio: vi.fn(),
  getUserGoals: vi.fn(),
  getUserSubscription: vi.fn(),
  getEtfBySymbol: vi.fn(),
  createEtf: vi.fn(),
  listEtfs: vi.fn(),
  getDb: vi.fn(),
}));

const portfolioAnalysisMocks = vi.hoisted(() => ({
  analyzePortfolio: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./portfolioAnalysis", () => portfolioAnalysisMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
type UserRole = AuthenticatedUser["role"];

function createContext(role: UserRole = "user", userId = 7): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user-${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const etfInput = {
  symbol: "TEST",
  name: "Test ETF",
  isin: "IE0000000001",
  ter: 20,
  currency: "EUR",
  assetClass: "Equity",
  region: "Global",
};

describe("authorization boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the authenticated user id into portfolio detail queries", async () => {
    dbMocks.getPortfolioWithHoldings.mockResolvedValue(null);
    const caller = appRouter.createCaller(createContext("user", 7));

    await caller.portfolio.get({ id: 42 });

    expect(dbMocks.getPortfolioWithHoldings).toHaveBeenCalledWith(42, 7);
  });

  it("passes the authenticated user id into portfolio analyses", async () => {
    portfolioAnalysisMocks.analyzePortfolio.mockResolvedValue(null);
    const caller = appRouter.createCaller(createContext("user", 9));

    await caller.portfolio.analyze({ portfolioId: 88 });

    expect(portfolioAnalysisMocks.analyzePortfolio).toHaveBeenCalledWith(88, 9);
  });

  it("rejects ETF creation by a regular user", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.etf.create(etfInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(dbMocks.createEtf).not.toHaveBeenCalled();
  });

  it("allows an admin to create an ETF", async () => {
    dbMocks.createEtf.mockResolvedValue({ insertId: 1 });
    const caller = appRouter.createCaller(createContext("admin"));

    await caller.etf.create(etfInput);

    expect(dbMocks.createEtf).toHaveBeenCalledWith(etfInput);
  });
});
