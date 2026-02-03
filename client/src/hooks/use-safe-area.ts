import { useEffect } from 'react';

/**
 * Detect if running inside a mobile app webview (FlutterFlow or other app wrappers)
 */
function isInWebview(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    document.referrer.includes('android-app://') ||
    userAgent.includes('wv') ||
    userAgent.includes('webview') ||
    ((/iphone|ipod|ipad/.test(userAgent) && !userAgent.includes('safari')) ||
     (/android/.test(userAgent) && !userAgent.includes('chrome')))
  );
}

/**
 * Detect if running on Android
 */
function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/**
 * Check if env(safe-area-inset-*) returns actual values or 0
 */
function getSafeAreaValues(): { top: number; bottom: number } {
  const testDiv = document.createElement('div');
  testDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    padding-top: env(safe-area-inset-top, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    visibility: hidden;
    pointer-events: none;
  `;
  document.body.appendChild(testDiv);
  const computed = getComputedStyle(testDiv);
  const top = parseFloat(computed.paddingTop) || 0;
  const bottom = parseFloat(computed.paddingBottom) || 0;
  document.body.removeChild(testDiv);
  return { top, bottom };
}

/**
 * Ensures safe-area CSS variables are applied to the document root
 * Call this after modal close to restore proper header/footer padding
 */
export function ensureSafeAreaVariables() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  // Read the current computed values
  const safeAreaTop = computedStyle.getPropertyValue('--safe-area-top') || 'env(safe-area-inset-top, 0px)';
  const safeAreaBottom = computedStyle.getPropertyValue('--safe-area-bottom') || 'env(safe-area-inset-bottom, 0px)';
  const safeAreaLeft = computedStyle.getPropertyValue('--safe-area-left') || 'env(safe-area-inset-left, 0px)';
  const safeAreaRight = computedStyle.getPropertyValue('--safe-area-right') || 'env(safe-area-inset-right, 0px)';
  
  // Reapply to ensure they're still set
  root.style.setProperty('--safe-area-top', safeAreaTop);
  root.style.setProperty('--safe-area-bottom', safeAreaBottom);
  root.style.setProperty('--safe-area-left', safeAreaLeft);
  root.style.setProperty('--safe-area-right', safeAreaRight);
}

/**
 * Safe-area hook with WebView fallbacks
 * Modern browsers use CSS env(safe-area-inset-*) natively
 * Android WebViews often don't report safe areas properly, so we provide fallbacks
 * This hook only runs AFTER first paint, preventing any blocking or layout freeze
 */
export function useSafeArea() {
  useEffect(() => {
    const root = document.documentElement;
    const inWebview = isInWebview();
    const onAndroid = isAndroid();
    
    // Check what env() actually returns
    const envValues = getSafeAreaValues();
    
    // Android WebView fallback: if in webview and env() returns 0, apply sensible defaults
    if (inWebview && onAndroid && envValues.top === 0) {
      // Android status bar is typically 24-32dp, navigation bar is 48dp
      // Using 28px for status bar (common modern Android)
      root.style.setProperty('--safe-area-top', '28px');
      // Bottom navigation bar - only if env returns 0
      if (envValues.bottom === 0) {
        root.style.setProperty('--safe-area-bottom', '0px');
      }
      return;
    }
    
    // iOS WebView fallback (non-Safari)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (inWebview && isIOS && envValues.top === 0) {
      // iPhone notch is typically 44-47px, Dynamic Island is 59px
      root.style.setProperty('--safe-area-top', '47px');
      if (envValues.bottom === 0) {
        // Home indicator area
        root.style.setProperty('--safe-area-bottom', '34px');
      }
      return;
    }
    
    // Only run legacy Safari fallback for very old Safari versions (< 15.4)
    const needsLegacyFallback = (() => {
      const ua = navigator.userAgent;
      const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
      
      if (!isSafari) return false;
      
      // Check if env() is supported by testing if CSS variable resolves
      const testDiv = document.createElement('div');
      testDiv.style.padding = 'env(safe-area-inset-top, 999px)';
      document.body.appendChild(testDiv);
      const computed = getComputedStyle(testDiv).paddingTop;
      document.body.removeChild(testDiv);
      
      // If padding is 999px, env() is not supported
      return computed === '999px';
    })();
    
    if (!needsLegacyFallback) {
      // Modern browser - CSS handles everything, no JS needed
      return;
    }
    
    // Legacy Safari fallback - single passive listener
    const updateFallback = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Simple fallback: if iOS PWA, assume 44px notch
      if (isIOS && isStandalone) {
        root.style.setProperty('--safe-area-top', '44px');
      }
    };
    
    updateFallback();
    
    // Single passive resize listener for orientation changes
    window.addEventListener('resize', updateFallback, { passive: true });
    
    return () => {
      window.removeEventListener('resize', updateFallback);
    };
  }, []); // useEffect runs AFTER first paint, preventing freeze
}
