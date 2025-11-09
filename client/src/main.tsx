import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./lib/optimization";

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
      
      // Handle updates - let new service worker activate naturally without forcing reload
      // This prevents blank screens caused by reloading before assets are cached
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New service worker installed and ready');
              console.log('[SW] Update will take effect on next app launch (no forced reload)');
              
              // Allow the new service worker to activate when ready
              // It will take control on next navigation or page load
              // This prevents blank screens from forced reloads before caching completes
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
      
      // Do NOT call registration.update() - it triggers update checks every time the app
      // resumes from background, causing unwanted reloads when user minimizes/reopens
      // The browser will check for updates naturally (typically every 24 hours)
      // Updates will be applied on next full app launch
      
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
  // Defer DNS prefetch - not needed for initial render
  setTimeout(() => {
    const dnsPrefetchDomains = [
      'assets.ezrasnashim.app',
      'www.hebcal.com',
      'nominatim.openstreetmap.org'
    ];
    
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
