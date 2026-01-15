import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./lib/optimization";

// Auto-reload workaround for FlutterFlow WebView freeze bug
// When WebView resumes from background, React click events stop working
// This detects the resume and forces a reload to restore functionality
if (typeof window !== 'undefined') {
  let lastVisibilityTime = Date.now();
  let wasHidden = false;
  const BACKGROUND_THRESHOLD = 30000; // Only reload if background for 30+ seconds
  
  // Detect when page becomes hidden (app goes to background)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      wasHidden = true;
      lastVisibilityTime = Date.now();
    } else if (wasHidden) {
      // Page is now visible again after being hidden
      const timeInBackground = Date.now() - lastVisibilityTime;
      
      // Only reload if we were in background long enough for WebView to freeze
      if (timeInBackground > BACKGROUND_THRESHOLD) {
        console.log('[WebView Recovery] Reloading after background resume...');
        // Small delay to let WebView stabilize before reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
      wasHidden = false;
    }
  }, { capture: true });
  
  // Also handle pageshow event for bfcache scenarios
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Page was restored from bfcache - always reload
      console.log('[WebView Recovery] Reloading from bfcache...');
      window.location.reload();
    }
  });
  
  // Emergency manual recovery: Tap 5 times quickly in top-right corner
  let cornerTapCount = 0;
  let lastCornerTapTime = 0;
  const CORNER_SIZE = 50;
  const TAP_TIMEOUT = 2000;
  const TAPS_NEEDED = 5;
  
  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    const isInCorner = touch.clientX > window.innerWidth - CORNER_SIZE && 
                       touch.clientY < CORNER_SIZE;
    
    if (isInCorner) {
      const now = Date.now();
      if (now - lastCornerTapTime > TAP_TIMEOUT) {
        cornerTapCount = 1;
      } else {
        cornerTapCount++;
      }
      lastCornerTapTime = now;
      
      if (cornerTapCount >= TAPS_NEEDED) {
        cornerTapCount = 0;
        window.location.reload();
      }
    }
  }, { capture: true, passive: true });
}


// Minimal Safari viewport fix - CSS handles most of this now
function setupSafariViewportFix() {
  // Only set on resize, not on every scroll/focus (performance!)
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVh();
  window.addEventListener('resize', setVh, { passive: true });
}

// Service Worker Registration for Offline Capabilities - DEFERRED for faster startup
async function registerServiceWorker() {
  // CRITICAL: Only register service workers in production or on localhost
  // Development mode on replit.dev domains causes service worker issues
  const isProduction = import.meta.env.MODE === 'production';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isProduction && !isLocalhost) {
    console.log('[SW] Skipping service worker registration in development mode (non-localhost)');
    
    // Clean up any existing service workers from previous sessions - DEFERRED
    if ('serviceWorker' in navigator) {
      setTimeout(() => {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          if (registrations.length > 0) {
            console.log('[SW] Cleaning up', registrations.length, 'existing service worker(s)');
            Promise.all(registrations.map(reg => reg.unregister())).then(() => {
              // Clear all caches after unregistering
              if ('caches' in window) {
                caches.keys().then(names => {
                  Promise.all(names.map(name => caches.delete(name)));
                });
              }
            });
          }
        });
      }, 2000);
    }
    
    // DON'T run version checks in development - causes issues with old service workers
    console.log('[Version] Version checks disabled in development mode');
    return;
  }
  
  if ('serviceWorker' in navigator) {
    try {
      // Skip one-time migration - it's been months, no one needs it anymore
      // This async operation was slowing down every startup
      const hasMigrated = localStorage.getItem('pwa-migrated-v1');
      if (!hasMigrated) {
        // Just mark as migrated without doing the full migration
        localStorage.setItem('pwa-migrated-v1', 'true');
      }
      
      const hasRecoveryAttempt = sessionStorage.getItem('sw-recovery-attempt');
      if (hasRecoveryAttempt) {
        sessionStorage.removeItem('sw-recovery-attempt');
      }
      
      // Server now serves sw.js with no-cache headers to ensure fresh fetches
      // updateViaCache: 'none' tells browser to bypass HTTP cache for sw.js
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      // Handle updates - automatically activate and reload when new version is ready
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New service worker installed, activating immediately...');
              
              // Tell new service worker to skip waiting and activate immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
      
      // Listen for when the new service worker takes control and reload automatically
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        
        console.log('[SW] New service worker activated, reloading for fresh content...');
        window.location.reload();
      });
      
      // Check for service worker updates on app launch after it's ready
      // This ensures users get new versions within hours instead of 24+ hours
      // Only check once on initial registration, not on every focus/resume
      navigator.serviceWorker.ready.then(reg => {
        reg.update().catch(err => {
          console.debug('[SW] Update check skipped:', err);
        });
      });
      
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  }
}

// Emergency recovery for corrupted service worker caches
window.addEventListener('error', async (event) => {
  const errorMessage = event.message || '';
  
  // Detect module script MIME type errors (corrupted SW cache)
  if (errorMessage.includes('Failed to load module script') || 
      errorMessage.includes('MIME type') ||
      errorMessage.includes('text/html')) {
    
    // Prevent infinite recovery loops
    if (sessionStorage.getItem('sw-recovery-attempt')) {
      return;
    }
    
    sessionStorage.setItem('sw-recovery-attempt', 'true');
    
    try {
      // Unregister ALL service workers and clear ALL caches
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      window.location.reload();
    } catch (error) {
      console.error('[SW] Recovery failed:', error);
      sessionStorage.removeItem('sw-recovery-attempt');
    }
  }
}, true);

// App Shell DNS Prefetching and Critical Resource Hints - DEFERRED for faster startup
function preloadAppShell() {
  // Defer non-critical preconnects and DNS prefetch - not needed for initial render
  setTimeout(() => {
    const preconnectDomains = [
      'www.sefaria.org',
      'js.stripe.com',
      'storage.googleapis.com'
    ];
    
    const dnsPrefetchDomains = [
      'assets.ezrasnashim.app',
      'nominatim.openstreetmap.org',
      'maps.googleapis.com'
    ];
    
    // Inject preconnects
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });
    
    // Inject DNS prefetch
    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });
  }, 100);
  
  // Skip font preloading - fonts are already loaded via index.html with font-display: optional
  // This prevents blocking the initial render with font downloads
}

// Initialize performance optimizations
initializeOptimizations();

// Setup Safari viewport fix
setupSafariViewportFix();

// Defer service worker registration - register AFTER app renders for faster startup
setTimeout(() => {
  registerServiceWorker();
}, 50);

// Defer app shell preloading - not needed for initial render
setTimeout(() => {
  preloadAppShell();
}, 100);

// Render app immediately without waiting for service worker or preloads
createRoot(document.getElementById("root")!).render(<App />);
