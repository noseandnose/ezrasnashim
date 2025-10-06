import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./lib/optimization";

// Comprehensive Safari mobile viewport height fix
function setViewportHeight() {
  // Set the actual viewport height as CSS custom property
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Also set visualViewport height if available (iOS Safari 13+)
  if (window.visualViewport) {
    const visualVh = window.visualViewport.height * 0.01;
    document.documentElement.style.setProperty('--visual-vh', `${visualVh}px`);
  }
}

function setupSafariViewportFix() {
  // Detect iOS Safari specifically
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android|crios|fxios|opios).)*safari/i.test(navigator.userAgent);
  const isWebkit = 'WebkitAppearance' in document.documentElement.style;
  
  if ((isIOS || isSafari || isWebkit)) {
    // Set initial value immediately
    setViewportHeight();
    
    // Update on window resize (URL bar show/hide)
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setViewportHeight, 50);
    });

    // Update on scroll (URL bar changes during scroll)
    let scrollTimer: number;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(setViewportHeight, 50);
    }, { passive: true });

    // Visual Viewport API support for modern iOS
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    // Orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 300);
    });

    // Page visibility changes (when returning to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(setViewportHeight, 100);
      }
    });

    // Focus events (keyboard show/hide on iOS)
    window.addEventListener('focusin', () => setTimeout(setViewportHeight, 300));
    window.addEventListener('focusout', () => setTimeout(setViewportHeight, 300));
  }
}

// Service Worker Registration for Offline Capabilities
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // EMERGENCY RECOVERY: Check if we have a corrupted service worker
      // This detects module script errors from corrupted caches
      const hasCorruptedCache = sessionStorage.getItem('sw-recovery-attempt');
      if (hasCorruptedCache) {
        console.log('[SW] Recovery attempt detected, proceeding with normal registration');
        sessionStorage.removeItem('sw-recovery-attempt');
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always fetch fresh service worker
      });
      
      console.log('[SW] Service Worker registered successfully:', registration.scope);
      
      // Handle updates with user notification (no auto-reload to prevent cache issues)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[SW] New Service Worker installing...');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available! Activating...');
              // Send message to activate immediately (it will clear caches)
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              // Wait for activation, then reload
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          });
        }
      });
      
      // Check for updates every 30 seconds when page is visible
      setInterval(() => {
        if (!document.hidden && navigator.onLine) {
          registration.update();
        }
      }, 30000);
      
      // Also check for updates immediately
      setTimeout(() => registration.update(), 1000);
      
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  } else {
    console.log('[SW] Service Worker not supported in this browser');
  }
}

// Emergency recovery for corrupted service worker caches
// This runs BEFORE anything else to catch module script errors
window.addEventListener('error', async (event) => {
  const errorMessage = event.message || '';
  
  // Detect module script MIME type errors (corrupted SW cache)
  if (errorMessage.includes('Failed to load module script') || 
      errorMessage.includes('MIME type') ||
      errorMessage.includes('text/html')) {
    
    console.error('[SW RECOVERY] Detected corrupted service worker cache. Attempting recovery...');
    
    // Prevent infinite recovery loops
    const recoveryAttempt = sessionStorage.getItem('sw-recovery-attempt');
    if (recoveryAttempt) {
      console.error('[SW RECOVERY] Already attempted recovery. Manual intervention needed.');
      return;
    }
    
    // Mark that we're attempting recovery
    sessionStorage.setItem('sw-recovery-attempt', 'true');
    
    try {
      // Unregister ALL service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[SW RECOVERY] Unregistered service worker');
      }
      
      // Clear ALL caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[SW RECOVERY] Deleted cache:', cacheName);
      }
      
      // Reload the page to get fresh content
      console.log('[SW RECOVERY] Recovery complete. Reloading page...');
      window.location.reload();
      
    } catch (error) {
      console.error('[SW RECOVERY] Recovery failed:', error);
      sessionStorage.removeItem('sw-recovery-attempt');
    }
  }
}, true); // Use capture phase to catch errors early

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
