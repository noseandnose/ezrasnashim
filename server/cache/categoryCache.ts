interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl: number; // Time to live in seconds
}

class CategoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Convert to seconds

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, options: CacheOptions): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
    });
  }

  clear(key: string): void {
    this.cache.delete(key);
  }

  clearCategory(category: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(`${category}:`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearAll(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new CategoryCache();

export const CACHE_TTL = {
  DAILY_TORAH: 24 * 60 * 60,      // 24 hours
  STATIC_PRAYERS: 7 * 24 * 60 * 60, // 7 days
  PIRKEI_AVOT: 7 * 24 * 60 * 60,    // 7 days
  TEHILLIM: 30 * 24 * 60 * 60,      // 30 days
  TODAYS_SPECIAL: 5 * 60,          // 5 minutes - content that may be edited frequently
} as const;
