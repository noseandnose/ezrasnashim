// Centralized query configuration for optimization
export const QUERY_CONFIG = {
  // Stale times (in milliseconds)
  STALE_TIME: {
    SHORT: 5 * 60 * 1000,        // 5 minutes
    MEDIUM: 30 * 60 * 1000,      // 30 minutes
    LONG: 60 * 60 * 1000,        // 1 hour
    VERY_LONG: 6 * 60 * 60 * 1000, // 6 hours
    DAY: 24 * 60 * 60 * 1000,    // 24 hours
  },
  
  // Cache times (gc = garbage collection)
  GC_TIME: {
    SHORT: 30 * 60 * 1000,       // 30 minutes
    MEDIUM: 60 * 60 * 1000,      // 1 hour
    LONG: 4 * 60 * 60 * 1000,    // 4 hours
    VERY_LONG: 12 * 60 * 60 * 1000, // 12 hours
    DAY: 24 * 60 * 60 * 1000,    // 24 hours
  },
  
  // Retry configuration
  RETRY: {
    count: 3,
    delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  // Refetch intervals
  REFETCH_INTERVAL: {
    FREQUENT: 5 * 60 * 1000,     // 5 minutes
    MODERATE: 30 * 60 * 1000,    // 30 minutes
    RARE: 6 * 60 * 60 * 1000,    // 6 hours
  }
};

// Query key factory for consistent key generation
export const queryKeys = {
  // Torah content
  torah: {
    all: ['torah'] as const,
    halacha: (date: string) => ['/api/torah/halacha', date] as const,
    chizuk: (date: string) => ['/api/torah/chizuk', date] as const,
    emuna: (date: string) => ['/api/torah/emuna', date] as const,
    featured: (date: string) => ['/api/torah/featured', date] as const,
    pirkeiAvot: (date: string) => ['/api/torah/pirkei-avot', date] as const,
  },
  
  // Tefilla content
  tefilla: {
    all: ['tefilla'] as const,
    morning: () => ['/api/morning/prayers'] as const,
    mincha: () => ['/api/mincha/prayers'] as const,
    birkatHamazon: () => ['/api/birkat-hamazon/prayers'] as const,
    afterBrochas: () => ['/api/after-brochas/prayers'] as const,
    womens: () => ['/api/womens/prayers'] as const,
  },
  
  // Tehillim
  tehillim: {
    all: ['tehillim'] as const,
    progress: () => ['/api/tehillim/progress'] as const,
    text: (perek: number) => ['/api/tehillim/text', perek] as const,
    preview: (perek: number) => ['/api/tehillim/preview', perek] as const,
    names: () => ['/api/tehillim/names'] as const,
    currentName: () => ['/api/tehillim/current-name'] as const,
  },
  
  // Time-based
  times: {
    jewish: (lat?: number, lng?: number, date?: string) => 
      ['zmanim', lat, lng, date] as const,
    shabbos: (lat?: number, lng?: number) => 
      ['shabbos-times', lat, lng] as const,
    hebrew: (date: string) => 
      ['hebrew-date', date] as const,
  },
  
  // Other
  sponsors: {
    daily: (date: string) => ['/api/sponsors/daily', date] as const,
  },
  campaigns: {
    active: () => ['/api/campaigns/active'] as const,
  },
  table: {
    vort: () => ['/api/table/vort'] as const,
  },
};