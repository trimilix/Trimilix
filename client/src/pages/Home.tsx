import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Wallet, Target, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

const TRIMILIX_PRIMARY_LOGO = "/manus-storage/trimilix-logo-primary-on-black_3cfb5a41.svg";
const TRIMILIX_HORIZONTAL_LOGO = "/manus-storage/trimilix-logo-horizontal-transparent-dark-surfaces_9d8c0275.svg";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
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
      <div className="relative min-h-screen overflow-hidden bg-[#050505] px-4 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(244,196,63,0.13),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_45%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center py-16 text-center">
          <img
            src={TRIMILIX_PRIMARY_LOGO}
            alt="Trimilix"
            className="mb-8 h-auto w-full max-w-[360px]"
          />
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Je persoonlijke financiële cockpit voor eenvoudige, transparante en gedisciplineerde beslissingen.
          </p>
          <Button
            size="lg"
            onClick={() => startLogin()}
            className="bg-[#f4c43f] text-black shadow-[0_12px_32px_rgba(244,196,63,0.18)] hover:bg-[#ffd76a]"
          >
            Inloggen of registreren
          </Button>
          <p className="mt-6 text-xs uppercase tracking-[0.22em] text-zinc-500">Educatief platform · geen beleggingsadvies</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-[#29240f] bg-[#050505] text-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <img
                src={TRIMILIX_HORIZONTAL_LOGO}
                alt="Trimilix"
                className="h-auto w-[164px] shrink-0 sm:w-[190px]"
              />
              <div className="hidden h-10 w-px bg-zinc-800 sm:block" aria-hidden="true" />
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">Welkom, {user?.name || "Belegger"}</h1>
                <p className="mt-1 text-sm text-zinc-400">Jouw financiële overzicht</p>
              </div>
            </div>
            <div className="text-sm text-zinc-300">
              {subscription?.plan === "premium" && (
                <span className="inline-block rounded-full border border-[#f4c43f]/35 bg-[#f4c43f]/10 px-3 py-1 font-medium text-[#f4c43f]">
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
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/etf-check")}>
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
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/compounding-simulator")}>
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
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/portfolio-checker")}>
                Analyseren
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-red-600" />
                Doelplanner™
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">Stel doelen en volg je voortgang</p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/goal-planner")}>
                Plannen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
