/**
 * Mobile resume handler with click synthesis
 * 
 * Problem: Mobile webviews (FlutterFlow, etc.) sometimes swallow touchend/click events 
 * after resume, making all buttons unresponsive even though CSS :active still works.
 * 
 * Solution (Updated): Use click synthesis to restore interactivity WITHOUT reloading.
 * This preserves audio playback, scroll position, and prayer state.
 * 
 * Only falls back to reload if:
 * 1. Synthesis fails multiple times
 * 2. User explicitly enables forced reload mode
 */

import { initializeClickSynthesis } from './click-synthesis';

let initialized = false;

/**
 * Initialize mobile resume handling
 * Uses click synthesis to restore interactivity without losing state
 */
export function initializeFlutterFlowReload() {
  if (initialized || typeof window === 'undefined') return;
  
  const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
  const forceReloadMode = localStorage.getItem('forceReloadOnResume') === 'true';
  
  // Check if we're on a mobile device
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
  
  if (isDebugMode) {
    console.log('[FlutterFlow] User Agent:', navigator.userAgent);
    console.log('[FlutterFlow] Mobile device:', isMobile);
    console.log('[FlutterFlow] Force reload mode:', forceReloadMode);
  }
  
  // Only activate on mobile devices
  if (!isMobile) {
    if (isDebugMode) {
      console.log('[FlutterFlow] Not a mobile device, skipping mobile resume handling');
    }
    return;
  }
  
  initialized = true;
  
  // If force reload mode is enabled (for troubleshooting), use old behavior
  if (forceReloadMode) {
    if (isDebugMode) {
      console.log('[FlutterFlow] ⚠️ Force reload mode enabled - will reload on resume');
    }
    initializeForcedReload();
    return;
  }
  
  // Use click synthesis (preferred approach - preserves state)
  if (isDebugMode) {
    console.log('[FlutterFlow] ✓ Click synthesis mode - will preserve audio/prayer state');
  }
  initializeClickSynthesis();
  
  // Also handle pageshow for iOS back/forward cache
  // For bfcache, we still need to reload since the JS state is stale
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      if (isDebugMode) {
        console.log('[FlutterFlow] Page restored from bfcache - reloading (unavoidable)');
      }
      window.location.replace(window.location.href);
    }
  });
}

/**
 * Legacy forced reload behavior
 * Only used when localStorage.forceReloadOnResume === 'true'
 */
function initializeForcedReload() {
  let lastVisibilityChange = 0;
  const DEBOUNCE_MS = 1000;
  let wasHidden = document.hidden;
  
  const handleVisibilityChange = () => {
    const now = Date.now();
    const isDebugMode = localStorage.getItem('debugReloadOnResume') === 'true';
    
    if (wasHidden && !document.hidden) {
      if (now - lastVisibilityChange < DEBOUNCE_MS) {
        if (isDebugMode) {
          console.log('[FlutterFlow] Skipping reload (debounced)');
        }
        wasHidden = document.hidden;
        return;
      }
      
      lastVisibilityChange = now;
      
      if (isDebugMode) {
        console.log('[FlutterFlow] Force reload mode - reloading page');
      }
      
      window.location.replace(window.location.href);
    }
    
    wasHidden = document.hidden;
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
