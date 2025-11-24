/**
 * Mobile reload-on-resume handler (DISABLED - Root cause fixed in dom-event-bridge.ts)
 * 
 * This was a workaround for button freeze issues caused by the DOM Event Bridge's
 * periodic listener removal/reattachment. Now that the root cause is fixed,
 * this reload mechanism is no longer needed and would only break audio playback.
 * 
 * Keeping this file for reference/emergency rollback if needed.
 */

let reloadInitialized = false;
let lastVisibilityChange = 0;
const DEBOUNCE_MS = 1000; // Prevent multiple rapid reloads

/**
 * Initialize mobile reload-on-resume behavior (DISABLED)
 * Root cause fixed - no longer needed
 */
export function initializeFlutterFlowReload() {
  if (reloadInitialized || typeof window === 'undefined') return;
  
  const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
  
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] DISABLED - Root cause fixed in DOM Event Bridge');
    console.log('[FlutterFlow Reload] Buttons should work without reload workaround');
  }
  
  // DO NOT activate reload - root cause is fixed
  // If buttons freeze again, re-enable by uncommenting below and removing early return
  return;
  
  reloadInitialized = true;
  
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
