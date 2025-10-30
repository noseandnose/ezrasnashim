// Minimal performance optimizations - keep it simple!

/**
 * Initialize optimizations (minimal for performance)
 */
export function initializeOptimizations(): void {
  // Lazy load images if any are marked with data-src
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll('img[data-src]');
    if (images.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });
      
      images.forEach(img => observer.observe(img));
    }
  }
}