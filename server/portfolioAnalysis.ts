import { eq } from "drizzle-orm";
import { portfolios, holdings, etfs } from "../drizzle/schema";
import { getDb, getPortfolioWithHoldings, getEtfBySymbol } from "./db";

export async function analyzePortfolio(portfolioId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot analyze portfolio: database not available");
    return null;
  }

  const portfolioWithHoldings = await getPortfolioWithHoldings(portfolioId);
  if (!portfolioWithHoldings) {
    return null;
  }

  const { holdings } = portfolioWithHoldings;

  let totalPortfolioValue = 0;
  const holdingsWithEtfDetails = [];

  for (const holding of holdings) {
    const etf = await getEtfBySymbol(holding.etfTicker);
    if (etf) {
      const value = holding.shares * holding.currentPrice; // Use holding's currentPrice as ETF doesn't have it yet
      totalPortfolioValue += value;
      holdingsWithEtfDetails.push({ ...holding, etf, value });
    }
  }

  const allocationData = holdingsWithEtfDetails.map(holding => ({
    ticker: holding.etfTicker,
    name: holding.etf.name,
    value: holding.value,
    percentage: totalPortfolioValue > 0 ? (holding.value / totalPortfolioValue) * 100 : 0,
  }));

  // Simplified risk calculation for MVP: based on average risk of holdings
  let totalRiskScore = 0;
  let etfCountWithRisk = 0;
  for (const holding of holdingsWithEtfDetails) {
    const etfRiskScore = holding.etf.riskScore || 3; // Default to medium risk
    totalRiskScore += etfRiskScore;
    etfCountWithRisk++;
  }

  const averageRisk = etfCountWithRisk > 0 ? totalRiskScore / etfCountWithRisk : 3; // Default to medium if no ETFs

  const riskData = [
    { category: "Laag risico", value: averageRisk < 2.5 ? 100 : 0 },
    { category: "Matig risico", value: averageRisk >= 2.5 && averageRisk <= 3.5 ? 100 : 0 },
    { category: "Hoog risico", value: averageRisk > 3.5 ? 100 : 0 },
  ];

  const totalRiskValue = riskData.reduce((sum, r) => sum + r.value, 0);
  if (totalRiskValue === 0 && etfCountWithRisk > 0) {
    if (averageRisk < 2.5) riskData[0].value = 100;
    else if (averageRisk >= 2.5 && averageRisk <= 3.5) riskData[1].value = 100;
    else riskData[2].value = 100;
  } else if (totalRiskValue === 0) {
    riskData[1].value = 100;
  }

  const geoData: { [key: string]: number } = {};
  holdingsWithEtfDetails.forEach(holding => {
    if (holding.etf.region) {
      geoData[holding.etf.region] = (geoData[holding.etf.region] || 0) + holding.value;
    }
  });

  const totalGeoValue = Object.values(geoData).reduce((sum, val) => sum + val, 0);
  const geographicDistribution = Object.entries(geoData).map(([region, value]) => ({
    region,
    percentage: totalGeoValue > 0 ? (value / totalGeoValue) * 100 : 0,
  }));

  // Mock recommendations
  const recommendations = [
    "Herschik je portefeuille jaarlijks om je target-allocatie te behouden.",
    "Overweeg obligatie-ETF's toe te voegen voor meer stabiliteit naarmate je ouder wordt.",
  ];

  return {
    totalValue: totalPortfolioValue,
    allocation: allocationData,
    riskProfile: riskData,
    geographicDistribution: geographicDistribution,
    recommendations: recommendations,
  };
}
