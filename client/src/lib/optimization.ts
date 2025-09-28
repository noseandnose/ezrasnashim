// Performance optimizations for production builds

/**
 * Lazy load components to reduce initial bundle size
 */
export const lazyLoad = <T extends Record<string, any>>(
  componentImport: () => Promise<T>
) => {
  return componentImport;
};

/**
 * Remove unused CSS classes and styles
 */
export function cleanupUnusedStyles(): void {
  // Disabled for now - may be removing needed styles
  return;
  
  const stylesheets = Array.from(document.styleSheets);
  
  stylesheets.forEach(stylesheet => {
    try {
      const rules = Array.from(stylesheet.cssRules || []);
      rules.forEach(rule => {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          // Remove styles for components we don't use
          if (selector.includes('.unused-') || 
              selector.includes('.deprecated-') ||
              selector.includes('.old-')) {
            stylesheet.deleteRule(rules.indexOf(rule));
          }
        }
      });
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  });
}

/**
 * Optimize image loading with intersection observer
 */
export function optimizeImages(): void {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    // Cache storage failed
  }
}

/**
 * Preload critical resources
 */
export async function preloadCriticalResources(): Promise<void> {
  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);
  
  // Preload critical API endpoints
  // Check for Replit environment - use relative URLs to avoid CORS
  const isReplit = window.location.hostname.includes('replit.dev') || 
                    window.location.hostname.includes('replit.app') || 
                    window.location.hostname.includes('repl.co');
  
  // Use relative URLs on Replit to avoid CORS issues
  const baseUrl = isReplit ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
  const { getLocalDateString } = await import('./dateUtils');
  const today = getLocalDateString();
  
  const criticalEndpoints = [
    `${baseUrl}/api/torah/halacha/${today}`,
    `${baseUrl}/api/tehillim/progress`,
    `${baseUrl}/api/sponsors/daily/${today}`
  ];
  
  criticalEndpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });
}

/**
 * Initialize all optimizations
 */
export function initializeOptimizations(): void {
  // Run after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImages();
      preloadCriticalResources();
    });
  } else {
    optimizeImages();
    preloadCriticalResources();
  }
  
  // Cleanup disabled for now - may be causing issues
  // window.addEventListener('load', () => {
  //   setTimeout(() => {
  //     cleanupUnusedStyles();
  //   }, 1000);
  // });
}