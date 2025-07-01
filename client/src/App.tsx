import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import { initializeCache } from "@/lib/cache";
import { useEffect, lazy, Suspense } from "react";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Checkout = lazy(() => import("@/pages/checkout"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush"></div>
  </div>
);

function Router() {
  // Initialize geolocation and preload Jewish times on app startup
  useGeolocation();
  useJewishTimes();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/donate" component={Donate} />
      <Route path="/checkout" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
