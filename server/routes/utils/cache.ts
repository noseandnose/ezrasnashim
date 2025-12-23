import serverAxiosClient from "../../axiosClient";

interface CacheEntry {
  data: any;
  expires: number;
  pendingPromise?: Promise<any>;
}

const apiCache = new Map<string, CacheEntry>();

const CACHE_TTLS = {
  hebcalZmanim: 15 * 60 * 1000,
  hebcalConverter: 24 * 60 * 60 * 1000,
  hebcalEvents: 60 * 60 * 1000,
  nominatim: 24 * 60 * 60 * 1000,
  sefaria: 7 * 24 * 60 * 60 * 1000,
  ipGeo: 60 * 60 * 1000,
  default: 5 * 60 * 1000
};

function getCacheConfig(url: string): { key: string; ttl: number } {
  const key = url;
  let ttl = CACHE_TTLS.default;

  if (url.includes('hebcal.com/zmanim')) ttl = CACHE_TTLS.hebcalZmanim;
  else if (url.includes('hebcal.com/converter')) ttl = CACHE_TTLS.hebcalConverter;
  else if (url.includes('hebcal.com/')) ttl = CACHE_TTLS.hebcalEvents;
  else if (url.includes('nominatim.openstreetmap.org')) ttl = CACHE_TTLS.nominatim;
  else if (url.includes('sefaria.org')) ttl = CACHE_TTLS.sefaria;
  else if (url.includes('ip-api.com')) ttl = CACHE_TTLS.ipGeo;

  return { key, ttl };
}

export async function cachedGet(url: string, config: any = {}): Promise<any> {
  const { key, ttl } = getCacheConfig(url);
  const now = Date.now();

  const cached = apiCache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  if (cached && cached.pendingPromise) {
    return cached.pendingPromise;
  }

  const promise = serverAxiosClient.get(url, config).then(response => {
    apiCache.set(key, {
      data: response.data,
      expires: now + ttl
    });
    return response.data;
  }).catch(error => {
    const entry = apiCache.get(key);
    if (entry) {
      delete entry.pendingPromise;
    }
    throw error;
  });

  if (cached) {
    cached.pendingPromise = promise;
  } else {
    apiCache.set(key, {
      data: null,
      expires: 0,
      pendingPromise: promise
    });
  }

  return promise;
}

export { apiCache, CACHE_TTLS };
