import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Mock ETF data - in production, dit zou van een API komen
const mockETFs = [
  {
    ticker: "VWRL",
    name: "Vanguard FTSE All-World UCITS ETF",
    ter: 0.22,
    aum: 15200000000,
    replication: "Physical",
    region: "Global",
    risk: 5,
  },
  {
    ticker: "IWDA",
    name: "iShares Core MSCI World UCITS ETF",
    ter: 0.20,
    aum: 85000000000,
    replication: "Physical",
    region: "Global",
    risk: 5,
  },
  {
    ticker: "VUSA",
    name: "Vanguard S&P 500 UCITS ETF",
    ter: 0.08,
    aum: 28000000000,
    replication: "Physical",
    region: "USA",
    risk: 5,
  },
];

export default function ETFCheck() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedETF, setSelectedETF] = useState<typeof mockETFs[0] | null>(null);

  const filteredETFs = mockETFs.filter(
    (etf) =>
      etf.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etf.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToPortfolio = () => {
    toast.success(`${selectedETF?.ticker} toegevoegd aan portefeuille`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ETF Check™</h1>
          <p className="text-slate-600">Analyseer ETF's op kosten, risico en rendement</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ETF zoeken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">
                  ETF ticker of naam
                </Label>
                <Input
                  id="search"
                  placeholder="Voer ETF ticker in (bijv. VWRL, IWDA)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button className="gap-2">
                <Search className="w-4 h-4" />
                Zoeken
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ETF List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultaten ({filteredETFs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredETFs.map((etf) => (
                    <button
                      key={etf.ticker}
                      onClick={() => setSelectedETF(etf)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedETF?.ticker === etf.ticker
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-semibold text-sm">{etf.ticker}</div>
                      <div className="text-xs text-slate-600 truncate">{etf.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ETF Details */}
          <div className="lg:col-span-2">
            {selectedETF ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedETF.ticker}</CardTitle>
                  <CardDescription>{selectedETF.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Totale Kosten (TER)</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedETF.ter}%</div>
                      <div className="text-xs text-slate-500 mt-2">
                        {selectedETF.ter < 0.25 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Laag
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            Gemiddeld
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Vermogen (AUM)</div>
                      <div className="text-2xl font-bold">
                        €{(selectedETF.aum / 1000000000).toFixed(1)}B
                      </div>
                      <div className="text-xs text-slate-500 mt-2">Groot en stabiel</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Replicatie</div>
                      <div className="text-lg font-bold">{selectedETF.replication}</div>
                      <div className="text-xs text-slate-500 mt-2">Volgt index exact</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Risico</div>
                      <div className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        {selectedETF.risk}/10
                      </div>
                      <div className="text-xs text-slate-500 mt-2">Matig tot hoog</div>
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-green-900 mb-1">Aanbeveling</div>
                        <p className="text-sm text-green-800">
                          Dit is een solide keuze voor lange-termijnbeleggers. Lage kosten en groot vermogen maken dit een stabiele optie.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <Button onClick={handleAddToPortfolio} className="w-full">
                    Toevoegen aan portefeuille
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600">Selecteer een ETF om details te zien</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
