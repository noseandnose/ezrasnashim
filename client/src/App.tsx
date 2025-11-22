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
import { forceResetScrollLock } from "@/components/ui/fullscreen-modal";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Statistics = lazy(() => import("@/pages/statistics"));
const Admin = lazy(() => import("@/pages/admin"));
const Privacy = lazy(() => import("@/pages/privacy"));

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
  
  // CRITICAL: Restore interactions after app resume
  // PWA/app environments have unreliable visibilitychange events, so we listen to multiple signals
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    // Import isWebView dynamically
    import('@/utils/environment').then(({ isWebView }) => {
      const inWebView = isWebView();
      
      // CRITICAL FIX FOR FLUTTERFLOW: FlutterFlow web views suspend ALL events
      // (visibilitychange, focus, pageshow) and requestAnimationFrame while backgrounded.
      // We need a polling mechanism that works even when events don't fire.
      if (inWebView) {
        let lastVisibilityState = document.visibilityState;
        let wasHidden = document.hidden;
        
        // Poll for visibility changes since FlutterFlow doesn't fire events reliably
        pollInterval = setInterval(() => {
          const currentVisibilityState = document.visibilityState;
          const isHidden = document.hidden;
          
          // Detect transition from hidden to visible
          if ((wasHidden && !isHidden) || (lastVisibilityState === 'hidden' && currentVisibilityState === 'visible')) {
            console.log('[FlutterFlow Resume] Detected app resume via polling');
            
            // Use setTimeout (NOT requestAnimationFrame) for FlutterFlow
            // rAF doesn't work in FlutterFlow web views
            setTimeout(() => {
              console.log('[FlutterFlow Resume] Forcing pointer-events restore');
              
              // Force restore ALL pointer-events immediately
              const contentArea = document.querySelector('.content-area') as HTMLElement;
              const mobileApp = document.querySelector('.mobile-app') as HTMLElement;
              const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement;
              
              if (contentArea) {
                contentArea.style.pointerEvents = 'auto';
                contentArea.style.overflow = 'auto';
                console.log('[FlutterFlow Resume] .content-area pointer-events:', window.getComputedStyle(contentArea).pointerEvents);
              }
              
              if (mobileApp) {
                mobileApp.style.pointerEvents = 'auto';
                mobileApp.style.overflow = 'auto';
              }
              
              if (bottomNav) {
                bottomNav.style.pointerEvents = 'auto';
                console.log('[FlutterFlow Resume] bottom-nav pointer-events:', window.getComputedStyle(bottomNav).pointerEvents);
              }
              
              // Restore body/html
              document.body.style.overflow = 'auto';
              document.body.style.pointerEvents = 'auto';
              document.documentElement.style.overflow = 'auto';
              
              // Force restore all interactive elements
              document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
                (el as HTMLElement).style.pointerEvents = 'auto';
              });
              
              // Force reflow
              document.body.offsetHeight;
              
              console.log('[FlutterFlow Resume] Pointer-events restore complete');
              
              // Invalidate queries after restore
              const today = getLocalDateString();
              queryClient.invalidateQueries({ queryKey: ['/api/home-summary', today] });
              queryClient.invalidateQueries({ queryKey: ['/api/daily-completion'] });
              queryClient.invalidateQueries({ queryKey: ['/api/global-progress'] });
            }, 0); // Immediate setTimeout (not rAF)
          }
          
          lastVisibilityState = currentVisibilityState;
          wasHidden = isHidden;
        }, 500); // Poll every 500ms
      }
    });
    
    // Shared helper to restore all interactions after app resume (for non-FlutterFlow)
    const restoreInteractions = () => {
      // Invalidate critical queries to fetch fresh data
      const today = getLocalDateString();
      queryClient.invalidateQueries({ queryKey: ['/api/home-summary', today] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/global-progress'] });
      
      // Force complete interaction restore after app resume
      // This prevents buttons from becoming unresponsive after app minimize/resume
      setTimeout(() => {
        // CRITICAL FIX: Always force reset scroll locks FIRST, regardless of modal state
        // The fullscreen modal uses requestAnimationFrame for cleanup, which doesn't run
        // when the app is backgrounded, leaving pointer-events: none stuck on scroll container
        forceResetScrollLock();
        
        // Also clear any other potential pointer-event locks
        const scrollContainer = document.querySelector('[data-scroll-lock-target]') as HTMLElement 
          ?? document.querySelector('.content-area') as HTMLElement;
        
        if (scrollContainer) {
          scrollContainer.style.overflow = '';
          scrollContainer.style.pointerEvents = '';
        }
        
        // Restore body/html
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.pointerEvents = '';
        
        // Force restore pointer events on all interactive elements
        document.querySelectorAll('button, a, input, select, textarea').forEach(el => {
          (el as HTMLElement).style.pointerEvents = '';
        });
        
        // Force a reflow to ensure styles are applied
        document.body.offsetHeight;
        
        // Now check if there are any ACTUALLY OPEN modals and reapply locks if needed
        // Need to check both Radix dialogs AND fullscreen modals:
        // - [role="dialog"][data-state="open"] for Radix dialogs
        // - [data-fullscreen-modal] for custom fullscreen modals
        const hasRadixModal = document.querySelector('[role="dialog"][data-state="open"]');
        const hasFullscreenModal = document.querySelector('[data-fullscreen-modal]');
        
        if (hasRadixModal || hasFullscreenModal) {
          // Modal is genuinely open - reapply scroll lock
          if (scrollContainer) {
            scrollContainer.style.overflow = 'hidden';
          }
        }
      }, 100); // Small delay to ensure app is fully visible
    };
    
    // Listen to visibilitychange (works in most browsers)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreInteractions();
      }
    };
    
    // Listen to focus (catches when app regains focus)
    const handleFocus = () => {
      restoreInteractions();
    };
    
    // Listen to pageshow (catches bfcache restores and iOS PWA resume)
    const handlePageShow = () => {
      // Always restore on pageshow, including persisted (bfcache) events
      restoreInteractions();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      // Clean up FlutterFlow polling interval if it exists
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
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
