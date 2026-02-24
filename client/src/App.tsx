import { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSafeArea } from "@/hooks/use-safe-area";
import { useModalHistory, useBaseHistoryEntry } from "@/hooks/use-modal-history";
import { useMitzvahSync } from "@/hooks/use-mitzvah-sync";
import { initializeCache } from "@/lib/cache";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ui/error-boundary";
import UpdateNotification from "@/components/UpdateNotification";
const AutoNotificationPrompt = lazy(() => import("@/components/auto-notification-prompt").then(m => ({ default: m.AutoNotificationPrompt })));
import { OfflineIndicator } from "@/components/offline-indicator";
import { SearchProvider } from "@/contexts/SearchContext";
import "@/utils/clear-modal-completions";
import { getLocalDateString, getLocalYesterdayString } from "@/lib/dateUtils";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initializePerformance, whenIdle } from "./lib/startup-performance";
import { initResumeManager } from "./lib/resume-manager";
import { resumeCoordinator } from "./lib/app-resume-coordinator";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Admin = lazy(() => import("@/pages/admin"));
const Privacy = lazy(() => import("@/pages/privacy"));
const ChainPage = lazy(() => import("@/pages/chain"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const Login = lazy(() => import("@/pages/login"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const Feed = lazy(() => import("@/pages/feed"));
const Partners = lazy(() => import("@/pages/partners"));
const GratitudeHistory = lazy(() => import("@/pages/gratitude-history"));
const WeeklyRecipes = lazy(() => import("@/pages/weekly-recipes"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));

// Unified loading screen with app icon - serves as both splash and loading indicator
// Using PWA icon instead of attached_assets for faster load (14KB vs 30KB)
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <img 
        src="/icon-192.png" 
        alt="Loading..." 
        className="w-24 h-24 object-contain animate-pulse"
      />
    </div>
  );
}

function Router() {
  // Track page views when routes change
  useAnalytics();
  
  // Initialize safe area CSS variables for proper layout positioning
  useSafeArea();
  
  // Handle Android back button navigation for modals
  useModalHistory();
  useBaseHistoryEntry();
  
  // Sync mitzvah progress for authenticated users
  useMitzvahSync();
  
  // Initialize critical systems - defer non-critical operations
  useEffect(() => {
    // Defer performance optimizations - not blocking
    setTimeout(() => {
      initializePerformance();
    }, 500);
    
    // Defer cache initialization - not blocking
    setTimeout(() => {
      initializeCache();
    }, 300);
    
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
        <Route path="/statistics">{() => <Statistics />}</Route>
        <Route path="/statistics/alltime">{() => <Statistics initialPeriod="alltime" simplified />}</Route>
        <Route path="/admin" component={Admin} />
        <Route path="/admin/notifications" component={Admin} />
        <Route path="/admin/recipes" component={Admin} />
        <Route path="/admin/messages" component={Admin} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/c/:slug" component={ChainPage} />
        <Route path="/profile" component={Profile} />
        <Route path="/settings" component={Settings} />
        <Route path="/login" component={Login} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/feed" component={Feed} />
        <Route path="/partners" component={Partners} />
        <Route path="/gratitude-history" component={GratitudeHistory} />
        <Route path="/weekly-recipes" component={WeeklyRecipes} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  // Initialize ResumeManager for WebView resume handling
  useEffect(() => {
    initResumeManager();
  }, []);
  
  // Defer Google Analytics initialization until after first paint
  // This saves ~80-100KB on critical boot path
  useEffect(() => {
    whenIdle(() => {
      // Verify required environment variable is present
      if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
        if (import.meta.env.DEV) {
          console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
        }
      } else {
        initGA();
      }
    }, 500);
  }, []);
  
  // Register recovery callback with central coordinator for query refetching
  useEffect(() => {
    // Register query refetch as a recovery callback
    // The coordinator handles debouncing and sequencing
    const unsubscribe = resumeCoordinator.registerRecoveryCallback('app-query-refetch', async () => {
      // Clean up any stuck modal/overlay state
      if (typeof (window as any).__ensurePointerEventsUnlocked === 'function') {
        (window as any).__ensurePointerEventsUnlocked();
      }
      
      const today = getLocalDateString();
      
      // Refetch critical queries for fresh data when returning to the app
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/home-summary', today], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['/api/daily-completion'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['/api/global-progress'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['/api/community-challenge'], type: 'active' }),
        queryClient.refetchQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key?.includes('/api/zmanim') || key?.includes('/api/jewish-times');
          },
          type: 'active'
        }),
      ]);
    });
    
    // Periodic health check: every 60 seconds, clean up any orphaned overlays
    // This catches edge cases where modals/popovers get stuck without proper cleanup
    const healthCheckInterval = setInterval(() => {
      // Only run cleanup if page is visible
      if (resumeCoordinator.isVisible()) {
        if (typeof (window as any).__ensurePointerEventsUnlocked === 'function') {
          (window as any).__ensurePointerEventsUnlocked();
        }
      }
    }, 60000);
    
    return () => {
      unsubscribe();
      clearInterval(healthCheckInterval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SearchProvider>
          <TooltipProvider>
            <UpdateNotification />
            <Suspense fallback={null}><AutoNotificationPrompt /></Suspense>
            <OfflineIndicator />
            <Router />
            <Toaster />
          </TooltipProvider>
        </SearchProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
