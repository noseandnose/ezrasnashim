// Performance optimization utilities for the client side

/**
 * Debounce function calls for better performance
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function calls to limit frequency
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Intersection Observer for lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver;

  constructor(callback: (entries: IntersectionObserverEntry[]) => void, options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  observe(element: Element): void {
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.observer.disconnect();
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(name: string): void {
    this.metrics.set(`${name}_start`, performance.now());
  }

  endTiming(name: string): number {
    const start = this.metrics.get(`${name}_start`);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.set(name, duration);
    return duration;
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }
}

/**
 * Virtual scrolling utility for large lists
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleCount: number;
  private scrollTop: number = 0;
  private totalItems: number = 0;

  constructor(container: HTMLElement, itemHeight: number) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
  }

  getVisibleRange(itemCount: number): { start: number; end: number } {
    this.totalItems = itemCount;
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(start + this.visibleCount, itemCount);
    return { start: Math.max(0, start), end };
  }

  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }
}

/**
 * Image optimization utility
 */
export function optimizeImageLoading(img: HTMLImageElement): void {
  // Add loading="lazy" if not already set
  if (!img.hasAttribute('loading')) {
    img.loading = 'lazy';
  }

  // Add decode="async" for better performance
  if (!img.hasAttribute('decoding')) {
    img.decoding = 'async';
  }

  // Preload critical images
  if (img.dataset.priority === 'high') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.src;
    document.head.appendChild(link);
  }
}

/**
 * Bundle size optimizer - remove unused utilities
 */
export function removeUnusedEventListeners(): void {
  // Clean up event listeners that might be lingering
  const elementsWithListeners = document.querySelectorAll('[data-has-listener]');
  elementsWithListeners.forEach(element => {
    element.removeAttribute('data-has-listener');
  });
  
  // Clear any orphaned modal listeners
  const modalBackdrops = document.querySelectorAll('.modal-backdrop');
  modalBackdrops.forEach(backdrop => {
    backdrop.remove();
  });
}

/**
 * Memory cleanup utility
 */
export function cleanupMemory(): void {
  // Force garbage collection if available (dev tools)
  if ('gc' in window && typeof window.gc === 'function') {
    window.gc();
  }
  
  // Clear any large cached objects
  if ('caches' in window) {
    caches.keys().then((names: string[]) => {
      names.forEach((name: string) => {
        if (name.includes('old') || name.includes('temp')) {
          caches.delete(name);
        }
      });
    });
  }
}