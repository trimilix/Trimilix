import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEtfBySymbol, getPortfolioWithHoldings } from "./db";
import { analyzePortfolio } from "./portfolioAnalysis";

vi.mock("./db", () => ({
  getEtfBySymbol: vi.fn(),
  getPortfolioWithHoldings: vi.fn(),
}));

const now = new Date("2026-07-16T00:00:00.000Z");

const portfolio = {
  id: 1,
  userId: 9,
  name: "Test",
  description: null,
  totalValue: 0,
  currency: "EUR",
  createdAt: now,
  updatedAt: now,
  holdings: [
    {
      id: 1,
      portfolioId: 1,
      etfTicker: "LOW",
      etfName: "Low risk",
      shares: 1,
      purchasePrice: 10_000,
      currentPrice: 10_000,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      portfolioId: 1,
      etfTicker: "HIGH",
      etfName: "High risk",
      shares: 9,
      purchasePrice: 10_000,
      currentPrice: 10_000,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

function etf(symbol: string, riskScore: number | null) {
  return {
    id: symbol === "LOW" ? 1 : 2,
    symbol,
    name: `${symbol} ETF`,
    isin: null,
    ter: 10,
    currency: "EUR",
    assetClass: "Equity",
    region: "Global",
    riskScore,
    createdAt: now,
    updatedAt: now,
  };
}

describe("portfolio analysis integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPortfolioWithHoldings).mockResolvedValue(portfolio);
  });

  it("uses current position value for the weighted score and distribution", async () => {
    vi.mocked(getEtfBySymbol).mockImplementation(async symbol =>
      symbol === "LOW" ? etf("LOW", 1) : etf("HIGH", 5),
    );

    const result = await analyzePortfolio(1, 9);

    expect(result?.totalValue).toBe(100_000);
    expect(result?.riskStatus).toBe("complete");
    expect(result?.weightedRiskScore).toBe(4.6);
    expect(result?.riskProfile).toEqual([
      { category: "Laag risico", value: 10 },
      { category: "Matig risico", value: 0 },
      { category: "Hoog risico", value: 90 },
    ]);
    expect(result?.recommendations).toEqual([]);
  });

  it("blocks the risk result when ETF risk data is unavailable", async () => {
    vi.mocked(getEtfBySymbol).mockImplementation(async symbol =>
      symbol === "LOW" ? etf("LOW", 1) : undefined,
    );

    const result = await analyzePortfolio(1, 9);

    expect(result?.totalValue).toBe(100_000);
    expect(result?.riskStatus).toBe("incomplete");
    expect(result?.weightedRiskScore).toBeNull();
    expect(result?.riskProfile).toEqual([]);
    expect(result?.missingRiskTickers).toEqual(["HIGH"]);
  });

  it("blocks invalid ETF scores instead of clipping or defaulting", async () => {
    vi.mocked(getEtfBySymbol).mockImplementation(async symbol =>
      symbol === "LOW" ? etf("LOW", 0) : etf("HIGH", 5),
    );

    const result = await analyzePortfolio(1, 9);

    expect(result?.riskStatus).toBe("incomplete");
    expect(result?.weightedRiskScore).toBeNull();
    expect(result?.invalidRiskTickers).toEqual(["LOW"]);
  });

  it("returns null when the requested user-owned portfolio does not exist", async () => {
    vi.mocked(getPortfolioWithHoldings).mockResolvedValue(null);

    await expect(analyzePortfolio(404, 9)).resolves.toBeNull();
    expect(getEtfBySymbol).not.toHaveBeenCalled();
  });
});
