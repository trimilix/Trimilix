import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Mock goals
const mockGoals = [
  {
    id: 1,
    name: "Huis kopen",
    targetAmount: 100000,
    currentAmount: 45000,
    targetDate: new Date("2028-12-31"),
  },
  {
    id: 2,
    name: "Pensioen",
    targetAmount: 500000,
    currentAmount: 120000,
    targetDate: new Date("2055-12-31"),
  },
  {
    id: 3,
    name: "Sabbatical",
    targetAmount: 50000,
    currentAmount: 25000,
    targetDate: new Date("2027-06-30"),
  },
];

export default function GoalPlanner() {
  const [goals, setGoals] = useState(mockGoals);
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", targetDate: "" });
  const [showForm, setShowForm] = useState(false);

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error("Vul alle velden in");
      return;
    }

    const goal = {
      id: Math.max(...goals.map((g) => g.id), 0) + 1,
      name: newGoal.name,
      targetAmount: parseInt(newGoal.targetAmount),
      currentAmount: 0,
      targetDate: new Date(newGoal.targetDate),
    };

    setGoals([...goals, goal]);
    setNewGoal({ name: "", targetAmount: "", targetDate: "" });
    setShowForm(false);
    toast.success("Doel toegevoegd!");
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
    toast.success("Doel verwijderd");
  };

  const yearsUntilGoal = (targetDate: Date) => {
    const today = new Date();
    const years = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, Math.round(years * 10) / 10);
  };

  const monthlyNeeded = (goal: typeof mockGoals[0]) => {
    const years = yearsUntilGoal(goal.targetDate);
    if (years <= 0) return 0;
    const remaining = goal.targetAmount - goal.currentAmount;
    return Math.ceil(remaining / (years * 12));
  };

  const totalProgress = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doelplanner™</h1>
          <p className="text-slate-600">Stel financiële doelen en volg je voortgang</p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Totale voortgang</CardTitle>
            <CardDescription>Alle doelen gecombineerd</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">€{totalProgress.toLocaleString("nl-NL")} van €{totalTarget.toLocaleString("nl-NL")}</span>
                  <span className="text-slate-600">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Goal Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nieuw doel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="goal-name">Doelnaam</Label>
                  <Input
                    id="goal-name"
                    placeholder="bijv. Huis kopen"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="goal-amount">Bedrag (€)</Label>
                  <Input
                    id="goal-amount"
                    type="number"
                    placeholder="100000"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="goal-date">Doeldatum</Label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddGoal}>Toevoegen</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals List */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mijn doelen ({goals.length})</h2>
          {!showForm && (
            <Button className="gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Nieuw doel
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const years = yearsUntilGoal(goal.targetDate);
            const monthly = monthlyNeeded(goal);

            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Goal Info */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{goal.name}</h3>
                          <p className="text-sm text-slate-600">
                            Doeldatum: {goal.targetDate.toLocaleDateString("nl-NL")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Voortgang</div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">€{goal.currentAmount.toLocaleString("nl-NL")}</span>
                          <span className="text-slate-600">€{goal.targetAmount.toLocaleString("nl-NL")}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <p className="text-sm font-medium">{Math.round(progress)}% bereikt</p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Resterende tijd</div>
                      {years > 0 ? (
                        <>
                          <p className="text-lg font-bold">{years} jaar</p>
                          <p className="text-xs text-slate-600">~{Math.round(years * 12)} maanden</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Bereikt!
                        </p>
                      )}
                    </div>

                    {/* Monthly Target */}
                    <div>
                      <div className="text-sm text-slate-600 mb-2">Maandelijks nodig</div>
                      {years > 0 ? (
                        <>
                          <p className="text-lg font-bold text-blue-600">€{monthly.toLocaleString("nl-NL")}</p>
                          <p className="text-xs text-slate-600">om op tijd klaar te zijn</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-slate-400">-</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 mb-4">Je hebt nog geen doelen ingesteld</p>
              <Button onClick={() => setShowForm(true)}>Eerste doel maken</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
