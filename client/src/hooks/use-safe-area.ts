import { useLayoutEffect } from 'react';

/**
 * Hook to manage safe-area CSS variables for proper header/footer positioning
 * Uses useLayoutEffect to resolve safe-area-top BEFORE first paint, eliminating iOS PWA jump
 */
export function useSafeArea() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    
    const updateSafeAreaVars = () => {
      // Detect if app is in standalone/PWA mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      // Get safe-area-top from visualViewport (available immediately on iOS PWA)
      const visualViewportTop = window.visualViewport?.offsetTop ?? 0;
      
      // Parse current CSS env value if available
      const computedStyle = getComputedStyle(root);
      const currentSafeAreaTop = computedStyle.getPropertyValue('--safe-area-top').trim();
      const parsedEnvValue = currentSafeAreaTop ? parseFloat(currentSafeAreaTop) : 0;
      
      // Use max of all measurements, with iOS standalone fallback
      let resolvedSafeAreaTop = Math.max(visualViewportTop, parsedEnvValue);
      
      // iOS PWA fallback: if all measurements are near zero but we're on iOS standalone, assume notch
      if (isIOS && isStandalone && resolvedSafeAreaTop < 5) {
        resolvedSafeAreaTop = 44; // Standard iPhone notch height
      }
      
      // Set the resolved value BEFORE browser paints
      root.style.setProperty('--safe-area-top-resolved', `${resolvedSafeAreaTop}px`);
      
      // Dynamically measure where the header actually ends (including all padding and safe area)
      const headerElement = document.querySelector('header');
      const headerComputedStyle = headerElement ? getComputedStyle(headerElement) : null;
      
      // Read the actual computed padding-top which includes our resolved safe-area
      const headerPaddingTopPx = headerComputedStyle ? parseFloat(headerComputedStyle.paddingTop) : 10;
      const headerPaddingBottomPx = headerComputedStyle ? parseFloat(headerComputedStyle.paddingBottom) : 10;
      
      // Get header content height (icons, text, etc - without padding)
      const headerRect = headerElement?.getBoundingClientRect();
      const headerContentHeight = headerRect ? headerRect.height - headerPaddingTopPx - headerPaddingBottomPx : 50;
      
      // Total header height including all padding (this is what content needs to clear)
      const totalHeaderHeight = headerPaddingTopPx + headerContentHeight + headerPaddingBottomPx;
      const contentStartPosition = totalHeaderHeight;
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
    };
    
    // Initial update
    requestAnimationFrame(updateSafeAreaVars);
    
    // Set up ResizeObserver to track header size changes (for async safe-area resolution on iOS PWA)
    const headerElement = document.querySelector('header');
    let resizeObserver: ResizeObserver | null = null;
    
    if (headerElement) {
      resizeObserver = new ResizeObserver(() => {
        updateSafeAreaVars();
      });
      resizeObserver.observe(headerElement);
    }
    
    // Listen for viewport changes as fallback
    window.addEventListener('resize', updateSafeAreaVars);
    window.addEventListener('orientationchange', updateSafeAreaVars);
    
    // Listen for visual viewport changes (iOS PWA safe-area updates)
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
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);
}
