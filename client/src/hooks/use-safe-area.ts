import { useEffect } from 'react';

/**
 * Hook to manage safe-area CSS variables for proper header/footer positioning
 * across browser and standalone/PWA modes
 */
export function useSafeArea() {
  useEffect(() => {
    const updateSafeAreaVars = () => {
      const root = document.documentElement;
      
      // Detect if app is in standalone/PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      // Detect Safari (exclude iOS Chrome, Edge, Firefox which also have "Safari" in UA)
      const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
      
      // Get safe-area insets from CSS env()
      const style = getComputedStyle(root);
      const safeAreaTop = style.getPropertyValue('--sat') || '0px';
      const safeAreaBottom = style.getPropertyValue('--sab') || '0px';
      
      // Calculate header and footer heights
      const headerHeight = 60; // Header height in px
      const footerHeight = 70; // Bottom nav height in px
      
      // Calculate bottom nav offset based on mode
      let navOffset = 0;
      if (isSafari && !isStandalone) {
        // Safari browser mode: account for URL bar (45px)
        navOffset = 45;
      } else {
        // Standalone mode or Chrome: no URL bar offset needed
        navOffset = 0;
      }
      
      // Set CSS variables
      root.style.setProperty('--safe-area-top', safeAreaTop);
      root.style.setProperty('--safe-area-bottom', safeAreaBottom);
      root.style.setProperty('--header-height', `${headerHeight}px`);
      root.style.setProperty('--footer-height', `${footerHeight}px`);
      root.style.setProperty('--nav-offset', `${navOffset}px`);
      root.style.setProperty('--is-standalone', isStandalone ? '1' : '0');
      root.style.setProperty('--is-safari', isSafari ? '1' : '0');
      
      // Calculate total safe areas including UI elements
      root.style.setProperty('--safe-top-total', `calc(${safeAreaTop} + ${headerHeight}px)`);
      root.style.setProperty('--safe-bottom-total', `calc(${safeAreaBottom} + ${footerHeight}px + ${navOffset}px)`);
    };
    
    // Initial update
    updateSafeAreaVars();
    
    // Listen for viewport changes
    window.addEventListener('resize', updateSafeAreaVars);
    window.addEventListener('orientationchange', updateSafeAreaVars);
    
    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', updateSafeAreaVars);
    }
    
    return () => {
      window.removeEventListener('resize', updateSafeAreaVars);
      window.removeEventListener('orientationchange', updateSafeAreaVars);
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', updateSafeAreaVars);
      }
    };
  }, []);
}
