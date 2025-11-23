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
 * Initialize webview reload-on-resume behavior
 * Call this once on app startup
 */
export function initializeFlutterFlowReload() {
  if (reloadInitialized || typeof window === 'undefined') return;
  
  const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
  
  // Check for manual override via localStorage (for testing)
  const forceReload = localStorage.getItem('forceReloadOnResume') === 'true';
  
  // Check for FlutterFlow-specific indicators
  const hasFlutterGlobal = !!(window as any).flutter || !!(window as any).Flutter;
  const inWebView = isWebView();
  
  // Only log in debug mode to reduce production console noise
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] User Agent:', navigator.userAgent);
    console.log('[FlutterFlow Reload] Detection results:', {
      hasFlutterGlobal,
      inWebView,
      forceReload,
      willActivate: inWebView || hasFlutterGlobal || forceReload
    });
  }
  
  // Activate ONLY in webviews OR if FlutterFlow indicators present OR manual override
  // DO NOT activate on regular mobile browsers (Safari, Chrome) to avoid UX regression
  if (!inWebView && !hasFlutterGlobal && !forceReload) {
    if (isDebugMode) {
      console.log('[FlutterFlow Reload] Not in webview, skipping reload-on-resume');
      console.log('[FlutterFlow Reload] To enable manually, run: localStorage.setItem("forceReloadOnResume", "true")');
    }
    return;
  }
  
  reloadInitialized = true;
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] ✓ Reload-on-resume ACTIVATED (webview detected)');
  }
  
  // Track if we were hidden
  let wasHidden = document.hidden;
  
  const handleVisibilityChange = () => {
    const now = Date.now();
    const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
    
    // Only reload when transitioning from hidden to visible
    if (wasHidden && !document.hidden) {
      // Debounce to prevent multiple rapid reloads
      if (now - lastVisibilityChange < DEBOUNCE_MS) {
        if (isDebugMode) {
          console.log('[FlutterFlow Reload] Skipping reload (debounced)');
        }
        return;
      }
      
      lastVisibilityChange = now;
      
      if (isDebugMode) {
        console.log('[FlutterFlow Reload] App resumed from background - reloading to restore interactivity');
      }
      
      // Use location.replace() for clean reload without history entry
      window.location.replace(window.location.href);
    }
    
    wasHidden = document.hidden;
  };
  
  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Also listen for pageshow (handles iOS back/forward cache)
  window.addEventListener('pageshow', (event) => {
    const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
    // If page was restored from cache, reload it
    if (event.persisted) {
      if (isDebugMode) {
        console.log('[FlutterFlow Reload] Page restored from cache - reloading');
      }
      window.location.replace(window.location.href);
    }
  });
}
