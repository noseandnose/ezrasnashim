/**
 * Startup Performance Manager
 * Optimizes app loading by deferring non-critical operations
 */

// Priority levels for loading operations
export enum LoadPriority {
  CRITICAL = 0,    // Must load immediately (e.g., initial UI)
  HIGH = 1,        // Load soon after critical (e.g., visible content)
  MEDIUM = 2,      // Load after high priority (e.g., below fold)
  LOW = 3,         // Load when idle (e.g., prefetch)
}

// Track what has been loaded
const loadedResources = new Set<string>();
const pendingLoads = new Map<string, Promise<any>>();

// Defer execution until browser is idle
export function whenIdle(callback: () => void, timeout = 1000): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 50);
  }
}

// Defer execution with priority
export function deferredLoad<T>(
  key: string,
  loader: () => Promise<T>,
  priority: LoadPriority = LoadPriority.MEDIUM
): Promise<T> {
  // If already loaded, return immediately
  if (loadedResources.has(key)) {
    return Promise.resolve(null as any);
  }

  // If already loading, return existing promise
  if (pendingLoads.has(key)) {
    return pendingLoads.get(key)!;
  }

  // Create deferred promise based on priority
  const promise = new Promise<T>((resolve, reject) => {
    const executeLoad = async () => {
      try {
        const result = await loader();
        loadedResources.add(key);
        pendingLoads.delete(key);
        resolve(result);
      } catch (error) {
        pendingLoads.delete(key);
        reject(error);
      }
    };

    switch (priority) {
      case LoadPriority.CRITICAL:
        // Execute immediately
        executeLoad();
        break;
      case LoadPriority.HIGH:
        // Execute after minimal delay
        setTimeout(executeLoad, 10);
        break;
      case LoadPriority.MEDIUM:
        // Execute when idle or after 100ms
        whenIdle(executeLoad, 100);
        break;
      case LoadPriority.LOW:
        // Execute when truly idle or after 2 seconds
        whenIdle(executeLoad, 2000);
        break;
    }
  });

  pendingLoads.set(key, promise);
  return promise;
}

// Deduplicate API requests
const requestCache = new Map<string, Promise<any>>();

export function deduplicatedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const cacheKey = `${url}${JSON.stringify(options || {})}`;
  
  // Return existing request if pending
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey)!;
  }

  // Create new request
  const promise = fetch(url, options)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Remove from cache after success
      setTimeout(() => requestCache.delete(cacheKey), 100);
      return data;
    })
    .catch(error => {
      // Remove from cache on error
      requestCache.delete(cacheKey);
      throw error;
    });

  requestCache.set(cacheKey, promise);
  return promise;
}

// Progressive image loading
export function lazyLoadImage(src: string): void {
  if ('IntersectionObserver' in window) {
    // Will be handled by LazyImage component
    return;
  }
  
  // Fallback: load after delay
  whenIdle(() => {
    const img = new Image();
    img.src = src;
  }, 3000);
}

// Batch API calls for efficiency
export async function batchAPICall<T>(
  calls: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(calls.map(call => call()));
}

// Check if we should defer based on device/connection
export function shouldDefer(): boolean {
  // Check connection speed
  const connection = (navigator as any).connection;
  if (connection) {
    // Defer more aggressively on slow connections
    if (connection.effectiveType === '2g' || connection.saveData) {
      return true;
    }
  }

  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    return true;
  }

  return false;
}

// Initialize performance optimizations
export function initializePerformance(): void {
  // Warm up connection to API server
  if (import.meta.env.VITE_API_URL) {
    whenIdle(() => {
      // DNS prefetch and preconnect
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = import.meta.env.VITE_API_URL;
      document.head.appendChild(link);
    }, 500);
  }

  // Clear old caches periodically
  whenIdle(() => {
    const now = Date.now();
    const cacheKeys = Object.keys(localStorage);
    cacheKeys.forEach(key => {
      if (key.endsWith('-time')) {
        const timestamp = parseInt(localStorage.getItem(key) || '0');
        // Clear caches older than 7 days
        if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
          const dataKey = key.replace('-time', '');
          localStorage.removeItem(key);
          localStorage.removeItem(dataKey);
        }
      }
    });
  }, 5000);
}