/**
 * Performance optimization utilities and configurations
 */

// Debounce utility for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
}

// Optimized intersection observer for lazy loading
export const createOptimizedObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Performance monitoring utilities
export const measurePerformance = (name: string, fn: () => void) => {
  if (import.meta.env.MODE === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`Performance: ${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

// Memory cleanup utilities
export const cleanupEventListeners = (element: Element) => {
  // Clone and replace element to remove all event listeners
  const newElement = element.cloneNode(true);
  element.parentNode?.replaceChild(newElement, element);
  return newElement;
};

// Optimized text processing with memoization
const textProcessingCache = new Map<string, string>();

export const memoizedTextProcessor = (text: string, processor: (text: string) => string): string => {
  const cacheKey = `${text}_${processor.toString()}`;
  if (textProcessingCache.has(cacheKey)) {
    return textProcessingCache.get(cacheKey)!;
  }
  
  const result = processor(text);
  textProcessingCache.set(cacheKey, result);
  
  // Cleanup old entries to prevent memory leaks
  if (textProcessingCache.size > 100) {
    const entries = Array.from(textProcessingCache.entries());
    entries.slice(0, 50).forEach(([key]) => textProcessingCache.delete(key));
  }
  
  return result;
};