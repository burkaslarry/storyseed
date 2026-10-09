/*
 * App routes.
 *   /                demo StorySeed studio
 *   /teacher-login   staff OAuth entry
 *   /student-login   school username + one-time code
 *   /teacher         teacher studio (same Home component, teacher mode)
 *   /student         student studio (same Home component, student mode)
 * Unknown paths render NotFound.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TeacherLogin from "./pages/TeacherLogin";
import StudentLogin from "./pages/StudentLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminConsole from "./pages/AdminConsole";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/teacher-login"} component={TeacherLogin} />
      <Route path={"/admin-login"} component={AdminLogin} />
      <Route path={"/student-login"} component={StudentLogin} />
      <Route path={"/admin"} component={AdminConsole} />
      <Route path={"/teacher"} component={Home} />
      <Route path={"/student"} component={Home} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
