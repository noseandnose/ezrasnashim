import { useEffect } from 'react';

/**
 * Hook to manage safe-area CSS variables for proper header/footer positioning
 * Applies fixed offset for Safari browser mode to account for bottom toolbar
 */
export function useSafeArea() {
  useEffect(() => {
    const updateSafeAreaVars = () => {
      // Use requestAnimationFrame to ensure DOM is ready and CSS env() has resolved
      requestAnimationFrame(() => {
        const root = document.documentElement;
        
        // Detect if app is in standalone/PWA mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone ||
                            document.referrer.includes('android-app://');
        
        
        // Dynamically measure where the header actually ends (including all padding and safe area)
        const headerElement = document.querySelector('header');
        const headerRect = headerElement?.getBoundingClientRect();
        // The content should start where the header ends (bottom of header)
        const contentStartPosition = headerRect ? headerRect.bottom : 60;
        const footerHeight = 70; // Bottom nav height in px
      
        // Detect Safari (exclude iOS Chrome, Edge, Firefox which also have "Safari" in UA)
        const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
        
        // Calculate viewport bottom offset - Safari browser mode only
        // Chrome and Safari standalone mode use bottom: 0
        let viewportBottomOffset = 0;
        if (isSafari && !isStandalone) {
          // Safari browser mode: fixed offset for bottom toolbar
          viewportBottomOffset = 24;
        }
      
        // Only set derived values - don't override CSS env() safe-area values
        root.style.setProperty('--content-start', `${contentStartPosition}px`);
        root.style.setProperty('--footer-height', `${footerHeight}px`);
        root.style.setProperty('--viewport-bottom-offset', `${viewportBottomOffset}px`);
        root.style.setProperty('--is-standalone', isStandalone ? '1' : '0');
        
        // Calculate total safe bottom (for footer)
        root.style.setProperty('--safe-bottom-total', `calc(env(safe-area-inset-bottom, 0px) + ${footerHeight}px + ${viewportBottomOffset}px)`);
      });
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
