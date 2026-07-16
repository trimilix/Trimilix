import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  calculateCompoundingProjection,
  eurosToCentsHalfUp,
  percentageToBasisPointsHalfUp,
} from "@shared/finance/financialCore";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currencyFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function CompoundingSimulator() {
  const [initialAmount, setInitialAmount] = useState(10_000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [years, setYears] = useState(30);

  const projectionResult = useMemo(() => {
    try {
      return {
        projection: calculateCompoundingProjection({
          initialCents: eurosToCentsHalfUp(initialAmount),
          monthlyContributionCents: eurosToCentsHalfUp(monthlyContribution),
          annualReturnBps: percentageToBasisPointsHalfUp(annualReturn),
          months: years * 12,
        }),
        error: null,
      };
    } catch {
      return {
        projection: null,
        error:
          "De berekening kon niet veilig worden uitgevoerd. Controleer de invoer en probeer het opnieuw.",
      };
    }
  }, [annualReturn, initialAmount, monthlyContribution, years]);

  const projection = projectionResult.projection;
  const data = useMemo(
    () =>
      projection?.points.map(point => ({
        year: point.month / 12,
        balance: point.balanceCents / 100,
        contributions: point.contributedCents / 100,
      })) ?? [],
    [projection]
  );

  const finalBalance = (projection?.finalBalanceCents ?? 0) / 100;
  const totalContributions = (projection?.totalContributedCents ?? 0) / 100;
  const totalGains = (projection?.totalGainCents ?? 0) / 100;
  const gainPercentage =
    projection && projection.totalContributedCents > 0
      ? (projection.totalGainCents / projection.totalContributedCents) * 100
      : 0;

  if (!projection) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800">
              Berekening niet beschikbaar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700" role="alert">
              {projectionResult.error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compounding Simulator™</h1>
          <p className="text-slate-600">
            Bereken een indicatieve vermogensontwikkeling met een controleerbaar
            einde-maandmodel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instellingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="initial" className="text-sm font-medium">
                    Startbedrag: {currencyFormatter.format(initialAmount)}
                  </Label>
                  <Slider
                    id="initial"
                    min={1_000}
                    max={100_000}
                    step={1_000}
                    value={[initialAmount]}
                    onValueChange={value => setInitialAmount(value[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="monthly" className="text-sm font-medium">
                    Maandelijkse inleg:{" "}
                    {currencyFormatter.format(monthlyContribution)}
                  </Label>
                  <Slider
                    id="monthly"
                    min={0}
                    max={5_000}
                    step={100}
                    value={[monthlyContribution]}
                    onValueChange={value => setMonthlyContribution(value[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="return" className="text-sm font-medium">
                    Nominaal jaarrendement: {annualReturn}%
                  </Label>
                  <Slider
                    id="return"
                    min={0}
                    max={15}
                    step={0.5}
                    value={[annualReturn]}
                    onValueChange={value => setAnnualReturn(value[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Prognoseparameter, geen voorspelling of rendementsbelofte.
                  </p>
                </div>

                <div>
                  <Label htmlFor="years" className="text-sm font-medium">
                    Periode: {years} jaar
                  </Label>
                  <Slider
                    id="years"
                    min={1}
                    max={50}
                    step={1}
                    value={[years]}
                    onValueChange={value => setYears(value[0])}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Groei over tijd</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      label={{
                        value: "Jaar",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{ value: "€", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      formatter={value =>
                        currencyFormatter.format(
                          typeof value === "number" ? value : 0
                        )
                      }
                      labelFormatter={label => `Jaar ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#3b82f6"
                      name="Totaal vermogen"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="contributions"
                      stroke="#94a3b8"
                      name="Inleg"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">
                    Totale inleg
                  </div>
                  <div className="text-2xl font-bold">
                    {currencyFormatter.format(totalContributions)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">
                    Berekende groei
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {currencyFormatter.format(totalGains)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">
                    Eindvermogen
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currencyFormatter.format(finalBalance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aannames en inzichten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Rente-op-rente:</strong> de berekende groei is{" "}
                    {gainPercentage.toFixed(0)}% van de totale inleg.
                    Fractionele centen blijven intern behouden en worden bij
                    uitvoer half-up op eurocenten afgerond.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Conservatieve timing:</strong> rendement wordt
                    maandelijks toegepast op het openingssaldo; de inleg van{" "}
                    {currencyFormatter.format(monthlyContribution)} wordt pas
                    aan het einde van iedere maand toegevoegd.
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
