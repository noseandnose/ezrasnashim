/**
 * Mobile webview reload-on-resume handler
 * 
 * Problem: Mobile webviews (FlutterFlow, etc.) sometimes swallow touchend/click events 
 * after resume, making all buttons unresponsive even though CSS :active still works.
 * 
 * Solution: Detect mobile devices and reload the page when app regains visibility
 * after being backgrounded. Activates automatically on all iOS and Android devices.
 */

import { isWebView } from './environment';

let reloadInitialized = false;
let lastVisibilityChange = 0;
const DEBOUNCE_MS = 1000; // Prevent multiple rapid reloads

/**
 * Detect if device is mobile (iOS or Android)
 */
function isMobileDevice(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod/.test(ua);
}

/**
 * Initialize FlutterFlow reload-on-resume behavior
 * Call this once on app startup
 */
export function initializeFlutterFlowReload() {
  if (reloadInitialized || typeof window === 'undefined') return;
  
  // Log user agent for debugging
  console.log('[FlutterFlow Reload] User Agent:', navigator.userAgent);
  console.log('[FlutterFlow Reload] isWebView():', isWebView());
  console.log('[FlutterFlow Reload] isMobileDevice():', isMobileDevice());
  
  // Check for manual override via localStorage (for testing)
  const forceReload = localStorage.getItem('forceReloadOnResume') === 'true';
  if (forceReload) {
    console.log('[FlutterFlow Reload] Manual override enabled via localStorage');
  }
  
  // Check for FlutterFlow-specific indicators
  const hasFlutterGlobal = !!(window as any).flutter || !!(window as any).Flutter;
  const isMobile = isMobileDevice();
  
  console.log('[FlutterFlow Reload] Detection results:', {
    hasFlutterGlobal,
    isMobile,
    isWebView: isWebView(),
    forceReload,
    willActivate: isMobile || isWebView() || hasFlutterGlobal || forceReload
  });
  
  // Activate on ALL mobile devices (iOS/Android) OR webview OR FlutterFlow OR manual override
  if (!isMobile && !isWebView() && !hasFlutterGlobal && !forceReload) {
    console.log('[FlutterFlow Reload] Not on mobile device, skipping reload-on-resume');
    console.log('[FlutterFlow Reload] To enable manually, run: localStorage.setItem("forceReloadOnResume", "true")');
    return;
  }
  
  reloadInitialized = true;
  console.log('[FlutterFlow Reload] ✓ Reload-on-resume ACTIVATED (mobile device detected)');
  
  // Track if we were hidden
  let wasHidden = document.hidden;
  
  const handleVisibilityChange = () => {
    const now = Date.now();
    
    // Only reload when transitioning from hidden to visible
    if (wasHidden && !document.hidden) {
      // Debounce to prevent multiple rapid reloads
      if (now - lastVisibilityChange < DEBOUNCE_MS) {
        console.log('[FlutterFlow Reload] Skipping reload (debounced)');
        return;
      }
      
      lastVisibilityChange = now;
      
      console.log('[FlutterFlow Reload] App resumed from background - reloading to restore interactivity');
      
      // Use location.replace() for clean reload without history entry
      window.location.replace(window.location.href);
    }
    
    wasHidden = document.hidden;
  };
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Also listen for pageshow (handles iOS back/forward cache)
  window.addEventListener('pageshow', (event) => {
    // If page was restored from cache, reload it
    if (event.persisted) {
      console.log('[FlutterFlow Reload] Page restored from cache - reloading');
      window.location.replace(window.location.href);
    }
  });
}
