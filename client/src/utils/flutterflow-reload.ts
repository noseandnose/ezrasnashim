/**
 * Mobile reload-on-resume handler
 * 
 * UPDATED: Now uses pointerup-based tap detection via DOM event bridge as primary fix.
 * Force reload is DISABLED by default since pointerup events should work after resume
 * even when touchend/click events are swallowed by FlutterFlow WebView.
 * 
 * The pointerdown event fires (hence CSS :active works), and pointerup should fire too
 * since they're part of the same Pointer Events API.
 * 
 * Force reload can be enabled for testing via:
 * localStorage.setItem('forceReloadOnResume', 'true');
 */

let reloadInitialized = false;
let lastVisibilityChange = 0;
const DEBOUNCE_MS = 1000; // Prevent multiple rapid reloads

/**
 * Initialize mobile reload-on-resume behavior
 * Call this once on app startup
 */
export function initializeFlutterFlowReload() {
  if (reloadInitialized || typeof window === 'undefined') return;
  
  const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
  const forceReloadEnabled = localStorage.getItem('forceReloadOnResume') === 'true';
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  // Only log in debug mode to reduce production console noise
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] User Agent:', navigator.userAgent);
    console.log('[FlutterFlow Reload] Mobile device:', isMobile);
    console.log('[FlutterFlow Reload] Force reload enabled:', forceReloadEnabled);
  }
  
  // Only activate if explicitly enabled or not mobile
  if (!isMobile) {
    if (isDebugMode) {
      console.log('[FlutterFlow Reload] Not a mobile device, skipping reload-on-resume');
    }
    return;
  }
  
  // DISABLED BY DEFAULT: Pointerup-based tap detection in dom-event-bridge.ts should handle this
  // Force reload is now opt-in via localStorage.setItem('forceReloadOnResume', 'true')
  if (!forceReloadEnabled) {
    if (isDebugMode) {
      console.log('[FlutterFlow Reload] Force reload DISABLED - using pointerup detection instead');
      console.log('[FlutterFlow Reload] To enable: localStorage.setItem("forceReloadOnResume", "true")');
    }
    reloadInitialized = true;
    return;
  }
  
  reloadInitialized = true;
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] ✓ Reload-on-resume ACTIVATED (force reload enabled)');
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
