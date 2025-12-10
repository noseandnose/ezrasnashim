import { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSafeArea } from "@/hooks/use-safe-area";
import { useBackButton } from "@/hooks/use-back-button";
import { initializeCache } from "@/lib/cache";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/ui/error-boundary";
import UpdateNotification from "@/components/UpdateNotification";
import { AutoNotificationPrompt } from "@/components/auto-notification-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { SearchProvider } from "@/contexts/SearchContext";
import "@/utils/clear-modal-completions";
import { getLocalDateString, getLocalYesterdayString } from "@/lib/dateUtils";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initializePerformance, whenIdle } from "./lib/startup-performance";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Admin = lazy(() => import("@/pages/admin"));
const Privacy = lazy(() => import("@/pages/privacy"));
const ChainPage = lazy(() => import("@/pages/chain"));

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
  
  // Handle Android back button navigation
  useBackButton();
  
  // Initialize critical systems - defer non-critical operations
  useEffect(() => {
    // CRITICAL FIX: Reset --nav-offset on mount to clear any stale cached values
    document.documentElement.style.setProperty('--nav-offset', '0px');
    
    // Dynamically adjust nav offset based on actual viewport comparison
    // Only apply offset when browser UI is visibly consuming vertical space
    const updateNavOffset = () => {
      const visualHeight = window.visualViewport?.height || window.innerHeight;
      const fullHeight = window.innerHeight;
      
      // If visual viewport is smaller than inner height, browser UI is visible
      // This works across all browsers and standalone modes
      if (visualHeight < fullHeight) {
        const offset = fullHeight - visualHeight;
        document.documentElement.style.setProperty('--nav-offset', `${offset}px`);
      } else {
        document.documentElement.style.setProperty('--nav-offset', '0px');
      }
    };
    
    // Run on mount and when viewport changes
    updateNavOffset();
    window.addEventListener('resize', updateNavOffset, { passive: true });
    window.addEventListener('orientationchange', updateNavOffset, { passive: true });
    
    // Detect if running inside a mobile app webview (FlutterFlow or other app wrappers)
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipod|ipad/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Check for Flutter/FlutterFlow specific markers
    const hasFlutterMarkers = 
      userAgent.includes('flutter') || 
      userAgent.includes('flutterflow') ||
      userAgent.includes('fxlauncher') ||
      userAgent.includes('dart');
    
    // Check for iOS WKWebView messageHandlers (set by Flutter)
    const hasWebkitMessageHandlers = !!(window as any).webkit?.messageHandlers;
    
    // Check for standalone PWA mode (not a webview)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    // Android webview detection - check for WebView markers
    // FlutterFlow uses Android WebView which includes 'wv' or 'Version/X.X Chrome' pattern
    const isAndroidWebview = isAndroid && !isStandalone && (
      document.referrer.includes('android-app://') ||
      userAgent.includes('; wv)') ||  // Standard Android WebView marker
      userAgent.includes('wv)') ||
      userAgent.includes('webview') ||
      // FlutterFlow WebView pattern: has Chrome but also "Version/X.X" which browsers don't have
      (userAgent.includes('chrome') && /version\/\d/.test(userAgent))
    );
    
    // iOS webview detection - WKWebView (no Safari identifier, or has webkit handlers)
    const isIOSWebview = isIOS && !isStandalone && (
      hasWebkitMessageHandlers ||
      // WKWebView doesn't have "Safari" in UA
      (!userAgent.includes('safari') && userAgent.includes('applewebkit'))
    );
    
    // Combined detection
    const isInWebview = hasFlutterMarkers || isAndroidWebview || isIOSWebview;
    
    // Only add visibility change refresh for mobile app WebViews
    // This fixes the untappable buttons issue in FlutterFlow without affecting normal web users
    let wasHidden = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
      } else if (document.visibilityState === 'visible' && wasHidden) {
        // Only refresh in webview to fix untappable buttons
        if (isInWebview) {
          window.location.reload();
        }
        wasHidden = false;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
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
    
    // Cleanup function for event listeners
    return () => {
      window.removeEventListener('resize', updateNavOffset);
      window.removeEventListener('orientationchange', updateNavOffset);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        <Route path="/c/:slug" component={ChainPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
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
  
  // Invalidate queries when app resumes to fetch fresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const today = getLocalDateString();
        queryClient.invalidateQueries({ queryKey: ['/api/home-summary', today] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-completion'] });
        queryClient.invalidateQueries({ queryKey: ['/api/global-progress'] });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SearchProvider>
          <TooltipProvider>
            <UpdateNotification />
            <AutoNotificationPrompt />
            <OfflineIndicator />
            <Router />
            <Toaster />
          </TooltipProvider>
        </SearchProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
