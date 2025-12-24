import { Request, Response, NextFunction } from 'express';
import { cache } from '../cache/categoryCache';

export interface CacheMiddlewareOptions {
  ttl: number; // Time to live in seconds
  category: string; // Cache category for invalidation
  keyGenerator?: (req: Request) => string; // Custom cache key generator
}

export function cacheMiddleware(options: CacheMiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const cacheKey = options.keyGenerator 
      ? `${options.category}:${options.keyGenerator(req)}`
      : `${options.category}:${req.originalUrl}`;

    const cachedData = cache.get(cacheKey);
    
    if (cachedData !== null) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', `public, max-age=${options.ttl}, stale-while-revalidate=${Math.floor(options.ttl / 2)}`);
      res.json(cachedData);
      return;
    }

    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('Cache-Control', `public, max-age=${options.ttl}, stale-while-revalidate=${Math.floor(options.ttl / 2)}`);
        cache.set(cacheKey, data, { ttl: options.ttl });
      } else {
        res.setHeader('Cache-Control', 'no-store');
      }
      return originalJson(data);
    };

    next();
  };
}
