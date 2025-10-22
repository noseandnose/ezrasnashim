import { useEffect } from 'react';

/**
 * Hook to manage safe-area CSS variables for proper header/footer positioning
 * Applies fixed offset for Safari browser mode to account for bottom toolbar
 */
export function useSafeArea() {
  useEffect(() => {
    const updateSafeAreaVars = () => {
      const root = document.documentElement;
      
      // Detect if app is in standalone/PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      // Get safe-area insets from CSS env() - read the computed values
      const style = getComputedStyle(root);
      const safeAreaTop = style.getPropertyValue('--sat').trim() || '0px';
      const safeAreaBottom = style.getPropertyValue('--sab').trim() || '0px';
      
      // Calculate header and footer heights
      const headerHeight = 48; // Base header height in px
      const footerHeight = 70; // Bottom nav height in px
      
      // Detect Safari (exclude iOS Chrome, Edge, Firefox which also have "Safari" in UA)
      const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
      
      // Calculate viewport bottom offset - Safari browser mode only
      // Chrome and Safari standalone mode use bottom: 0
      let viewportBottomOffset = 0;
      if (isSafari && !isStandalone) {
        // Safari browser mode: fixed offset for bottom toolbar
        const safeBottomValue = parseInt(safeAreaBottom, 10) || 0;
        viewportBottomOffset = Math.max(safeBottomValue, 24);
      }
      
      // Set CSS variables
      root.style.setProperty('--safe-area-top', safeAreaTop);
      root.style.setProperty('--safe-area-bottom', safeAreaBottom);
      root.style.setProperty('--header-height', `${headerHeight}px`);
      root.style.setProperty('--footer-height', `${footerHeight}px`);
      root.style.setProperty('--viewport-bottom-offset', `${viewportBottomOffset}px`);
      root.style.setProperty('--is-standalone', isStandalone ? '1' : '0');
      
      // Calculate total safe areas including UI elements and viewport offset
      root.style.setProperty('--safe-top-total', `calc(${safeAreaTop} + ${headerHeight}px)`);
      root.style.setProperty('--safe-bottom-total', `calc(${safeAreaBottom} + ${footerHeight}px + ${viewportBottomOffset}px)`);
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
