/**
 * Mobile reload-on-resume handler
 * 
 * Problem: Mobile webviews (FlutterFlow, etc.) sometimes swallow touchend/click events 
 * after resume, making all buttons unresponsive even though CSS :active still works.
 * 
 * Solution: Reload the page when app regains visibility after being backgrounded.
 * Activates automatically on all mobile devices (iOS, Android) to ensure FlutterFlow
 * functionality. Regular mobile browser users may experience a brief reload after
 * returning from background, but this ensures button interactivity is restored.
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
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  // Only log in debug mode to reduce production console noise
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] User Agent:', navigator.userAgent);
    console.log('[FlutterFlow Reload] Mobile device:', isMobile);
  }
  
  // Activate on all mobile devices to ensure FlutterFlow functionality
  if (!isMobile) {
    if (isDebugMode) {
      console.log('[FlutterFlow Reload] Not a mobile device, skipping reload-on-resume');
    }
    return;
  }
  
  reloadInitialized = true;
  if (isDebugMode) {
    console.log('[FlutterFlow Reload] ✓ Reload-on-resume ACTIVATED (mobile device detected)');
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
