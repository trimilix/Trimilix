import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";
import { etfs } from "./schema";


async function seed() {
  
  const connection = await createConnection(process.env.DATABASE_URL!); 
  
  const db = drizzle(connection);

  const popularEtfs = [
    {
      symbol: "VWRL",
      name: "Vanguard FTSE All-World UCITS ETF",
      isin: "IE00B3RBWM25",
      ter: 22, // 0.22%
      currency: "EUR",
      assetClass: "Equity",
      region: "Global",
      riskScore: 4,
    },
    {
      symbol: "IWDA",
      name: "iShares Core MSCI World UCITS ETF",
      isin: "IE00B4L5Y983",
      ter: 20, // 0.20%
      currency: "EUR",
      assetClass: "Equity",
      region: "Global Developed",
      riskScore: 4,
    },
    {
      symbol: "VUSA",
      name: "Vanguard S&P 500 UCITS ETF",
      isin: "IE00B3XXRP09",
      ter: 7, // 0.07%
      currency: "USD",
      assetClass: "Equity",
      region: "USA",
      riskScore: 4,
    },
    {
      symbol: "EMIM",
      name: "iShares Core MSCI EM IMI UCITS ETF",
      isin: "IE00BKM4GZ66",
      ter: 18, // 0.18%
      currency: "USD",
      assetClass: "Equity",
      region: "Emerging Markets",
      riskScore: 5,
    },
    {
      symbol: "AGGH",
      name: "iShares Core Global Aggregate Bond UCITS ETF",
      isin: "IE00BDBRDM35",
      ter: 10, // 0.10%
      currency: "EUR",
      assetClass: "Fixed Income",
      region: "Global",
      riskScore: 2,
    },
  ];

  
  for (const etf of popularEtfs) {
    
    await db.insert(etfs).values(etf).onDuplicateKeyUpdate({ set: etf });
    
    
  }

  console.log("Seeding complete.");
  await connection.end();
console.log("Database connection closed.");
}

seed().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
