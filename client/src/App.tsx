import { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSafeArea } from "@/hooks/use-safe-area";
import { useBackButton } from "@/hooks/use-back-button";
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
import { forceCloseAllFullscreenModals } from "@/components/ui/fullscreen-modal";

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
  
  // Sync mitzvah progress for authenticated users
  useMitzvahSync();
  
  // Initialize critical systems - defer non-critical operations
  useEffect(() => {
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
    
    // WebView resume handler for FlutterFlow apps
    // Fixes untappable buttons by resetting scroll locks after returning from background
    // visibilitychange is UNRELIABLE in Flutter WebViews - use multiple detection methods
    let lastBackgroundTime: number | null = null;
    let isRecovering = false; // Prevent double-recovery
    let resumeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const BACKGROUND_THRESHOLD = 3000; // 3 seconds - trigger soft recovery
    const RESUME_DEBOUNCE = 200; // Debounce resume detection
    
    const markBackground = () => {
      if (isInWebview) {
        // ALWAYS update the time - multiple events may fire, use the latest
        lastBackgroundTime = Date.now();
        console.log('[WebView] Marked background at', new Date().toISOString());
      }
    };
    
    const handleResume = () => {
      // Prevent double-recovery and ensure we're in webview
      if (!isInWebview || isRecovering) return;
      
      // Clear any pending debounce
      if (resumeDebounceTimer) {
        clearTimeout(resumeDebounceTimer);
      }
      
      // Debounce to let all resume events settle
      resumeDebounceTimer = setTimeout(() => {
        if (lastBackgroundTime !== null && !isRecovering) {
          const timeInBackground = Date.now() - lastBackgroundTime;
          
          if (timeInBackground > BACKGROUND_THRESHOLD) {
            isRecovering = true;
            console.log('[WebView] App resumed after', Math.round(timeInBackground / 1000), 'seconds, reloading for clean state...');
            // Skip soft recovery - go straight to reload since it's the only reliable fix
            window.location.reload();
          } else {
            // Just reset scroll lock for short background times (no reload needed)
            console.log('[WebView] Short background time', Math.round(timeInBackground / 1000), 's, just resetting scroll locks');
            forceCloseAllFullscreenModals();
          }
          
          // Reset background time after handling
          lastBackgroundTime = null;
        }
      }, RESUME_DEBOUNCE);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        markBackground();
      } else if (document.visibilityState === 'visible') {
        handleResume();
      }
    };
    
    // FlutterFlow WebViews may fire blur/pagehide without visibilitychange
    const handleBlur = () => {
      markBackground();
    };
    
    const handlePageHide = () => {
      markBackground();
    };
    
    // Listen to pageshow for back/forward cache restoration (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || lastBackgroundTime !== null) {
        handleResume();
      }
    };
    
    // Listen to focus for when WebView regains focus without visibility change
    const handleFocus = () => {
      handleResume();
    };
    
    // FALLBACK: Use requestAnimationFrame polling as a last resort
    // If the WebView is frozen, rAF won't fire. When it resumes, it will.
    let lastRafTime = Date.now();
    let rafId: number;
    const rafCheck = () => {
      const now = Date.now();
      const elapsed = now - lastRafTime;
      
      // If more than BACKGROUND_THRESHOLD has passed since last rAF, we were in background
      if (elapsed > BACKGROUND_THRESHOLD && isInWebview && !isRecovering) {
        console.log('[WebView] rAF detected background gap of', Math.round(elapsed / 1000), 's, reloading...');
        isRecovering = true;
        window.location.reload();
      }
      
      lastRafTime = now;
      rafId = requestAnimationFrame(rafCheck);
    };
    
    // Only use rAF fallback in WebView
    if (isInWebview) {
      rafId = requestAnimationFrame(rafCheck);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pagehide', handlePageHide);
    
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow as EventListener);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pagehide', handlePageHide);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (resumeDebounceTimer) {
        clearTimeout(resumeDebounceTimer);
      }
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
