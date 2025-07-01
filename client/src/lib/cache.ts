// Advanced caching utilities for performance optimization

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Specialized caches for different content types
export const tehillimCache = new MemoryCache<{ text: string; perek: number; language: string }>(50);
export const pirkeiAvotCache = new MemoryCache<{ text: string; chapter: number; source: string }>(20);
export const torahContentCache = new MemoryCache<any>(30);
export const zmanimCache = new MemoryCache<any>(10);

// Cache key generators
export const getCacheKey = {
  tehillim: (perek: number, language: string) => `tehillim_${perek}_${language}`,
  pirkeiAvot: (date: string) => `pirkei_avot_${date}`,
  torah: (type: string, date: string) => `torah_${type}_${date}`,
  zmanim: (lat: number, lng: number, date: string) => `zmanim_${lat}_${lng}_${date}`,
  sponsors: (date: string) => `sponsors_${date}`,
  campaigns: () => 'campaigns_active'
};

// Preload critical data
export async function preloadCriticalData(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Preload today's Pirkei Avot if not cached
    const pirkeiAvotKey = getCacheKey.pirkeiAvot(today);
    if (!pirkeiAvotCache.has(pirkeiAvotKey)) {
      const response = await fetch(`/api/torah/pirkei-avot/${today}`);
      if (response.ok) {
        const data = await response.json();
        pirkeiAvotCache.set(pirkeiAvotKey, data, 24 * 60 * 60 * 1000); // 24 hours
      }
    }

    // Preload current Tehillim if not cached
    const progressResponse = await fetch('/api/tehillim/progress');
    if (progressResponse.ok) {
      const progress = await progressResponse.json();
      const tehillimKey = getCacheKey.tehillim(progress.currentPerek, 'hebrew');
      if (!tehillimCache.has(tehillimKey)) {
        const textResponse = await fetch(`/api/tehillim/text/${progress.currentPerek}`);
        if (textResponse.ok) {
          const textData = await textResponse.json();
          tehillimCache.set(tehillimKey, textData, 60 * 60 * 1000); // 1 hour
        }
      }
    }
  } catch (error) {
    console.log('Preload failed:', error);
  }
}

// Cleanup expired cache entries
export function cleanupCache(): void {
  [tehillimCache, pirkeiAvotCache, torahContentCache, zmanimCache].forEach(cache => {
    // Force check all entries to remove expired ones
    const keys = Array.from((cache as any).cache.keys());
    keys.forEach(key => cache.get(key)); // This will remove expired entries
  });
}

// Cache-aware fetch utility
export async function cachedFetch<T>(
  url: string,
  cacheInstance: MemoryCache<T>,
  cacheKey: string,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cacheInstance.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  cacheInstance.set(cacheKey, data, ttl);
  return data;
}

// Initialize cache system
let cacheInitialized = false;
export function initializeCache(): void {
  if (cacheInitialized) return;
  
  // Preload critical data
  preloadCriticalData();
  
  // Set up periodic cleanup
  setInterval(cleanupCache, 10 * 60 * 1000); // Every 10 minutes
  
  cacheInitialized = true;
}