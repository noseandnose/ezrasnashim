import { useEffect } from 'react';

/**
 * Hook to manage safe-area CSS variables for proper header/footer positioning
 * Uses VisualViewport API for dynamic browser UI tracking (Safari toolbar, keyboard, etc.)
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
      
      // Calculate viewport bottom offset using VisualViewport API
      // This automatically accounts for Safari's dynamic toolbar, keyboard, etc.
      let viewportBottomOffset = 0;
      if (window.visualViewport) {
        const vp = window.visualViewport;
        // Calculate how much of the window is obscured by browser UI
        viewportBottomOffset = Math.max(0, window.innerHeight - vp.height - vp.offsetTop);
      }
      
      // For debugging: log the actual values
      if (import.meta.env.DEV) {
        console.log('Safe area detection:', { 
          safeAreaTop, 
          safeAreaBottom, 
          isStandalone,
          viewportBottomOffset,
          visualViewportHeight: window.visualViewport?.height,
          windowInnerHeight: window.innerHeight
        });
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
    
    // Listen for viewport changes (Safari toolbar, keyboard, rotation, etc.)
    window.addEventListener('resize', updateSafeAreaVars);
    window.addEventListener('orientationchange', updateSafeAreaVars);
    
    // VisualViewport API - tracks browser UI changes in real-time
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSafeAreaVars);
      window.visualViewport.addEventListener('scroll', updateSafeAreaVars);
    }
    
    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', updateSafeAreaVars);
    }
    
    return () => {
      window.removeEventListener('resize', updateSafeAreaVars);
      window.removeEventListener('orientationchange', updateSafeAreaVars);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateSafeAreaVars);
        window.visualViewport.removeEventListener('scroll', updateSafeAreaVars);
      }
      
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', updateSafeAreaVars);
      }
    };
  }, []);
}
