import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CompoundingSimulator() {
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [years, setYears] = useState(30);

  // Calculate compound growth
  const data = useMemo(() => {
    const result = [];
    let balance = initialAmount;

    for (let year = 0; year <= years; year++) {
      result.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(initialAmount + monthlyContribution * 12 * year),
      });

      // Add monthly contributions and apply annual return
      for (let month = 0; month < 12; month++) {
        balance += monthlyContribution;
        balance *= 1 + annualReturn / 100 / 12;
      }
    }

    return result;
  }, [initialAmount, monthlyContribution, annualReturn, years]);

  const finalBalance = data[data.length - 1]?.balance || 0;
  const totalContributions = initialAmount + monthlyContribution * 12 * years;
  const totalGains = finalBalance - totalContributions;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compounding Simulator™</h1>
          <p className="text-slate-600">Bereken je vermogen over tijd met rente-op-rente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Initial Amount */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instellingen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="initial" className="text-sm font-medium">
                    Startbedrag: €{initialAmount.toLocaleString("nl-NL")}
                  </Label>
                  <Slider
                    id="initial"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={[initialAmount]}
                    onValueChange={(val) => setInitialAmount(val[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="monthly" className="text-sm font-medium">
                    Maandelijkse inleg: €{monthlyContribution.toLocaleString("nl-NL")}
                  </Label>
                  <Slider
                    id="monthly"
                    min={0}
                    max={5000}
                    step={100}
                    value={[monthlyContribution]}
                    onValueChange={(val) => setMonthlyContribution(val[0])}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="return" className="text-sm font-medium">
                    Jaarlijks rendement: {annualReturn}%
                  </Label>
                  <Slider
                    id="return"
                    min={0}
                    max={15}
                    step={0.5}
                    value={[annualReturn]}
                    onValueChange={(val) => setAnnualReturn(val[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Historisch gemiddelde aandelen: ~7-8%
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
                    onValueChange={(val) => setYears(val[0])}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Groei over tijd</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: "Jaar", position: "insideBottomRight", offset: -5 }} />
                    <YAxis label={{ value: "€", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      formatter={(value) => `€${(value as number).toLocaleString("nl-NL")}`}
                      labelFormatter={(label) => `Jaar ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Totaal vermogen" strokeWidth={2} />
                    <Line type="monotone" dataKey="contributions" stroke="#94a3b8" name="Inleg" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">Totale inleg</div>
                  <div className="text-2xl font-bold">€{totalContributions.toLocaleString("nl-NL")}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">Winst (rente-op-rente)</div>
                  <div className="text-2xl font-bold text-green-600">€{totalGains.toLocaleString("nl-NL")}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600 mb-1">Eindvermogen</div>
                  <div className="text-2xl font-bold text-blue-600">€{finalBalance.toLocaleString("nl-NL")}</div>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inzichten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Rente-op-rente effect:</strong> {((totalGains / totalContributions) * 100).toFixed(0)}% van je inleg wordt omgezet in winst.
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Maandelijkse impact:</strong> €{monthlyContribution.toLocaleString("nl-NL")} per maand leidt tot €{(monthlyContribution * 12 * years).toLocaleString("nl-NL")} inleg in {years} jaar.
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
