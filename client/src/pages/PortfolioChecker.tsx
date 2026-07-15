import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

// Mock portfolio data
const mockPortfolio = {
  name: "Mijn Portefeuille",
  totalValue: 50000,
  holdings: [
    { ticker: "VWRL", name: "Vanguard All-World", value: 25000, percentage: 50 },
    { ticker: "VUSA", name: "Vanguard S&P 500", value: 15000, percentage: 30 },
    { ticker: "VUAG", name: "Vanguard EM", value: 10000, percentage: 20 },
  ],
};

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

// Risk analysis
const riskData = [
  { category: "Laag risico", value: 0 },
  { category: "Matig risico", value: 50 },
  { category: "Hoog risico", value: 50 },
];

// Geographic diversification
const geoData = [
  { region: "USA", percentage: 30 },
  { region: "Europa", percentage: 40 },
  { region: "Opkomende markten", percentage: 20 },
  { region: "Overig", percentage: 10 },
];

export default function PortfolioChecker() {
  const [selectedHolding, setSelectedHolding] = useState<typeof mockPortfolio.holdings[0] | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Checker™</h1>
          <p className="text-slate-600">Controleer je portefeuille op diversificatie en risico</p>
        </div>

        {/* Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{mockPortfolio.name}</CardTitle>
            <CardDescription>Totale waarde: €{mockPortfolio.totalValue.toLocaleString("nl-NL")}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Allocation Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allocatie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockPortfolio.holdings}
                    dataKey="value"
                    nameKey="ticker"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {mockPortfolio.holdings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `€${(value as number).toLocaleString("nl-NL")}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risicoprofiel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" width={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Geografische spreiding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {geoData.map((item) => (
                  <div key={item.region}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.region}</span>
                      <span className="text-slate-600">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Holdings Detail */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockPortfolio.holdings.map((holding) => (
                    <button
                      key={holding.ticker}
                      onClick={() => setSelectedHolding(holding)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedHolding?.ticker === holding.ticker
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-sm">{holding.ticker}</div>
                      <div className="text-xs text-slate-600">{holding.percentage}% • €{holding.value.toLocaleString("nl-NL")}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis & Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Check */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gezondheidscheck</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-green-900 text-sm">Goed gediversificeerd</div>
                    <p className="text-xs text-green-800 mt-1">Je portefeuille is goed verspreid over regio's en ETF's.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-green-900 text-sm">Lage kosten</div>
                    <p className="text-xs text-green-800 mt-1">Gemiddelde TER: 0,18% — zeer voordelig.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-amber-900 text-sm">Overgewicht USA</div>
                    <p className="text-xs text-amber-800 mt-1">30% in S&P 500 is hoog. Overweeg rebalancing naar 20%.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aanbevelingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Rebalancing:</strong> Herschik je portefeuille jaarlijks om je target-allocatie te behouden.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Obligaties:</strong> Overweeg obligatie-ETF's toe te voegen voor meer stabiliteit naarmate je ouder wordt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
