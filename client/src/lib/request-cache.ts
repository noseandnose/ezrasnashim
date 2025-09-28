/**
 * Request caching and deduplication utilities
 * Prevents duplicate API calls during startup
 */

// In-memory cache for API responses
const responseCache = new Map<string, { data: any; timestamp: number }>();

// Pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

// Cache TTL in milliseconds
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache configuration per endpoint pattern
const cacheConfig: Record<string, number> = {
  '/api/sponsors/daily': 60 * 60 * 1000, // 1 hour for sponsors
  '/api/hebrew-date': 24 * 60 * 60 * 1000, // 24 hours for hebrew date
  '/api/tehillim/info': 24 * 60 * 60 * 1000, // 24 hours for tehillim info
  '/api/torah/halacha': 60 * 60 * 1000, // 1 hour for halacha
  '/api/messages': 60 * 60 * 1000, // 1 hour for messages
  '/api/campaigns': 30 * 60 * 1000, // 30 minutes for campaigns
  '/api/table': 60 * 60 * 1000, // 1 hour for table data
};

// Get cache TTL for an endpoint
function getCacheTTL(endpoint: string): number {
  for (const [pattern, ttl] of Object.entries(cacheConfig)) {
    if (endpoint.startsWith(pattern)) {
      return ttl;
    }
  }
  return DEFAULT_CACHE_TTL;
}

// Check if cached data is still valid
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

// Deduplicated fetch with caching
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Only cache GET requests
  if (options?.method && options.method !== 'GET') {
    return fetch(url, options).then(res => res.json());
  }

  const cacheKey = url;
  
  // Check if we have valid cached data
  const cached = responseCache.get(cacheKey);
  if (cached) {
    const ttl = getCacheTTL(url);
    if (isCacheValid(cached.timestamp, ttl)) {
      return Promise.resolve(cached.data);
    }
    // Remove stale cache
    responseCache.delete(cacheKey);
  }

  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // Create new request
  const requestPromise = fetch(url, options)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      // Cache the response
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      
      // Remove from pending
      pendingRequests.delete(cacheKey);
      
      return data;
    })
    .catch((error) => {
      // Remove from pending on error
      pendingRequests.delete(cacheKey);
      throw error;
    });

  // Store as pending
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
}

// Clear cache for specific pattern or all
export function clearCache(pattern?: string): void {
  if (pattern) {
    const keysToDelete: string[] = [];
    responseCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => responseCache.delete(key));
  } else {
    responseCache.clear();
  }
}

// Preload critical endpoints
export async function preloadCritical(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const criticalEndpoints = [
    `/api/sponsors/daily/${today}`,
    `/api/hebrew-date/${today}`,
    `/api/campaigns/active`,
  ];

  // Load in parallel but don't wait
  Promise.all(
    criticalEndpoints.map(endpoint =>
      cachedFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`)
        .catch(() => {}) // Ignore preload errors
    )
  );
}