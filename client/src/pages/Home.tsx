import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Wallet, Target, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: portfolios, isLoading: portfoliosLoading } = trpc.portfolio.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: subscription } = trpc.subscription.get.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <Wallet className="w-16 h-16 mx-auto text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Trimilix</h1>
          <p className="text-lg text-slate-600 mb-8">
            Je persoonlijke financiële cockpit. Betere investeringsbeslissingen, vandaag.
          </p>
          <Button size="lg" onClick={() => startLogin()}>
            Inloggen of registreren
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welkom, {user?.name || "Belegger"}</h1>
              <p className="text-slate-600 mt-1">Jouw financiële overzicht</p>
            </div>
            <div className="text-sm text-slate-600">
              {subscription?.plan === "premium" && (
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  Premium
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Portfolio Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Mijn Portefeuilles</h2>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Nieuwe portefeuille
            </Button>
          </div>

          {portfoliosLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : portfolios && portfolios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-600" />
                      {portfolio.name}
                    </CardTitle>
                    <CardDescription>{portfolio.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      €{(portfolio.totalValue / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Totale waarde</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Je hebt nog geen portefeuilles aangemaakt</p>
                <Button variant="outline">Eerste portefeuille maken</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                ETF Check™
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Analyseer ETF's op kosten, risico en rendement</p>
              <Button size="sm" variant="outline" className="w-full">
                Starten
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-purple-600" />
                Compounding Simulator™
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Bereken je vermogen over tijd met rente-op-rente</p>
              <Button size="sm" variant="outline" className="w-full">
                Simuleren
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-orange-600" />
                Portfolio Checker™
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Controleer je portefeuille op diversificatie</p>
              <Button size="sm" variant="outline" className="w-full">
                Analyseren
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
