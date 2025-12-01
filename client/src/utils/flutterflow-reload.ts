/**
 * Mobile resume handler - DISABLED
 * 
 * Click synthesis caused phantom clicks, so it's been disabled.
 * The proper fix is on the FlutterFlow side - add App Lifecycle Listener
 * that reloads the WebView on resume (see replit.md for Dart code).
 * 
 * This file is kept for the iOS bfcache handler only.
 */

let initialized = false;

/**
 * Initialize mobile resume handling
 * Currently only handles iOS bfcache - FlutterFlow fix is done on native side
 */
export function initializeFlutterFlowReload() {
  if (initialized || typeof window === 'undefined') return;
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  // Only activate on mobile devices
  if (!isMobile) {
    return;
  }
  
  initialized = true;
  
  // Handle pageshow for iOS back/forward cache only
  // For bfcache, we still need to reload since the JS state is stale
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.replace(window.location.href);
    }
  });
}
