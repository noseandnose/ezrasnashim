/**
 * FlutterFlow-specific reload-on-resume handler
 * 
 * Problem: FlutterFlow webview sometimes swallows touchend/click events after resume,
 * making all buttons unresponsive even though CSS :active still works.
 * 
 * Solution: Detect FlutterFlow environment and reload the page when app regains visibility.
 */

import { isWebView } from './environment';

let reloadInitialized = false;
let lastVisibilityChange = 0;
const DEBOUNCE_MS = 1000; // Prevent multiple rapid reloads

/**
 * Initialize FlutterFlow reload-on-resume behavior
 * Call this once on app startup
 */
export function initializeFlutterFlowReload() {
  if (reloadInitialized || typeof window === 'undefined') return;
  
  // Only activate in webview environments (FlutterFlow, etc.)
  if (!isWebView()) {
    console.log('[FlutterFlow Reload] Not in webview, skipping reload-on-resume');
    return;
  }
  
  reloadInitialized = true;
  console.log('[FlutterFlow Reload] Initializing reload-on-resume for webview environment');
  
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
