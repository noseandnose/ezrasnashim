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
    }, { passive: true, capture: false });

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
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              setTimeout(() => window.location.reload(), 1000);
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
      
      setTimeout(() => registration.update(), 1000);
      
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
