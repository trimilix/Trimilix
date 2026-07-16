import {
  calculateHoldingValueCents,
  calculateValueWeightedPortfolioRisk,
} from "@shared/finance/financialCore";
import { getEtfBySymbol, getPortfolioWithHoldings } from "./db";

export async function analyzePortfolio(portfolioId: number, userId: number) {
  const portfolioWithHoldings = await getPortfolioWithHoldings(portfolioId, userId);
  if (!portfolioWithHoldings) {
    return null;
  }

  const holdingsWithEtfDetails = await Promise.all(
    portfolioWithHoldings.holdings.map(async holding => {
      const etf = await getEtfBySymbol(holding.etfTicker);
      const value = calculateHoldingValueCents(holding.shares, holding.currentPrice);
      return { ...holding, etf, value };
    }),
  );

  const totalPortfolioValue = holdingsWithEtfDetails.reduce(
    (sum, holding) => sum + holding.value,
    0,
  );

  const allocationData = holdingsWithEtfDetails.map(holding => ({
    ticker: holding.etfTicker,
    name: holding.etf?.name ?? holding.etfName,
    value: holding.value,
    percentage:
      totalPortfolioValue > 0
        ? Number(((holding.value / totalPortfolioValue) * 100).toFixed(2))
        : 0,
  }));

  const risk = calculateValueWeightedPortfolioRisk(
    holdingsWithEtfDetails.map(holding => ({
      ticker: holding.etfTicker,
      valueCents: holding.value,
      riskScore: holding.etf?.riskScore,
    })),
  );

  const geoValueByRegion = new Map<string, number>();
  for (const holding of holdingsWithEtfDetails) {
    const region = holding.etf?.region;
    if (region) {
      geoValueByRegion.set(region, (geoValueByRegion.get(region) ?? 0) + holding.value);
    }
  }

  const totalGeoValue = Array.from(geoValueByRegion.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const geographicDistribution = Array.from(geoValueByRegion.entries()).map(
    ([region, value]) => ({
      region,
      percentage:
        totalGeoValue > 0 ? Number(((value / totalGeoValue) * 100).toFixed(2)) : 0,
    }),
  );

  return {
    totalValue: totalPortfolioValue,
    allocation: allocationData,
    riskStatus: risk.status,
    weightedRiskScore: risk.score,
    riskProfile: risk.distribution,
    missingRiskTickers: risk.missingTickers,
    invalidRiskTickers: risk.invalidTickers,
    geographicDistribution,
    recommendations: [],
    methodology: {
      riskScale: "Trimilix educational indicator (1-5)",
      weighting: "current holding value",
      missingDataPolicy: "fail-closed",
    },
  };
}
