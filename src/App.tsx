import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ResearchProvider } from "./contexts/ResearchContext";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ResultsPage from "./pages/Results";
import ProgressPage from "./pages/Progress";
import ResetPassword from './pages/ResetPassword';

// Create a single QueryClient instance for react-query
const queryClient = new QueryClient();

// Main App component with all providers and routes
const App = () => (
  // Provide react-query context
  <QueryClientProvider client={queryClient}>
    {/* Tooltip context for UI tooltips */}
    <TooltipProvider>
      {/* Toast notification providers (for different UI libraries) */}
      <Toaster />
      <Sonner />
      {/* Auth context for user authentication */}
      <AuthProvider>
        {/* Research context for research-related state */}
        <ResearchProvider>
          {/* React Router for client-side routing */}
          <BrowserRouter>
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Auth and password reset routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resetPassword" element={<ResetPassword />} />
              {/* Research workflow routes */}
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/results" element={<ResultsPage />} />
              {/* User history and settings */}
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              {/* Catch-all for 404s */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ResearchProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
