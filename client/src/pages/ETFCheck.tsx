import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ETFCheck() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const etfListInput = useMemo(
    () => ({ query: searchTerm.trim() || undefined, limit: 25 }),
    [searchTerm]
  );
  const selectedEtfInput = useMemo(
    () => ({ symbol: selectedSymbol ?? "" }),
    [selectedSymbol]
  );

  const {
    data: etfPages,
    isLoading: isLoadingEtfs,
    error: etfsError,
    hasNextPage: hasMoreEtfs,
    fetchNextPage: fetchMoreEtfs,
    isFetchingNextPage: isFetchingMoreEtfs,
    refetch: refetchEtfs,
    isFetching: isFetchingEtfs,
  } = trpc.etf.list.useInfiniteQuery(etfListInput, {
    enabled: isAuthenticated,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
  });
  const etfs = etfPages?.pages.flatMap(page => page.items) ?? [];
  const {
    data: selectedETF,
    isLoading: isLoadingSelectedEtf,
    error: selectedEtfError,
  } = trpc.etf.get.useQuery(selectedEtfInput, {
    enabled: isAuthenticated && !!selectedSymbol,
  });

  const handleAddToPortfolio = () => {
    if (selectedETF) {
      // TODO: Implement actual add to portfolio logic via tRPC mutation
      toast.success(`${selectedETF.symbol} toegevoegd aan portefeuille (mock)`);
    }
  };

  if (isLoadingEtfs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (etfsError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        Fout bij laden ETF's: {etfsError.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ETF Check™</h1>
          <p className="text-slate-600">
            Analyseer ETF's op kosten, risico en rendement
          </p>
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
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                className="gap-2"
                onClick={() => void refetchEtfs()}
                disabled={isFetchingEtfs}
              >
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
                <CardTitle className="text-lg">
                  Resultaten ({etfs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {etfs.length > 0 ? (
                    etfs.map(etf => (
                      <button
                        key={etf.symbol}
                        onClick={() => setSelectedSymbol(etf.symbol)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedSymbol === etf.symbol
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="font-semibold text-sm">
                          {etf.symbol}
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {etf.name}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-4">
                      Geen ETF's gevonden die overeenkomen met uw zoekterm.
                    </div>
                  )}
                  {hasMoreEtfs && (
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => void fetchMoreEtfs()}
                      disabled={isFetchingMoreEtfs}
                    >
                      {isFetchingMoreEtfs
                        ? "Resultaten laden…"
                        : "Meer resultaten laden"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ETF Details */}
          <div className="lg:col-span-2">
            {isLoadingSelectedEtf ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="animate-spin w-6 h-6" />
                  <p className="text-slate-600 mt-4">Laden ETF details...</p>
                </CardContent>
              </Card>
            ) : selectedEtfError ? (
              <Card>
                <CardContent className="py-12 text-center text-red-600">
                  <AlertCircle className="w-6 h-6 mx-auto mb-4" />
                  Fout bij laden details: {selectedEtfError.message}
                </CardContent>
              </Card>
            ) : selectedETF ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedETF.symbol}</CardTitle>
                  <CardDescription>{selectedETF.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">
                        Totale Kosten (TER)
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedETF.ter
                          ? (selectedETF.ter / 100).toFixed(2)
                          : "N/A"}
                        %
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        {selectedETF.ter && selectedETF.ter < 25 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Laag
                          </span>
                        ) : selectedETF.ter ? (
                          <span className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="w-3 h-3" />
                            Gemiddeld
                          </span>
                        ) : (
                          <span className="text-slate-500">Onbekend</span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Valuta</div>
                      <div className="text-2xl font-bold">
                        {selectedETF.currency}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Handelsvaluta
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">
                        Asset Klasse
                      </div>
                      <div className="text-lg font-bold">
                        {selectedETF.assetClass || "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Type belegging
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-sm text-slate-600 mb-1">Regio</div>
                      <div className="text-lg font-bold">
                        {selectedETF.region || "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Geografische focus
                      </div>
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-green-900 mb-1">
                          Aanbeveling
                        </div>
                        <p className="text-sm text-green-800">
                          Dit is een solide keuze voor lange-termijnbeleggers.
                          Lage kosten en groot vermogen maken dit een stabiele
                          optie.
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
            ) : etfs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-orange-400 mb-4" />
                  <p className="text-slate-600">
                    Geen ETF's beschikbaar in de database.
                  </p>
                  <p className="text-sm text-slate-500">
                    Neem contact op met support als dit een fout is.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600">
                    Selecteer een ETF om details te zien
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
