import { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import { initializeCache } from "@/lib/cache";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ui/error-boundary";
import UpdateNotification from "@/components/UpdateNotification";
import { AutoNotificationPrompt } from "@/components/auto-notification-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import "@/utils/clear-modal-completions";
import { getLocalDateString, getLocalYesterdayString } from "@/lib/dateUtils";
import logoPath from '@assets/EN App Icon_1756705023411.png';
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initializePerformance, whenIdle } from "./lib/startup-performance";
import { preloadCriticalResources, registerServiceWorker } from "./utils/bundle-optimization";
import { SkeletonCard } from "./components/ui/skeleton-loading";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Admin = lazy(() => import("@/pages/admin"));
const Privacy = lazy(() => import("@/pages/privacy"));

// Enhanced loading screen with skeleton loading
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-4">
      <img 
        src={logoPath} 
        alt="Loading..." 
        className="w-24 h-24 object-contain animate-pulse mb-4"
      />
      <div className="w-full max-w-sm space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  // Initialize location immediately for accurate prayer times
  useGeolocation();
  useJewishTimes();
  
  // Initialize critical systems
  useEffect(() => {
    // Initialize performance optimizations
    initializePerformance();
    
    // Initialize cache system
    initializeCache();
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Register service worker for offline functionality
    registerServiceWorker();
    
    // One-time cleanup of stale modal completion data
    const cleanupModalCompletions = () => {
      try {
        const stored = localStorage.getItem('modalCompletions');
        if (stored) {
          const parsed = JSON.parse(stored);
          const today = getLocalDateString();
          const yesterdayStr = getLocalYesterdayString();
          
          // Keep only today and yesterday
          const cleaned: Record<string, string[]> = {};
          for (const [date, modals] of Object.entries(parsed)) {
            if (date === today || date === yesterdayStr) {
              cleaned[date] = modals as string[];
            }
          }
          
          localStorage.setItem('modalCompletions', JSON.stringify(cleaned));
        }
      } catch (e) {
        // If data is corrupted, clear it
        localStorage.removeItem('modalCompletions');
      }
    };
    
    // Low priority: Clean up modal completions when idle
    whenIdle(() => {
      cleanupModalCompletions();
    }, 3000);
  }, []);
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/torah" component={Home} />
        <Route path="/tefilla" component={Home} />
        <Route path="/tzedaka" component={Home} />
        <Route path="/life" component={Home} />
        {/* Redirect old /table route to /life for backward compatibility */}
        <Route path="/table">
          {() => {
            window.location.replace('/life');
            return null;
          }}
        </Route>
        <Route path="/donate" component={Donate} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/notifications" component={Admin} />
        <Route path="/admin/recipes" component={Admin} />
        <Route path="/admin/messages" component={Admin} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UpdateNotification />
          <AutoNotificationPrompt />
          <OfflineIndicator />
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
