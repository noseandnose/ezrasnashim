import { useEffect } from 'react';

/**
 * Detect if running inside a mobile app webview (FlutterFlow or other app wrappers)
 * These wrappers typically handle safe areas at the native level
 */
function isInNativeAppWrapper(): boolean {
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
 * Ensures safe-area CSS variables are applied to the document root
 * Call this after modal close to restore proper header/footer padding
 */
export function ensureSafeAreaVariables() {
  const root = document.documentElement;
  
  // If in native app wrapper, FlutterFlow handles safe areas - don't override
  if (isInNativeAppWrapper()) {
    return;
  }
  
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
 * Safe-area hook that handles native app wrappers and legacy browsers
 * - FlutterFlow and other native wrappers handle safe areas at the native level,
 *   so we set CSS safe-area values to 0 to prevent double padding
 * - Modern browsers use CSS env(safe-area-inset-*) natively
 * - Legacy Safari gets fallback values
 */
export function useSafeArea() {
  useEffect(() => {
    const root = document.documentElement;
    
    // Check if running inside a native app wrapper (FlutterFlow, etc.)
    // These handle safe areas at the native level, so we should NOT apply CSS safe areas
    if (isInNativeAppWrapper()) {
      // Set all safe areas to 0 since native wrapper handles them
      root.style.setProperty('--safe-area-top', '0px');
      root.style.setProperty('--safe-area-bottom', '0px');
      root.style.setProperty('--safe-area-left', '0px');
      root.style.setProperty('--safe-area-right', '0px');
      return;
    }
    
    // Only run fallback for very old Safari versions (< 15.4) that don't support env()
    const needsFallback = (() => {
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
    
    if (!needsFallback) {
      // Modern browser - CSS handles everything, no JS needed
      return;
    }
    
    // Legacy Safari fallback - single passive listener
    const updateFallback = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
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
