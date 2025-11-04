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

// DISABLED: Automatic version checking interrupts users during prayers/audio
// Version updates now handled by useVersionCheck hook in a non-intrusive way
// This function is kept for backward compatibility but not called
async function checkForAppUpdates() {
  // No-op: Version checking disabled to prevent mid-session interruptions
  return;
}

// One-time migration for users on old PWA versions
async function migrateOldPWAUsers() {
  // Check if user has already been migrated
  const hasMigrated = localStorage.getItem('pwa-migrated-v1');
  const isCurrentlyMigrating = sessionStorage.getItem('pwa-migrating');
  
  // Skip if already migrated or currently migrating (prevent loops)
  if (hasMigrated || isCurrentlyMigrating) {
    return false;
  }
  
  // Check if this is an old user without the version system
  const hasVersionSystem = localStorage.getItem('app-version');
  
  // If they already have the version system, mark as migrated and skip
  if (hasVersionSystem) {
    localStorage.setItem('pwa-migrated-v1', 'true');
    return false;
  }
  
  // This is an old user - perform one-time migration
  console.log('[Migration] Detected old PWA installation, performing one-time update...');
  
  // Set migration flag to prevent loops
  sessionStorage.setItem('pwa-migrating', 'true');
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
    
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Mark migration as complete
    localStorage.setItem('pwa-migrated-v1', 'true');
    
    console.log('[Migration] Migration complete, reloading...');
    
    // Reload to get fresh content
    window.location.reload();
    return true;
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    sessionStorage.removeItem('pwa-migrating');
    return false;
  }
}

// Service Worker Registration for Offline Capabilities
async function registerServiceWorker() {
  // CRITICAL: Only register service workers in production or on localhost
  // Development mode on replit.dev domains causes service worker issues
  const isProduction = import.meta.env.MODE === 'production';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isProduction && !isLocalhost) {
    console.log('[SW] Skipping service worker registration in development mode (non-localhost)');
    
    // Clean up any existing service workers from previous sessions
    if ('serviceWorker' in navigator) {
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
    }
    
    // DON'T run version checks in development - causes issues with old service workers
    console.log('[Version] Version checks disabled in development mode');
    return;
  }
  
  if ('serviceWorker' in navigator) {
    try {
      // Perform one-time migration for old PWA users BEFORE registering new SW
      const didMigrate = await migrateOldPWAUsers();
      if (didMigrate) {
        return; // Reload will happen, don't continue registration
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

// App Shell DNS Prefetching and Critical Resource Hints
function preloadAppShell() {
  // DNS prefetch for external APIs
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
  
  // Preload critical CSS and fonts
  const criticalAssets = [
    { href: '/fonts/VC-Koren-Light.otf', as: 'font', type: 'font/otf' },
    { href: '/fonts/KorenSiddur.otf', as: 'font', type: 'font/otf' }
  ];
  
  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset.href;
    link.as = asset.as;
    link.type = asset.type;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Initialize performance optimizations
initializeOptimizations();

// Setup Safari viewport fix
setupSafariViewportFix();

// Register service worker for offline capabilities
registerServiceWorker();

// Preload app shell components
preloadAppShell();

createRoot(document.getElementById("root")!).render(<App />);
