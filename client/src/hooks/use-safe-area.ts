import { useEffect } from 'react';

/**
 * Lightweight safe-area hook for legacy Safari fallback only
 * Modern browsers use CSS env(safe-area-inset-*) natively
 * This hook only runs AFTER first paint, preventing any blocking or layout freeze
 */
export function useSafeArea() {
  useEffect(() => {
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
      const root = document.documentElement;
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
