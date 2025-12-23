import Stripe from "stripe";
import * as webpush from "web-push";
import serverAxiosClient from "../axiosClient";
import { validateAdminLogin, verifyAdminToken, isJwtConfigured, isAdminConfigured } from "../auth";

interface CacheEntry {
  data: any;
  expires: number;
  pendingPromise?: Promise<any>;
}

const apiCache = new Map<string, CacheEntry>();

export const CACHE_TTLS = {
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

export function requireAdminAuth(req: any, res: any, next: any) {
  if (!isAdminConfigured()) {
    return res.status(500).json({ 
      message: "Admin authentication not configured" 
    });
  }
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!token) {
    return res.status(401).json({ 
      message: "Unauthorized: No credentials provided" 
    });
  }
  
  if (!isJwtConfigured()) {
    return res.status(500).json({ 
      message: "JWT authentication not configured. Please set JWT_SECRET." 
    });
  }
  
  const jwtResult = verifyAdminToken(token);
  if (jwtResult.valid) {
    return next();
  }
  if (jwtResult.expired) {
    return res.status(401).json({ 
      message: "Unauthorized: Token expired, please login again" 
    });
  }
  
  return res.status(401).json({ 
    message: "Unauthorized: Invalid admin credentials" 
  });
}

let stripe: Stripe | null = null;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured - donation endpoints will be unavailable');
} else {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil' as any,
  });
  console.log('✅ Stripe configured successfully');
}

export { stripe };

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
export const VAPID_EMAIL = process.env.VAPID_EMAIL;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export { webpush };
export { validateAdminLogin };
