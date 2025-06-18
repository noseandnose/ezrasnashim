import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Donate from "@/pages/donate";
import Checkout from "@/pages/checkout";

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
