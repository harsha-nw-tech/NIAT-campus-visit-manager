import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import Login from "./pages/login";
import SalesDashboard from "./pages/sales";
import AdminDashboard from "./pages/admin";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient();

// Route guard component
function ProtectedRoute({ component: Component, allowedRole }: { component: any, allowedRole: string }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  
  if (user?.role !== allowedRole) {
    // Redirect to correct dashboard based on role
    window.location.href = user?.role === "admin" ? "/admin" : "/";
    return null;
  }
  
  return <Component />;
}

// Public route that redirects to dashboard if already logged in
function PublicRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    window.location.href = user?.role === "admin" ? "/admin" : "/";
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={SalesDashboard} allowedRole="sales" />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRole="admin" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
