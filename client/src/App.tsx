import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const ETFCheck = lazy(() => import("./pages/ETFCheck"));
const PortfolioChecker = lazy(() => import("./pages/PortfolioChecker"));
const CompoundingSimulator = lazy(() => import("./pages/CompoundingSimulator"));
const GoalPlanner = lazy(() => import("./pages/GoalPlanner"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <main
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-6"
      aria-busy="true"
    >
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <span
          className="size-5 rounded-full border-2 border-primary/30 border-t-primary motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">Pagina laden…</span>
      </div>
    </main>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/etf-check"} component={ETFCheck} />
      <Route path={"/portfolio-checker"} component={PortfolioChecker} />
      <Route path={"/compounding-simulator"} component={CompoundingSimulator} />
      <Route path={"/goal-planner"} component={GoalPlanner} />
      <Route path={"/404"} component={NotFound} />

      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<RouteFallback />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
