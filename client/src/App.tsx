import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CareerProvider } from "./contexts/CareerContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/resume" component={Home} />
      <Route path="/jobs" component={Home} />
      <Route path="/skill-gaps" component={Home} />
      <Route path="/applications" component={Home} />
      <Route path="/interviews" component={Home} />
      <Route path="/interviews/new" component={Home} />
      <Route path="/interviews/room/:id" component={Home} />
      <Route path="/assessments" component={Home} />
      <Route path="/career-ai" component={Home} />
      <Route path="/analytics" component={Home} />
      <Route path="/settings" component={Home} />
      <Route component={Home} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CareerProvider>
          <TooltipProvider>
            <Toaster position="bottom-right" richColors />
            <Router />
          </TooltipProvider>
        </CareerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
