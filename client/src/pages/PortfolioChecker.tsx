import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#ef4444",
  "#f59e0b",
];

export default function PortfolioChecker() {
  const {
    isAuthenticated,
    loading: isLoadingAuth,
    error: authError,
  } = useAuth();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    null
  );
  const portfolioListInput = useMemo(() => ({ limit: 25 }), []);
  const selectedPortfolioInput = useMemo(
    () => ({ id: selectedPortfolioId ?? 1 }),
    [selectedPortfolioId]
  );
  const portfolioAnalysisInput = useMemo(
    () => ({ portfolioId: selectedPortfolioId ?? 1 }),
    [selectedPortfolioId]
  );

  const {
    data: portfolioPages,
    isLoading: isLoadingPortfolios,
    error: portfoliosError,
    hasNextPage: hasMorePortfolios,
    fetchNextPage: fetchMorePortfolios,
    isFetchingNextPage: isFetchingMorePortfolios,
  } = trpc.portfolio.list.useInfiniteQuery(portfolioListInput, {
    enabled: isAuthenticated,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
  });
  const portfolios = portfolioPages?.pages.flatMap(page => page.items) ?? [];
  const {
    data: selectedPortfolio,
    isLoading: isLoadingSelectedPortfolio,
    error: selectedPortfolioError,
  } = trpc.portfolio.get.useQuery(selectedPortfolioInput, {
    enabled: isAuthenticated && !!selectedPortfolioId,
  });

  const {
    data: portfolioAnalysis,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = trpc.portfolio.analyze.useQuery(portfolioAnalysisInput, {
    enabled: isAuthenticated && !!selectedPortfolioId,
  });

  const riskData = portfolioAnalysis?.riskProfile || [];
  const geoData = portfolioAnalysis?.geographicDistribution || [];
  const riskStatus = portfolioAnalysis?.riskStatus;
  const missingRiskTickers = portfolioAnalysis?.missingRiskTickers || [];
  const invalidRiskTickers = portfolioAnalysis?.invalidRiskTickers || [];

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
        <p className="ml-2">Sessie controleren...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        Sessie kon niet worden gecontroleerd. Probeer het opnieuw.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Inloggen vereist</CardTitle>
            <CardDescription>
              Log in om je portefeuilles veilig te bekijken en analyseren.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => startLogin()}>
              Inloggen of registreren
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingPortfolios) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
        <p className="ml-2">Laden portefeuilles...</p>
      </div>
    );
  }

  if (portfoliosError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        Fout bij laden portefeuilles: {portfoliosError.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Checker™</h1>
          <p className="text-slate-600">
            Controleer je portefeuille op diversificatie en risico
          </p>
        </div>

        {/* Portfolio Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Selecteer Portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolios.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {portfolios.map(portfolio => (
                    <Button
                      key={portfolio.id}
                      variant={
                        selectedPortfolioId === portfolio.id
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedPortfolioId(portfolio.id)}
                      className="justify-start"
                    >
                      {portfolio.name}
                    </Button>
                  ))}
                </div>
                {hasMorePortfolios && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchMorePortfolios()}
                    disabled={isFetchingMorePortfolios}
                  >
                    {isFetchingMorePortfolios
                      ? "Portefeuilles laden…"
                      : "Meer portefeuilles laden"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-4">
                Geen portefeuilles gevonden. Maak er eerst een aan op het
                Dashboard.
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPortfolioId && (
          <div className="space-y-8">
            {isLoadingSelectedPortfolio ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
                  <p className="text-slate-600">
                    Laden portefeuille details...
                  </p>
                </CardContent>
              </Card>
            ) : selectedPortfolioError ? (
              <Card>
                <CardContent className="py-12 text-center text-red-600">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>
                    Fout bij laden portefeuille details:{" "}
                    {selectedPortfolioError.message}
                  </p>
                </CardContent>
              </Card>
            ) : selectedPortfolio ? (
              <>
                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedPortfolio.name}</CardTitle>
                    <CardDescription>
                      Totale waarde: €
                      {(
                        (portfolioAnalysis?.totalValue || 0) / 100
                      ).toLocaleString("nl-NL")}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Allocation Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Allocatie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPortfolio.holdings.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={selectedPortfolio.holdings.map(holding => ({
                                ticker: holding.etfTicker,
                                name: holding.etfName,
                                value: holding.shares * holding.currentPrice,
                              }))}
                              dataKey="value"
                              nameKey="ticker"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label
                            >
                              {selectedPortfolio.holdings.map(
                                (entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                  />
                                )
                              )}
                            </Pie>
                            <Tooltip
                              formatter={value =>
                                `€${((value as number) / 100).toLocaleString("nl-NL")}`
                              }
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-slate-500 py-4">
                          Geen holdings in deze portefeuille.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Risk Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risicoprofiel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {riskStatus === "complete" ? (
                        <>
                          <div className="mb-3 text-sm text-slate-700">
                            Waardegewogen indicator:{" "}
                            <strong>
                              {portfolioAnalysis?.weightedRiskScore}/5
                            </strong>
                          </div>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={riskData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" />
                              <YAxis domain={[0, 100]} unit="%" />
                              <Tooltip
                                formatter={value =>
                                  `${value}% van portefeuillewaarde`
                                }
                              />
                              <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                          {riskStatus === "empty"
                            ? "Er is nog geen positieve portefeuillewaarde om te analyseren."
                            : "De risicoscore is geblokkeerd totdat alle ETF-risicodata aanwezig en geldig is."}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Geographic Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Geografische spreiding
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {geoData.map(item => (
                          <div key={item.region}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{item.region}</span>
                              <span className="text-slate-600">
                                {item.percentage}%
                              </span>
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
                        {selectedPortfolio.holdings.length > 0 ? (
                          <div className="space-y-2">
                            {selectedPortfolio.holdings.map(holding => (
                              <div
                                key={holding.etfTicker}
                                className="w-full text-left p-3 rounded-lg border-2 transition-all border-slate-200 hover:border-slate-300"
                              >
                                <div className="font-semibold text-sm">
                                  {holding.etfTicker}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {(
                                    (holding.shares * holding.currentPrice) /
                                    100
                                  ).toLocaleString("nl-NL", {
                                    style: "currency",
                                    currency: selectedPortfolio.currency,
                                  })}{" "}
                                  • {holding.shares} aandelen
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 py-4">
                            Geen holdings in deze portefeuille.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analysis & Recommendations */}
                  <div className="lg:col-span-2 space-y-6">
                    {isLoadingAnalysis ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4" />
                          <p className="text-slate-600">
                            Analyseren portefeuille...
                          </p>
                        </CardContent>
                      </Card>
                    ) : analysisError ? (
                      <Card>
                        <CardContent className="py-12 text-center text-red-600">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                          <p>Fout bij analyse: {analysisError.message}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Health Check */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Gezondheidscheck
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {riskStatus === "complete" ? (
                              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-semibold text-green-900 text-sm">
                                    Risicodata compleet
                                  </div>
                                  <p className="text-xs text-green-800 mt-1">
                                    De Trimilix-indicator is waardegewogen
                                    berekend over alle posities met positieve
                                    waarde.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-semibold text-amber-900 text-sm">
                                    Analyse onvolledig
                                  </div>
                                  <p className="text-xs text-amber-800 mt-1">
                                    {riskStatus === "empty"
                                      ? "Voeg eerst een positie met positieve waarde toe."
                                      : `Ontbrekend: ${missingRiskTickers.join(", ") || "geen"}. Ongeldig: ${invalidRiskTickers.join(", ") || "geen"}.`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Methodiek</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-slate-700">
                              De risicoweergave is een educatieve
                              Trimilix-indicator op schaal 1–5, gewogen op
                              actuele positieomvang. Ontbrekende of ongeldige
                              data wordt niet vervangen door een standaardscore
                              en blokkeert daarom de uitkomst. Dit is geen
                              persoonlijk beleggingsadvies.
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Card className="mb-8">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                  <p className="text-slate-600">
                    Selecteer een portefeuille om details te zien.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {!selectedPortfolioId && portfolios.length > 0 && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
              <p className="text-slate-600">
                Selecteer een portefeuille om details te zien.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
