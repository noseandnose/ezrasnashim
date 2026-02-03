import { Switch, Route, useLocation } from "wouter";
import { useGeolocation, useJewishTimes, useLocationStore } from "@/hooks/use-jewish-times";
import { initializeCache } from "@/lib/cache";
import { useEffect, lazy, Suspense } from "react";
import { getLocalDateString, getLocalYesterdayString } from "@/lib/dateUtils";

// Lazy load components for better initial load performance
const Home = lazy(() => import("@/pages/home"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Donate = lazy(() => import("@/pages/donate"));
const Statistics = lazy(() => import("@/pages/statistics"));
const AdminNotifications = lazy(() => import("@/pages/admin-notifications"));
const AdminRecipes = lazy(() => import("@/pages/admin-recipes"));
const Privacy = lazy(() => import("@/pages/privacy"));

// Optimized loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush"></div>
      <p className="text-sm text-gray-500 font-inter">Loading...</p>
    </div>
  </div>
);

export default function Router() {
  // Early location initialization for faster startup
  const { initializeFromCache } = useLocationStore();
  const [location] = useLocation();
  
  // Initialize geolocation and preload Jewish times on app startup
  useGeolocation();
  useJewishTimes();
  
  // Scroll to top when route changes
  useEffect(() => {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, [location]);
  
  // Initialize cache system and register service worker
  useEffect(() => {
    // Preload location from cache synchronously for instant startup
    initializeFromCache();
    
    initializeCache();
    
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
    
    cleanupModalCompletions();
  }, []);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
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
        <Route path="/admin/notifications" component={AdminNotifications} />
        <Route path="/admin/recipes" component={AdminRecipes} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}