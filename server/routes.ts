import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import serverAxiosClient from "./axiosClient";
import path from "path";
import { fileURLToPath } from "url";
import { find as findTimezone } from "geo-tz";
import webpush from "web-push";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { pushRetryQueue } from "./pushRetryQueue";
import { cacheMiddleware } from "./middleware/cache";
import { CACHE_TTL, cache } from "./cache/categoryCache";
import { validateAdminLogin, verifyAdminToken, isJwtConfigured, isAdminConfigured } from "./auth";
import { registerUtilityRoutes } from "./routes/utility";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerPushRoutes } from "./routes/push";
import { registerLocationRoutes } from "./routes/location";
import { registerTehillimRoutes } from "./routes/tehillim";
import { registerPrayerRoutes } from "./routes/prayers";
import { registerContentRoutes } from "./routes/content";
// Supabase Auth - replaces Replit Auth
import { optionalAuth } from "./supabase-auth";

// Server-side cache with TTL and request coalescing to prevent API rate limiting
interface CacheEntry {
  data: any;
  expires: number;
  pendingPromise?: Promise<any>;
}

const apiCache = new Map<string, CacheEntry>();

// Cache TTL configurations (in milliseconds)
const CACHE_TTLS = {
  hebcalZmanim: 15 * 60 * 1000,      // 15 minutes - times change throughout day
  hebcalConverter: 24 * 60 * 60 * 1000, // 24 hours - date conversions are static
  hebcalEvents: 60 * 60 * 1000,      // 1 hour - events don't change frequently  
  nominatim: 24 * 60 * 60 * 1000,    // 24 hours - reverse geocoding is static
  sefaria: 7 * 24 * 60 * 60 * 1000,  // 7 days - text content rarely changes
  ipGeo: 60 * 60 * 1000,             // 1 hour - IP geolocation
  default: 5 * 60 * 1000             // 5 minutes - default for other APIs
};

// Get cache key from URL and determine TTL
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

// Cached HTTP GET with request coalescing
async function cachedGet(url: string, config: any = {}): Promise<any> {
  const { key, ttl } = getCacheConfig(url);
  const now = Date.now();

  // Check if we have valid cached data
  const cached = apiCache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  // Check if there's already a pending request for this key (request coalescing)
  if (cached && cached.pendingPromise) {
    return cached.pendingPromise;
  }

  // Make the request and cache it
  const promise = serverAxiosClient.get(url, config).then(response => {
    // Cache the response data
    apiCache.set(key, {
      data: response.data,
      expires: now + ttl
    });
    return response.data;
  }).catch(error => {
    // Remove the pending promise on error to allow retry
    const entry = apiCache.get(key);
    if (entry) {
      delete entry.pendingPromise;
    }
    throw error;
  });

  // Store the pending promise for coalescing
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

const __filename = fileURLToPath(import.meta.url);
void path.dirname(__filename);

let stripe: Stripe | null = null;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured - donation endpoints will be unavailable');
} else {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil' as any,
  });
  console.log('✅ Stripe configured successfully');
}

// Store VAPID keys at startup
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL;

// Configure web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
  // Use a proper mailto: URL for VAPID subject to ensure proper branding
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  // Push notifications configured with VAPID keys
} else {
  // Push notifications not configured - missing VAPID keys
}
import { 
  insertDailyRecipeSchema,
  baseParshaVortSchema,
  insertParshaVortSchema,
  insertTorahClassSchema,
  insertLifeClassSchema,
  insertGemsOfGratitudeSchema,
  insertNishmasTextSchema,
  insertMessagesSchema
} from "../shared/schema";

// Admin authentication middleware - JWT only (legacy password fallback removed)
function requireAdminAuth(req: any, res: any, next: any) {
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
  
  // JWT verification required
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Supabase Auth is handled client-side - no server setup needed
  // This endpoint returns the current user (if authenticated) or null
  // It uses optionalAuth to gracefully handle when auth is not configured
  app.get("/api/auth/user", optionalAuth, (req, res) => {
    // Return the user if authenticated, or null if not
    res.json(req.supabaseUser || null);
  });

  // Schedule periodic cleanup of expired names (every hour)
  setInterval(async () => {
    try {
      await storage.cleanupExpiredNames();
      // Cleaned up expired Tehillim names
    } catch (error) {
      // Error cleaning up expired names
    }
  }, 60 * 60 * 1000); // Run every hour

  // Register utility routes (healthcheck, version, root handler)
  registerUtilityRoutes(app, { requireAdminAuth });

  // Register analytics routes
  registerAnalyticsRoutes(app, { requireAdminAuth, storage });

  // Register push notification routes
  registerPushRoutes(app, { requireAdminAuth, storage, pushRetryQueue, VAPID_PUBLIC_KEY });

  // Register location routes (IP detection, geocoding, Hebrew date)
  registerLocationRoutes(app);

  // Register Tehillim routes
  registerTehillimRoutes(app, { storage });

  // Register prayer routes (Mincha, Maariv, Morning, Brochas)
  registerPrayerRoutes(app, { storage, requireAdminAuth });

  // Register content routes (Torah, Table Inspiration, Marriage Insights, etc.)
  registerContentRoutes(app, { storage, requireAdminAuth });

  // Admin login endpoint - returns JWT token on successful authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Password is required" 
        });
      }
      
      const result = await validateAdminLogin(password);
      
      if (result.success && result.token) {
        return res.json({ 
          success: true, 
          token: result.token,
          expiresIn: '24h'
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: result.error || "Invalid credentials" 
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ 
        success: false, 
        message: "Login failed" 
      });
    }
  });

  // Admin auth status check - verifies if current token is valid
  app.get("/api/admin/auth-status", requireAdminAuth, (_req, res) => {
    return res.json({ authenticated: true });
  });

  // Calendar download endpoint using GET request to avoid CORS issues
  app.get("/api/download-calendar", async (req, res) => {
    try {
      // Parse query parameters
      const title = req.query.title as string || "Event";
      const hebrewDate = req.query.hebrewDate as string || "";
      const gregorianDate = req.query.gregorianDate as string || "";
      const years = parseInt(req.query.years as string) || 1;
      const afterNightfall = req.query.afterNightfall === 'true';
      
      // Calendar download request
      
      // Generate calendar content
      const events: string[] = [];
      const currentYear = new Date().getFullYear();
      
      if (gregorianDate && hebrewDate) {
        // First, convert the input date to Hebrew date using Hebcal API
        const inputDate = new Date(gregorianDate);
        let inputYear = inputDate.getFullYear();
        let inputMonth = inputDate.getMonth() + 1; // JavaScript months are 0-based
        let inputDay = inputDate.getDate();
        
        // If after nightfall, we need to add one day to get the correct Hebrew date
        if (afterNightfall) {
          const adjustedDate = new Date(inputDate);
          adjustedDate.setDate(adjustedDate.getDate() + 1);
          inputYear = adjustedDate.getFullYear();
          inputMonth = adjustedDate.getMonth() + 1;
          inputDay = adjustedDate.getDate();
        }
        
        try {
          // Get the Hebrew date from the input Gregorian date (adjusted if after nightfall)
          const hebcalUrl = `https://www.hebcal.com/converter?cfg=json&gy=${inputYear}&gm=${inputMonth}&gd=${inputDay}&g2h=1`;
          const hebcalResponse = await serverAxiosClient.get(hebcalUrl);
          const hebrewDateInfo = hebcalResponse.data;
          
          if (!hebrewDateInfo || !hebrewDateInfo.hd || !hebrewDateInfo.hm) {
            throw new Error('Failed to get Hebrew date information');
          }
          
          // Now find when this Hebrew date occurs in future years
          const hebrewDay = hebrewDateInfo.hd;
          const hebrewMonth = hebrewDateInfo.hm;
          
          // Determine if the date has already passed this year
          const today = new Date();
          let startYear = currentYear;
          
          // Check if we need to start from next year
          if (inputDate < today) {
            // Find when this Hebrew date occurs this year
            const thisYearUrl = `https://www.hebcal.com/converter?cfg=json&hy=${5785 + (currentYear - 2025)}&hm=${hebrewMonth}&hd=${hebrewDay}&h2g=1`;
            try {
              const thisYearResponse = await serverAxiosClient.get(thisYearUrl);
              const thisYearDate = new Date(thisYearResponse.data.gy, thisYearResponse.data.gm - 1, thisYearResponse.data.gd);
              
              if (thisYearDate < today) {
                startYear = currentYear + 1;
              }
            } catch {
              startYear = currentYear + 1;
            }
          }
          
          // Generate events for the specified number of years
          for (let i = 0; i < years; i++) {
            const targetYear = startYear + i;
            const hebrewYear = 5785 + (targetYear - 2025); // Hebrew year calculation
            
            // Convert Hebrew date back to Gregorian for this year
            const convertUrl = `https://www.hebcal.com/converter?cfg=json&hy=${hebrewYear}&hm=${hebrewMonth}&hd=${hebrewDay}&h2g=1`;
            
            try {
              const convertResponse = await serverAxiosClient.get(convertUrl);
              const gregorianResult = convertResponse.data;
              
              if (gregorianResult && gregorianResult.gy && gregorianResult.gm && gregorianResult.gd) {
                const eventDate = new Date(gregorianResult.gy, gregorianResult.gm - 1, gregorianResult.gd);
                const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
                
                events.push([
                  'BEGIN:VEVENT',
                  `UID:hebrew-${dateStr}-${i}-${Date.now()}@ezrasnashim.com`,
                  `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                  `DTSTART;VALUE=DATE:${dateStr}`,
                  `SUMMARY:${title}`,
                  `DESCRIPTION:Hebrew Date: ${hebrewDate}\\nGregorian: ${eventDate.toLocaleDateString()}`,
                  'STATUS:CONFIRMED',
                  'TRANSP:TRANSPARENT',
                  'END:VEVENT'
                ].join('\r\n'));
              }
            } catch (error) {
              // Failed to convert Hebrew date
            }
          }
        } catch (error) {
          // Hebrew date conversion error
          // Fallback to simple date logic if API fails
          const startYear = inputDate.getFullYear() < currentYear ? currentYear : inputDate.getFullYear();
          
          for (let i = 0; i < years; i++) {
            const eventYear = startYear + i;
            const eventDate = new Date(eventYear, inputDate.getMonth(), inputDate.getDate());
            const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
            
            events.push([
              'BEGIN:VEVENT',
              `UID:hebrew-fallback-${dateStr}-${Date.now()}@ezrasnashim.com`,
              `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
              `DTSTART;VALUE=DATE:${dateStr}`,
              `SUMMARY:${title}`,
              `DESCRIPTION:Hebrew Date: ${hebrewDate}`,
              'STATUS:CONFIRMED',
              'TRANSP:TRANSPARENT',
              'END:VEVENT'
            ].join('\r\n'));
          }
        }
      } else {
        // Create a single event for next year if no Hebrew date
        const nextYear = currentYear + 1;
        const dateStr = `${nextYear}0101`;
        
        events.push([
          'BEGIN:VEVENT',
          `UID:simple-${Date.now()}@ezrasnashim.com`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `DTSTART;VALUE=DATE:${dateStr}`,
          `SUMMARY:${title}`,
          'DESCRIPTION:Calendar event',
          'STATUS:CONFIRMED',
          'TRANSP:TRANSPARENT',
          'END:VEVENT'
        ].join('\r\n'));
      }
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Ezras Nashim//Hebrew Date Converter//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...events,
        'END:VCALENDAR'
      ].join('\r\n');
      
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${years}_years.ics`;
      
      // Use text/calendar for iOS to trigger calendar app import
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(icsContent).toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return res.send(icsContent);
      
    } catch (error) {
      // Calendar download error
      return res.status(500).json({ message: "Failed to generate calendar" });
    }
  });



  // Hebcal Zmanim API proxy route
  app.get("/api/zmanim/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Comprehensive worldwide timezone detection using geo-tz library
      let tzid = 'America/New_York'; // Default fallback
      
      // Log coordinates for debugging
      if (process.env.NODE_ENV === 'development') {
        // Zmanim request for coordinates
      }
      
      try {
        // Use geo-tz library for accurate worldwide timezone detection
        const timezones = findTimezone(latitude, longitude);
        
        if (timezones && timezones.length > 0) {
          tzid = timezones[0]; // Use the first (most accurate) timezone
          if (process.env.NODE_ENV === 'development') {
            // geo-tz detected timezone
            if (timezones.length > 1) {
              // Alternative timezones available
            }
          }
        } else {
          // Fallback to basic detection for edge cases
          if (process.env.NODE_ENV === 'development') {
            // geo-tz returned no timezones, using fallback detection
          }
          
          // Basic fallback detection for ocean areas
          if (latitude >= 29 && latitude <= 33.5 && longitude >= 34 && longitude <= 36) {
            tzid = 'Asia/Jerusalem'; // Israel
          } else if (longitude >= -125 && longitude <= -66) {
            // North America basic zones
            if (longitude >= -125 && longitude <= -120) tzid = 'America/Los_Angeles';
            else if (longitude >= -120 && longitude <= -105) tzid = 'America/Denver';
            else if (longitude >= -105 && longitude <= -90) tzid = 'America/Chicago';
            else tzid = 'America/New_York';
          } else if (longitude >= -10 && longitude <= 30 && latitude >= 35) {
            tzid = 'Europe/London'; // Basic Europe
          } else {
            // UTC offset-based fallback for ocean areas
            const utcOffset = Math.round(longitude / 15);
            if (utcOffset >= -12 && utcOffset <= 14) {
              tzid = `Etc/GMT${utcOffset <= 0 ? '+' : '-'}${Math.abs(utcOffset)}`;
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // geo-tz timezone detection error
        }
        // Keep default fallback timezone
      }
      
      // Log final timezone selection
      if (process.env.NODE_ENV === 'development') {
        // Final selected timezone
      }
      
      // Call Hebcal with exact coordinates (with caching)
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${latitude}&longitude=${longitude}&tzid=${tzid}&date=${today}`;
      const data = await cachedGet(hebcalUrl);
      
      // Format times to 12-hour format with AM/PM - properly handling timezone
      const formatTime = (timeStr: string) => {
        if (!timeStr) return null;
        try {
          // Parse the ISO string as a Date object to handle timezone correctly
          const date = new Date(timeStr);
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            // Fallback to simple string extraction if not a valid date
            const match = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (match) {
              const hours = parseInt(match[1]);
              const minutes = match[2];
              const period = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
              return `${displayHours}:${minutes} ${period}`;
            }
            return timeStr;
          }
          
          // Use toLocaleTimeString with the correct timezone to get local time
          const localTime = date.toLocaleTimeString('en-US', {
            timeZone: tzid,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          return localTime;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // Time formatting error
          }
          return timeStr;
        }
      };

      // Get a more user-friendly location name using reverse geocoding
      let locationName = 'Current Location';
      
      try {
        // Use OpenStreetMap Nominatim API for free reverse geocoding (with caching)
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        const geocodeResponse = await cachedGet(nominatimUrl, {
          headers: {
            'User-Agent': 'EzrasNashim/1.0 (jewish-prayer-app)'
          }
        });
        
        if (geocodeResponse && geocodeResponse.address) {
          const address = geocodeResponse.address;
          
          // Extract city and country from Nominatim response
          const city = address.city || address.town || address.village || address.municipality || address.suburb;
          let country = address.country;
          
          // Handle Hebrew country names
          if (country === 'ישראל') {
            country = 'Israel';
          }
          
          // Special handling for Israeli locations
          if (country === 'Israel' || address.country_code === 'il') {
            // Use intelligent coordinate-based names for Israel (expanded ranges)
            if (latitude >= 31.60 && latitude <= 31.90 && longitude >= 34.90 && longitude <= 35.20) {
              locationName = 'Bet Shemesh, Israel';
            } else if (latitude >= 31.7 && latitude <= 31.85 && longitude >= 35.1 && longitude <= 35.3) {
              locationName = 'Jerusalem, Israel';
            } else if (latitude >= 31.95 && latitude <= 32.15 && longitude >= 34.65 && longitude <= 34.85) {
              locationName = 'Tel Aviv, Israel';
            } else if (latitude >= 32.7 && latitude <= 32.9 && longitude >= 35.0 && longitude <= 35.3) {
              locationName = 'Haifa, Israel';
            } else if (latitude >= 31.2 && latitude <= 31.3 && longitude >= 34.7 && longitude <= 34.9) {
              locationName = 'Beer Sheva, Israel';
            } else {
              locationName = 'Israel';
            }
          } else if (city && country) {
            locationName = `${city}, ${country}`;
          } else if (city) {
            locationName = city;
          } else if (geocodeResponse.display_name) {
            // Use display name but clean it up
            const parts = geocodeResponse.display_name.split(',');
            if (parts.length >= 2) {
              locationName = `${parts[0].trim()}, ${parts[parts.length - 1].trim()}`;
            } else {
              locationName = parts[0].trim();
            }
          }
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, use intelligent coordinate-based fallback
        if (process.env.NODE_ENV === 'development') {
          // Reverse geocoding failed
        }
        
        // Provide intelligent location names based on known coordinates (expanded ranges)
        if (latitude >= 31.60 && latitude <= 31.90 && longitude >= 34.90 && longitude <= 35.20) {
          locationName = 'Bet Shemesh, Israel';
        } else if (latitude >= 31.7 && latitude <= 31.85 && longitude >= 35.1 && longitude <= 35.3) {
          locationName = 'Jerusalem, Israel';
        } else if (latitude >= 31.95 && latitude <= 32.15 && longitude >= 34.65 && longitude <= 34.85) {
          locationName = 'Tel Aviv, Israel';
        } else if (latitude >= 40.65 && latitude <= 40.85 && longitude >= -74.15 && longitude <= -73.95) {
          locationName = 'New York City, NY';
        } else if (latitude >= 33.95 && latitude <= 34.15 && longitude >= -118.35 && longitude <= -118.15) {
          locationName = 'Los Angeles, CA';
        } else {
          // General region-based fallback
          if (latitude >= 29 && latitude <= 33.5 && longitude >= 34 && longitude <= 36) {
            locationName = 'Israel';
          } else if (longitude >= -125 && longitude <= -66) {
            locationName = 'United States';
          } else if (longitude >= -10 && longitude <= 30) {
            locationName = 'Europe';
          } else {
            locationName = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
          }
        }
      }

      const formattedTimes = {
        sunrise: formatTime(data.times?.sunrise),
        shkia: formatTime(data.times?.sunset),
        tzaitHakochavim: formatTime(data.times?.tzeit7083deg),
        minchaGedolah: formatTime(data.times?.minchaGedola),
        minchaKetanah: formatTime(data.times?.minchaKetana),
        candleLighting: formatTime(data.times?.candleLighting),
        havdalah: formatTime(data.times?.havdalah),
        alosHashachar: formatTime(data.times?.alotHaShachar),
        sofZmanTfilla: formatTime(data.times?.sofZmanTfilla),
        chatzos: formatTime(data.times?.chatzot),
        chatzotNight: formatTime(data.times?.chatzotNight),
        plagHamincha: formatTime(data.times?.plagHaMincha),
        hebrewDate: data.date || '',
        location: locationName,
        coordinates: {
          lat: latitude,
          lng: longitude
        }
      };
      
      // Debug logging removed for production

      return res.json(formattedTimes);
    } catch (error) {
      // Error fetching Hebcal zmanim
      return res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
    }
  });

  // Hebcal Events API proxy route
  app.get("/api/events/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      // Get current year and determine date range for events
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      // Fetch events for current and next year to ensure we have upcoming events (with caching)
      // Include minor fasts (mf=on) in addition to holidays and Rosh Chodesh
      const eventsPromises = [currentYear, nextYear].map(async (year) => {
        const hebcalUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&latitude=${latitude}&longitude=${longitude}&maj=on&min=on&nx=on&mf=on`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Server API Request] GET ${hebcalUrl}`);
        }
        const data = await cachedGet(hebcalUrl);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Server API Response] 200 GET ${hebcalUrl}`);
        }
        return data;
      });

      const [currentYearData, nextYearData] = await Promise.all(eventsPromises);
      
      // Combine events from both years
      const allEvents = [
        ...(currentYearData.items || []),
        ...(nextYearData.items || [])
      ];

      // Filter and format events
      const formattedEvents = allEvents
        .filter((event: any) => {
          // Include Major Holidays, Minor Holidays, Rosh Chodesh, and Fast Days
          // Fast days have subcat 'fast' with category 'holiday' (exclude zmanim timing events)
          const isHoliday = event.category === 'holiday';
          const isRoshChodesh = event.category === 'roshchodesh';
          const isFastDay = event.category === 'holiday' && event.subcat === 'fast';
          
          return isHoliday || isRoshChodesh || isFastDay;
        })
        .map((event: any) => ({
          title: event.title || '',
          hebrew: event.hebrew || '',
          date: event.date || '',
          hdate: event.hdate || '',
          category: event.category || '',
          subcat: event.subcat || '',
          memo: event.memo || '',
          yomtov: event.yomtov || false,
          link: event.link || ''
        }))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Get location name for display
      let locationName = 'Current Location';
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        const geocodeResponse = await cachedGet(nominatimUrl, {
          headers: {
            'User-Agent': 'EzrasNashim/1.0 (jewish-prayer-app)'
          }
        });
        
        if (geocodeResponse && geocodeResponse.address) {
          const address = geocodeResponse.address;
          const city = address.city || address.town || address.village || address.municipality || address.suburb;
          const country = address.country;
          
          if (city && country) {
            locationName = `${city}, ${country}`;
          } else if (city) {
            locationName = city;
          }
        }
      } catch (geocodeError) {
        // Geocoding failed, use default location name
      }

      return res.json({
        events: formattedEvents,
        location: locationName
      });

    } catch (error) {
      console.error('Error fetching Hebcal events:', error);
      return res.status(500).json({ message: "Failed to fetch events from Hebcal API" });
    }
  });

  // Hebcal Shabbos times proxy route
  app.get("/api/shabbos/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
      const currentHour = now.getHours();
      
      // On Saturday evening (after ~6pm which is typically after Havdalah),
      // we should show next week's Shabbat information
      // The Jewish day starts at nightfall, so after Saturday night Havdalah,
      // it's already the next week
      let targetDate = new Date(now);
      if (dayOfWeek === 6 && currentHour >= 18) {
        // It's Saturday evening after typical Havdalah time - show next week
        targetDate.setDate(targetDate.getDate() + 7);
      } else if (dayOfWeek === 0 && currentHour < 4) {
        // It's very early Sunday morning (still feels like Saturday night) - show next week
        targetDate.setDate(targetDate.getDate() + 6);
      }

      // Build API URL - include date to get the correct week's Shabbat data
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1; // 1-indexed
      const day = targetDate.getDate();
      const apiUrl = `https://www.hebcal.com/shabbat/?cfg=json&latitude=${latitude}&longitude=${longitude}&gy=${year}&gm=${month}&gd=${day}`;

      // Server API Request
      
      const response = await fetch(apiUrl);
      
      // Server API Response

      if (!response.ok) {
        throw new Error('Failed to fetch Shabbos times from Hebcal');
      }

      const data = await response.json();

      // Parse the Shabbos data
      const result = {
        location: data.location?.title || 'Unknown Location',
        candleLighting: null as string | null,
        havdalah: null as string | null,
        parsha: null as string | null
      };

      // Find the upcoming Friday's candle lighting (closest Friday candle lighting)
      let closestFridayCandleLighting: any = null;
      let closestDistance = Infinity;
      
      data.items.forEach((item: any) => {
        // Look for Shabbat candle lighting times (not Yom Tov)
        if (item.title.includes("Candle lighting:") && item.date && !item.memo?.includes("Yom Kippur")) {
          const itemDate = new Date(item.date);
          const dayOfWeek = itemDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
          
          // Look for Friday or Saturday candle lighting (Shabbat starts Friday night)
          // The API sometimes shows Friday candle lighting on Saturday date
          if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
            const timeDifference = itemDate.getTime() - now.getTime();
            
            // Find the closest upcoming Shabbat candle lighting
            if (timeDifference >= -24 * 60 * 60 * 1000 && timeDifference < closestDistance) { // Allow current day up to 24 hours ago
              closestDistance = timeDifference;
              closestFridayCandleLighting = item;
            }
          }
        }
      });
      
      // Process the closest Friday candle lighting
      if (closestFridayCandleLighting) {
        const item = closestFridayCandleLighting;
        const timeMatch = item.title.match(/Candle lighting: (\d{1,2}:\d{2})(pm|am|p\.m\.|a\.m\.)?/i);
        if (timeMatch) {
          const [hours, minutes] = timeMatch[1].split(':');
          const hour12 = parseInt(hours);
          const suffix = timeMatch[2]?.toLowerCase();
          
          if (suffix) {
            // Already has am/pm, just format it properly
            const displayHour = hour12 === 0 ? 12 : hour12;
            result.candleLighting = `${displayHour}:${minutes} ${suffix.toUpperCase().replace(/\./g, '')}`;
          } else {
            // 24-hour format, convert to 12-hour
            const displayHour = hour12 > 12 ? hour12 - 12 : (hour12 === 0 ? 12 : hour12);
            const period = hour12 >= 12 ? 'PM' : 'AM';
            result.candleLighting = `${displayHour}:${minutes} ${period}`;
          }
        }
      }
      
      // Process other items for havdalah and parsha
      // Get the date of the candle lighting to match parsha/holiday to the same Shabbat
      let candleLightingDate: Date | null = null;
      if (closestFridayCandleLighting && closestFridayCandleLighting.date) {
        candleLightingDate = new Date(closestFridayCandleLighting.date);
      }
      
      data.items.forEach((item: any) => {
        if (item.title.includes("Havdalah:")) {
          // Check if it has pm/am at the end of the title  
          const timeWithSuffixMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})\s*(pm|am)/i);
          if (timeWithSuffixMatch) {
            const [, time, suffix] = timeWithSuffixMatch;
            const [hours, minutes] = time.split(':');
            const hour12 = parseInt(hours);
            const displayHour = hour12 === 0 ? 12 : hour12;
            result.havdalah = `${displayHour}:${minutes} ${suffix.toUpperCase()}`;
          } else {
            // Try 24-hour format
            const timeMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})/);
            if (timeMatch) {
              const [hours, minutes] = timeMatch[1].split(':');
              const hour24 = parseInt(hours);
              const displayHour = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
              const period = hour24 >= 12 ? 'PM' : 'AM';
              result.havdalah = `${displayHour}:${minutes} ${period}`;
            }
          }
        } else if (item.title.startsWith("Parashat ") || item.title.startsWith("Parashah ")) {
          result.parsha = item.title;
        } else if (!result.parsha && item.category === 'holiday' && item.date && candleLightingDate) {
          // If no parsha found yet, check if this is a holiday on the same Shabbat as our candle lighting
          const itemDate = new Date(item.date);
          const dayOfWeek = itemDate.getDay();
          // Check if this holiday falls on Saturday AND is within 2 days of our candle lighting
          // (Friday candle lighting + Saturday = same Shabbat)
          const timeDiff = Math.abs(itemDate.getTime() - candleLightingDate.getTime());
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
          if (dayOfWeek === 6 && daysDiff <= 2) {
            result.parsha = item.title;
          }
        }
      });

      return res.json(result);
    } catch (error) {
      // Error fetching Shabbos times
      return res.status(500).json({ message: "Failed to fetch Shabbos times from Hebcal API" });
    }
  });

  // Sefaria API proxy route for Morning Brochas
  app.get("/api/sefaria/morning-brochas", async (_req, res) => {
    try {
      const morningBlessingUrls = [
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Modeh_Ani.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Modeh_Ani.2",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Netilat_Yadayim.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Asher_Yatzar.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Elokai_Neshama.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.2",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Blessings.3",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Study.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Torah_Study.3",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.1",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.2",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.3",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.5",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.6",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.7",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.8",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.9",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.10",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.11",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.12",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.13",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.14",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.15",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.16",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.17",
        "https://www.sefaria.org/api/v3/texts/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings.18"
      ];

      // Clean HTML markup from text with proper type checking
      const cleanText = (text: any) => {
        if (!text) return '';
        // Convert to string if it's not already
        const textStr = typeof text === 'string' ? text : String(text);
        return textStr
          .replace(/<[^>]*>/g, '') // Remove all HTML tags
          .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
          .replace(/&amp;/g, '&') // Replace HTML entities
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
      };

      // Fetch both Hebrew and English versions
      const results = await Promise.all(
        morningBlessingUrls.map(async (url) => {
          try {
            // Fetch Hebrew version with correct Sefaria API format
            const hebrewUrl = url + '?version=hebrew&return_format=text_only';
            const hebrewResponse = await serverAxiosClient.get(hebrewUrl);
            
            // Extract Hebrew text from API response
            let hebrewText = '';
            if (hebrewResponse.data?.versions?.length > 0) {
              const hebrewVersion = hebrewResponse.data.versions.find((v: any) => v.language === 'he' && v.text);
              if (hebrewVersion?.text) {
                hebrewText = cleanText(hebrewVersion.text);
              }
            }
            
            // Fetch English version with correct Sefaria API format
            const englishUrl = url + '?version=english&return_format=text_only';
            let englishText = '';
            try {
              const englishResponse = await serverAxiosClient.get(englishUrl);
              
              // Extract English text from API response
              if (englishResponse.data?.versions?.length > 0) {
                const englishVersion = englishResponse.data.versions.find((v: any) => v.language === 'en' && v.text);
                if (englishVersion?.text) {
                  englishText = cleanText(englishVersion.text);
                }
              }
              if (process.env.NODE_ENV === 'development') {
                // Found English text
              }
            } catch (englishError) {
              if (process.env.NODE_ENV === 'development') {
                // No English version available
              }
            }
            
            return {
              hebrew: hebrewText,
              english: englishText,
              ref: hebrewResponse.data?.ref || ''
            };
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              // Error fetching morning blessing from Sefaria
            }
            return { hebrew: '', english: '', ref: '' };
          }
        })
      );

      // Filter out empty results and format for frontend
      const validBlessings = results.filter(blessing => 
        blessing.hebrew.trim() || blessing.english.trim()
      );

      return res.json(validBlessings);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error fetching morning brochas from Sefaria
      }
      return res.status(500).json({ message: "Failed to fetch morning brochas from Sefaria API" });
    }
  });





  // Handle preflight OPTIONS request for calendar download
  app.options("/api/calendar-events/download", (req, res) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('OPTIONS preflight request for calendar download');
    }
    res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  });

  // Generate and download ICS calendar file
  app.post("/api/calendar-events/download", async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Calendar download request received:', { 
          method: req.method,
          headers: req.headers,
          body: req.body,
          origin: req.get('origin')
        });
      }
      
      const { title, hebrewDate, gregorianDate, years = 10 } = req.body;
      
      if (!title || !hebrewDate || !gregorianDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Step 1: Convert the original input date to Hebrew to get the Hebrew day/month
      const parseOriginalDate = new Date(gregorianDate);
      const originalYear = parseOriginalDate.getFullYear();
      const originalMonth = parseOriginalDate.getMonth() + 1;
      const originalDay = parseOriginalDate.getDate();
      
      // Get Hebrew date for the original input date
      let hebrewDay, hebrewMonth;
      try {
        const response = await serverAxiosClient.get(`https://www.hebcal.com/converter?cfg=json&gy=${originalYear}&gm=${originalMonth}&gd=${originalDay}&g2h=1`);
        if (response.data && response.data.hd && response.data.hm) {
          hebrewDay = response.data.hd;
          hebrewMonth = response.data.hm;
          if (process.env.NODE_ENV === 'development') {
            console.log(`Original date ${gregorianDate} converts to ${hebrewDay} ${hebrewMonth}`);
          }
        } else {
          throw new Error('Invalid Hebrew date response');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error converting original date to Hebrew:', error);
        }
        return res.status(400).json({ message: "Failed to convert input date to Hebrew date" });
      }

      // Generate ICS content for recurring event
      const generateICSContent = async () => {
        const now = new Date();
        const uid = `hebrew-date-${Date.now()}@ezrasnashim.com`;
        const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        let icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Ezras Nashim//Hebrew Date Converter//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH'
        ];

        const currentYear = new Date().getFullYear();
        const today = new Date();
        
        // Check if the input English date has already passed this year
        const inputDate = new Date(gregorianDate);
        const thisYearInputDate = new Date(currentYear, inputDate.getMonth(), inputDate.getDate());
        const hasPassedThisYear = today > thisYearInputDate;
        
        // Start from next year if the date has passed, otherwise start from current year
        const startYear = hasPassedThisYear ? currentYear + 1 : currentYear;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Input date: ${gregorianDate}, This year's date: ${thisYearInputDate.toDateString()}, Today: ${today.toDateString()}`);
          console.log(`Has passed this year: ${hasPassedThisYear}, Starting from year: ${startYear}`);
        }
        
        // Step 2: Generate calendar events for the specified number of years
        for (let i = 0; i < years; i++) {
          const targetYear = startYear + i;
          
          try {
            // Calculate corresponding Hebrew year for target English year
            // Hebrew year approximately = English year + 3760, but we need to account for the Hebrew calendar overlap
            let hebrewYear = targetYear + 3760;
            
            // Try both possible Hebrew years since Hebrew year changes around Sept/Oct
            const hebrewYearsToTry = [hebrewYear, hebrewYear + 1];
            let englishDateForYear = null;
            
            for (const hy of hebrewYearsToTry) {
              try {
                // Convert Hebrew date back to English for this Hebrew year
                const response = await serverAxiosClient.get(`https://www.hebcal.com/converter?cfg=json&hd=${hebrewDay}&hm=${hebrewMonth}&hy=${hy}&h2g=1`);
                
                if (response.data && response.data.gy && response.data.gm && response.data.gd) {
                  const convertedYear = response.data.gy;
                  
                  // Only use this conversion if it falls in our target year
                  if (convertedYear === targetYear) {
                    englishDateForYear = new Date(response.data.gy, response.data.gm - 1, response.data.gd);
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`${hebrewDay} ${hebrewMonth} ${hy} converts to ${englishDateForYear.toDateString()}`);
                    }
                    break;
                  }
                }
              } catch (err) {
                // Continue trying next Hebrew year
                continue;
              }
            }
            
            if (englishDateForYear) {
              const dateStr = englishDateForYear.toISOString().split('T')[0].replace(/-/g, '');
              
              icsContent.push(
                'BEGIN:VEVENT',
                `UID:${uid}-${targetYear}`,
                `DTSTAMP:${dtStamp}`,
                `DTSTART;VALUE=DATE:${dateStr}`,
                `SUMMARY:${title}`,
                `DESCRIPTION:Hebrew Date: ${hebrewDay} ${hebrewMonth}\\nEnglish Date: ${englishDateForYear.toLocaleDateString()}\\nYear: ${targetYear}`,
                'STATUS:CONFIRMED',
                'TRANSP:TRANSPARENT',
                'END:VEVENT'
              );
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Could not find ${hebrewDay} ${hebrewMonth} in ${targetYear}`);
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`Error processing year ${targetYear}:`, error);
            }
          }
        }
        
        icsContent.push('END:VCALENDAR');
        return icsContent.join('\r\n');
      };

      const icsContent = await generateICSContent();
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${years}_years.ics`;
      
      // Set headers for file download - use octet-stream to force download on iOS
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(icsContent).toString());
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(icsContent);
      
    } catch (error) {
      console.error('Error generating calendar file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return res.status(500).json({ 
        message: "Failed to generate calendar file",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


  // Shop routes
  app.get("/api/shop", 
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'shop-items' }),
    async (_req, res) => {
      try {
        const items = await storage.getAllShopItems();
        return res.json(items);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch shop items" });
      }
    }
  );

  app.get("/api/shop/:id", 
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'shop-item' }),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid shop item ID" });
        }
        const item = await storage.getShopItemById(id);
        if (!item) {
          return res.status(404).json({ message: "Shop item not found" });
        }
        return res.json(item);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch shop item" });
      }
    }
  );

  // Hebcal API proxy
  app.get("/api/hebcal/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await serverAxiosClient.get(hebcalUrl);
      const data = response.data;
      
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch from Hebcal API" });
    }
  });

  // Object storage endpoints for file uploads
  app.post("/api/objects/upload", requireAdminAuth, async (_req, res) => {
    try {
      // Check if AWS S3 is configured
      if (!process.env.AWS_S3_BUCKET) {
        return res.status(503).json({ 
          error: "Object storage not configured",
          message: "AWS S3 bucket not configured. Please set AWS_S3_BUCKET environment variable."
        });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      return res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting upload URL:', error);
      
      return res.status(500).json({ 
        error: "Failed to get upload URL",
        message: error.message || "An unexpected error occurred"
      });
    }
  });

  // Serve uploaded objects
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      return objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Handle object upload completion and set ACL policy (for all media types)
  app.post("/api/objects/upload-complete", requireAdminAuth, async (req, res) => {
    const objectURL = req.body.objectURL || req.body.imageURL; // Support both parameter names
    if (!objectURL) {
      return res.status(400).json({ error: "objectURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectURL,
        {
          owner: "admin",
          visibility: "public"
        }
      );

      return res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting object ACL:", error);
      
      return res.status(500).json({ 
        error: "Internal server error",
        message: error.message || "Failed to process object upload"
      });
    }
  });

  // Legacy alias for backward compatibility
  app.post("/api/images/upload-complete", requireAdminAuth, async (req, res) => {
    const objectURL = req.body.imageURL;
    if (!objectURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectURL,
        {
          owner: "admin",
          visibility: "public"
        }
      );

      return res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting object ACL:", error);
      
      return res.status(500).json({ 
        error: "Internal server error",
        message: error.message || "Failed to process object upload"
      });
    }
  });

  // Community impact routes
  app.get("/api/community/impact/:date", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'community-impact' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const impact = await storage.getCommunityImpactByDate(date);
        return res.json(impact || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch community impact" });
      }
    }
  );

  // Sponsor routes
  app.get("/api/sponsors/:contentType/:date", async (req, res) => {
    try {
      const { contentType, date } = req.params;
      const cacheKey = `sponsor_${contentType}_${date}`;
      const now = Date.now();
      
      // Check cache first (4 hour TTL for sponsor data)
      const cached = apiCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return res.json(cached.data);
      }
      
      const sponsor = await storage.getSponsorByContentTypeAndDate(contentType, date);
      
      // Cache the result for 4 hours
      apiCache.set(cacheKey, {
        data: sponsor || null,
        expires: now + (4 * 60 * 60 * 1000)
      });
      
      return res.json(sponsor || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch sponsor" });
    }
  });

  app.get("/api/sponsors/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const cacheKey = `daily_sponsor_${date}`;
      const now = Date.now();
      
      // Check cache first (5 minute TTL for daily sponsor data)
      const cached = apiCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return res.json(cached.data);
      }
      
      const sponsor = await storage.getDailySponsor(date);
      
      // Cache the result for 5 minutes
      apiCache.set(cacheKey, {
        data: sponsor || null,
        expires: now + (5 * 60 * 1000)
      });
      
      return res.json(sponsor || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch daily sponsor" });
    }
  });

  app.get("/api/sponsors", async (_req, res) => {
    try {
      const cacheKey = 'active_sponsors';
      const now = Date.now();
      
      // Check cache first (30 minute TTL for active sponsors list)
      const cached = apiCache.get(cacheKey);
      if (cached && cached.expires > now) {
        return res.json(cached.data);
      }
      
      const sponsors = await storage.getActiveSponsors();
      
      // Cache the result for 30 minutes
      apiCache.set(cacheKey, {
        data: sponsors,
        expires: now + (30 * 60 * 1000)
      });
      
      return res.json(sponsors);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post("/api/sponsors", requireAdminAuth, async (req, res) => {
    try {
      const sponsor = await storage.createSponsor(req.body);
      
      // Clear sponsor-related cache entries to prevent stale data
      const sponsorshipDate = sponsor.sponsorshipDate;
      
      // Clear daily sponsor cache for the sponsor's date
      apiCache.delete(`daily_sponsor_${sponsorshipDate}`);
      
      // Clear active sponsors list cache
      apiCache.delete('active_sponsors');
      
      // Clear any content-specific sponsor caches for this date
      // We don't know all possible content types, so clear the common ones
      const contentTypes = ['daily', 'tehillim', 'torah', 'tefilla'];
      contentTypes.forEach(contentType => {
        apiCache.delete(`sponsor_${contentType}_${sponsorshipDate}`);
      });
      
      return res.json(sponsor);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns/active", 
    cacheMiddleware({ ttl: CACHE_TTL.TODAYS_SPECIAL, category: 'campaigns-active' }),
    async (_req, res) => {
      try {
        const campaign = await storage.getActiveCampaign();
        return res.json(campaign || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch active campaign" });
      }
    }
  );

  app.get("/api/campaigns", async (_req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      return res.json(campaigns);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      return res.json(campaign);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Daily recipe routes
  app.get("/api/table/recipe/:date", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'daily-recipes' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const recipe = await storage.getDailyRecipeByDate(date);
        return res.json(recipe || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily recipe" });
      }
    }
  );

  app.get("/api/table/recipe", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'daily-recipes-today' }),
    async (_req, res) => {
      try {
        // Get current date
        // Day starts at 02:00 local time for analytics
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        const today = now.toISOString().split('T')[0];
        
        const recipe = await storage.getDailyRecipeByDate(today);
        return res.json(recipe || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily recipe" });
      }
    }
  );

  app.post("/api/table/recipe", requireAdminAuth, async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Recipe creation request body:", req.body);
      }
      const validatedData = insertDailyRecipeSchema.parse(req.body);
      if (process.env.NODE_ENV === 'development') {
        console.log("Recipe validated data:", validatedData);
      }
      const recipe = await storage.createDailyRecipe(validatedData);
      return res.json(recipe);
    } catch (error) {
      console.error("Failed to create daily recipe:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: "Failed to create daily recipe", error: error.message });
      } else {
        return res.status(500).json({ message: "Failed to create daily recipe", error: String(error) });
      }
    }
  });

  // Get all recipes for admin interface
  app.get("/api/table/recipes", requireAdminAuth, async (_req, res) => {
    try {
      const recipes = await storage.getAllDailyRecipes();
      return res.json(recipes);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/table/vort/:week", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'parsha-vorts' }),
    async (req, res) => {
      try {
        const { week } = req.params;
        const vort = await storage.getParshaVortByWeek(week);
        return res.json(vort || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Parsha vort" });
      }
    }
  );

  app.get("/api/table/vort", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'parsha-vorts-today' }),
    async (_req, res) => {
      try {
        // Day starts at 02:00 local time for analytics
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        const today = now.toISOString().split('T')[0];
        const vorts = await storage.getParshaVortsByDate(today);
        return res.json(vorts);
      } catch (error) {
        console.error('Error fetching Parsha vorts:', error);
        return res.status(500).json({ message: "Failed to fetch Parsha vorts" });
      }
    }
  );

  app.post("/api/table/vort", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertParshaVortSchema.parse(req.body);
      const vort = await storage.createParshaVort(validatedData);
      return res.json(vort);
    } catch (error) {
      console.error('Error creating Parsha vort:', error);
      return res.status(500).json({ message: "Failed to create Parsha vort" });
    }
  });

  // Get all Parsha vorts (admin only)
  app.get("/api/table/vorts", requireAdminAuth, async (_req, res) => {
    try {
      const vorts = await storage.getAllParshaVorts();
      return res.json(vorts);
    } catch (error) {
      console.error('Error fetching all Parsha vorts:', error);
      return res.status(500).json({ message: "Failed to fetch Parsha vorts" });
    }
  });

  // Update Parsha vort (admin only)
  app.put("/api/table/vort/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Get existing vort
      const existingVort = await storage.getParshaVortById(id);
      if (!existingVort) {
        return res.status(404).json({ message: "Parsha vort not found" });
      }
      
      const validatedData = baseParshaVortSchema.partial().parse(req.body);
      
      // Merge existing data with update to check final state
      const mergedData = { ...existingVort, ...validatedData };
      
      // Validate that merged result has at least one media URL
      if (!mergedData.audioUrl && !mergedData.videoUrl) {
        return res.status(400).json({ 
          message: "Update failed: vort must have at least one of audioUrl or videoUrl" 
        });
      }
      
      // Filter out undefined values for exactOptionalPropertyTypes compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const vort = await storage.updateParshaVort(id, cleanedData as any);
      
      if (!vort) {
        return res.status(404).json({ message: "Parsha vort not found" });
      }
      
      return res.json(vort);
    } catch (error) {
      console.error('Error updating Parsha vort:', error);
      return res.status(500).json({ message: "Failed to update Parsha vort" });
    }
  });

  // Delete Parsha vort (admin only)
  app.delete("/api/table/vort/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteParshaVort(id);
      
      if (!success) {
        return res.status(404).json({ message: "Parsha vort not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Parsha vort:', error);
      return res.status(500).json({ message: "Failed to delete Parsha vort" });
    }
  });

  // Torah Classes routes
  app.get("/api/torah-classes", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-classes-today' }),
    async (_req, res) => {
      try {
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        const today = now.toISOString().split('T')[0];
        const classes = await storage.getTorahClassesByDate(today);
        return res.json(classes);
      } catch (error) {
        console.error('Error fetching Torah classes:', error);
        return res.status(500).json({ message: "Failed to fetch Torah classes" });
      }
    }
  );

  app.get("/api/torah-classes/all", requireAdminAuth, async (_req, res) => {
    try {
      const classes = await storage.getAllTorahClasses();
      return res.json(classes);
    } catch (error) {
      console.error('Error fetching all Torah classes:', error);
      return res.status(500).json({ message: "Failed to fetch Torah classes" });
    }
  });

  app.post("/api/torah-classes", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertTorahClassSchema.parse(req.body);
      const torahClass = await storage.createTorahClass(validatedData);
      return res.json(torahClass);
    } catch (error) {
      console.error('Error creating Torah class:', error);
      return res.status(500).json({ message: "Failed to create Torah class" });
    }
  });

  app.put("/api/torah-classes/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertTorahClassSchema.partial().parse(req.body);
      // Filter out undefined values for exactOptionalPropertyTypes compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const torahClass = await storage.updateTorahClass(id, cleanedData as any);
      
      if (!torahClass) {
        return res.status(404).json({ message: "Torah class not found" });
      }
      
      return res.json(torahClass);
    } catch (error) {
      console.error('Error updating Torah class:', error);
      return res.status(500).json({ message: "Failed to update Torah class" });
    }
  });

  app.delete("/api/torah-classes/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteTorahClass(id);
      
      if (!success) {
        return res.status(404).json({ message: "Torah class not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Torah class:', error);
      return res.status(500).json({ message: "Failed to delete Torah class" });
    }
  });

  // Life Classes routes
  app.get("/api/life-classes", async (_req, res) => {
    try {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const classes = await storage.getLifeClassesByDate(today);
      return res.json(classes);
    } catch (error) {
      console.error('Error fetching Life classes:', error);
      return res.status(500).json({ message: "Failed to fetch Life classes" });
    }
  });

  app.get("/api/life-classes/all", requireAdminAuth, async (_req, res) => {
    try {
      const classes = await storage.getAllLifeClasses();
      return res.json(classes);
    } catch (error) {
      console.error('Error fetching all Life classes:', error);
      return res.status(500).json({ message: "Failed to fetch Life classes" });
    }
  });

  app.post("/api/life-classes", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertLifeClassSchema.parse(req.body);
      const lifeClass = await storage.createLifeClass(validatedData);
      return res.json(lifeClass);
    } catch (error) {
      console.error('Error creating Life class:', error);
      return res.status(500).json({ message: "Failed to create Life class" });
    }
  });

  app.put("/api/life-classes/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertLifeClassSchema.partial().parse(req.body);
      // Filter out undefined values for exactOptionalPropertyTypes compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const lifeClass = await storage.updateLifeClass(id, cleanedData as any);
      
      if (!lifeClass) {
        return res.status(404).json({ message: "Life class not found" });
      }
      
      return res.json(lifeClass);
    } catch (error) {
      console.error('Error updating Life class:', error);
      return res.status(500).json({ message: "Failed to update Life class" });
    }
  });

  app.delete("/api/life-classes/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteLifeClass(id);
      
      if (!success) {
        return res.status(404).json({ message: "Life class not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Life class:', error);
      return res.status(500).json({ message: "Failed to delete Life class" });
    }
  });

  // Gems of Gratitude routes
  app.get("/api/gems-of-gratitude/all", requireAdminAuth, async (_req, res) => {
    try {
      const gems = await storage.getAllGemsOfGratitude();
      return res.json(gems);
    } catch (error) {
      console.error('Error fetching all Gems of Gratitude:', error);
      return res.status(500).json({ message: "Failed to fetch Gems of Gratitude" });
    }
  });

  app.post("/api/gems-of-gratitude", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertGemsOfGratitudeSchema.parse(req.body);
      const gem = await storage.createGemsOfGratitude(validatedData);
      return res.json(gem);
    } catch (error) {
      console.error('Error creating Gems of Gratitude:', error);
      return res.status(500).json({ message: "Failed to create Gems of Gratitude" });
    }
  });

  app.put("/api/gems-of-gratitude/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertGemsOfGratitudeSchema.partial().parse(req.body);
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const gem = await storage.updateGemsOfGratitude(id, cleanedData as any);
      
      if (!gem) {
        return res.status(404).json({ message: "Gems of Gratitude not found" });
      }
      
      return res.json(gem);
    } catch (error) {
      console.error('Error updating Gems of Gratitude:', error);
      return res.status(500).json({ message: "Failed to update Gems of Gratitude" });
    }
  });

  app.delete("/api/gems-of-gratitude/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteGemsOfGratitude(id);
      
      if (!success) {
        return res.status(404).json({ message: "Gems of Gratitude not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Gems of Gratitude:', error);
      return res.status(500).json({ message: "Failed to delete Gems of Gratitude" });
    }
  });

  // Zmanim route that returns parsed and adjusted times
  app.get("/api/zmanim/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await serverAxiosClient.get(hebcalUrl);
      const data = response.data;
      
      // Parse the response to extract times
      const times: any = {};
      
      if (data.times) {
        const formatTime = (timeStr: string) => {
          if (!timeStr) return 'N/A';
          const date = new Date(timeStr);
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York'
          });
        };

        const adjustTime = (timeStr: string, adjustmentMinutes: number) => {
          if (!timeStr) return 'N/A';
          try {
            const date = new Date(timeStr);
            date.setMinutes(date.getMinutes() + adjustmentMinutes);
            return date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York'
            });
          } catch {
            return 'N/A';
          }
        };

        times.sunrise = adjustTime(data.times.sunrise, -3); // 3 minutes earlier
        times.shkia = adjustTime(data.times.sunset, -42); // 42 minutes earlier  
        times.tzaitHakochavim = formatTime(data.times.tzeit7083deg);
        times.minchaGedolah = formatTime(data.times.minchaGedola);
        times.minchaKetanah = formatTime(data.times.minchaKetana);
        times.candleLighting = formatTime(data.times.candlelighting);
        times.havdalah = formatTime(data.times.havdalah);
        times.hebrewDate = data.date?.hebrew || '';
        times.location = data.location?.title || 'New York';
      }
      
      return res.json(times);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch zmanim data" });
    }
  });

  // Admin: Migrate tehillim_names to tehillim_chains
  app.post("/api/admin/migrate-tehillim-names", requireAdminAuth, async (_req, res) => {
    try {
      const result = await storage.migrateTehillimNamesToChains();
      return res.json(result);
    } catch (error) {
      console.error("Error migrating tehillim names:", error);
      return res.status(500).json({ error: "Failed to migrate tehillim names" });
    }
  });

  // Nishmas text routes
  app.get("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const text = await storage.getNishmasTextByLanguage(language);
      return res.json(text || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Nishmas text" });
    }
  });

  app.post("/api/nishmas", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertNishmasTextSchema.parse(req.body);
      const text = await storage.createNishmasText(validatedData);
      return res.json(text);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create Nishmas text" });
    }
  });

  app.put("/api/nishmas/:language", requireAdminAuth, async (req, res) => {
    try {
      const { language } = req.params;
      const validatedData = insertNishmasTextSchema.partial().parse(req.body);
      // Filter out undefined values for exactOptionalPropertyTypes compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const text = await storage.updateNishmasText(language, cleanedData as any);
      return res.json(text);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update Nishmas text" });
    }
  });

  // Pirkei Avot progression route
  app.get("/api/pirkei-avot/progress", async (_req, res) => {
    try {
      const progress = await storage.getPirkeiAvotProgress();
      return res.json(progress);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Pirkei Avot progress" });
    }
  });

  // Women's prayer routes
  app.get("/api/womens-prayers/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const prayers = await storage.getWomensPrayersByCategory(category);
      return res.json(prayers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch women's prayers" });
    }
  });

  app.get("/api/womens-prayers/prayer/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prayer = await storage.getWomensPrayerById(parseInt(id));
      return res.json(prayer || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch prayer" });
    }
  });

  // Meditation routes
  app.get("/api/meditations/categories", async (_req, res) => {
    try {
      const categories = await storage.getMeditationCategories();
      return res.json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch meditation categories" });
    }
  });

  app.get("/api/meditations/section/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const meditations = await storage.getMeditationsBySection(section);
      return res.json(meditations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch meditations" });
    }
  });

  app.get("/api/meditations/all", async (_req, res) => {
    try {
      const allMeditations = await storage.getAllMeditations();
      return res.json(allMeditations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch all meditations" });
    }
  });

  // Discount promotion routes
  app.get("/api/discount-promotions/active", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      let userLocation = "worldwide";
      
      // Check if coordinates are in Israel (approximate bounding box)
      if (lat && lng) {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        
        // Israel's approximate coordinates: 29.5-33.4°N, 34.3-35.9°E
        if (latitude >= 29.5 && latitude <= 33.4 && longitude >= 34.3 && longitude <= 35.9) {
          userLocation = "israel";
        }
      }
      
      const promotions = await storage.getActiveDiscountPromotions(userLocation);
      return res.json(promotions);
    } catch (error) {
      console.error('Error fetching discount promotions:', error);
      return res.status(500).json({ message: "Failed to fetch active discount promotions" });
    }
  });



  // Donation completion handler
  app.post("/api/donation-complete", async (req, res) => {
    try {
      const { buttonType, donationType, sponsorName, dedication, message, email } = req.body;
      
      console.log('📋 Donation completion request received:', {
        donationType,
        sponsorName,
        email,
        dedication,
        message,
        hasName: !!sponsorName,
        donationTypeMatch: donationType === 'Sponsor a Day of Ezras Nashim'
      });
      
      // Only create sponsor record for "Sponsor a Day" donations
      if (buttonType === 'sponsor_a_day' && sponsorName) {
        // Day starts at 02:00 local time for analytics
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        const today = now.toISOString().split('T')[0];
        
        const sponsorData = {
          name: sponsorName,
          email: email || null,
          sponsorshipDate: today,
          inHonorMemoryOf: dedication || null,
          message: message || null,
          isActive: true
        };
        
        console.log('🎯 Creating sponsor record with data:', sponsorData);
        
        // Create sponsor record
        const createdSponsor = await storage.createSponsor(sponsorData);
        
        console.log(`✅ Successfully created sponsor record:`, {
          id: createdSponsor.id,
          name: createdSponsor.name,
          date: createdSponsor.sponsorshipDate,
          dedication: createdSponsor.inHonorMemoryOf,
          message: createdSponsor.message
        });
        
        return res.json({ success: true, message: 'Sponsor record created', sponsor: createdSponsor });
      } else {
        console.log('⏭️ No sponsor record needed - conditions not met:', {
          donationType,
          sponsorName,
          isCorrectType: donationType === 'Sponsor a Day of Ezras Nashim',
          hasName: !!sponsorName
        });
        return res.json({ success: true, message: 'No sponsor record needed' });
      }
    } catch (error: any) {
      console.error('❌ Failed to create sponsor record:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create sponsor record',
        error: error.message 
      });
    }
  });

  // Serve Apple Pay domain verification file
  app.get("/.well-known/apple-developer-merchantid-domain-association", (_req, res) => {
    console.log('Apple Pay domain verification file requested');
    res.setHeader('Content-Type', 'text/plain');
    // Send the Apple Pay domain verification content
    res.send('7B227073704964223A2239373830303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222C2276657273696F6E223A312C22637265617465644F6E223A313534373531373737393538332C227369676E6174757265223A22333038303036303932613836343838366637306430313037303261303830333038303330383130373061303132383034383336633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933656436656537613738303830333038623135333032303136633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653465363536333736333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030333038316330313035313030313031303330383161323330613036303832613836343836366637306430323031303130353030613038316138306161613863633763373036346166336535303635633532383336303830343363333462646338663034376335383230653566346165613333383035396430303862343030626536646662366562633036316236636632666637353633643832326231333436326631353638346633343730323666346134623430393231633666643234613432626639316462623366616430666332353265663763306562333062656165663532376338393964633962633934366234336533633633373434656535643333353935373766613730356233323863373330326635313934306433653231656165613730306436636638613039316137383435363237663131373437343832363738623634626238636330373766343439346533336262646633656665353264653331643339363030313531643165353832636166633264373563373737303765373937616636613733356135326431656137356639393737323661666533306531356232616336633330653430313536633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653065363536333637333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030613038316331393938643831373439373531643362343261646365643234306633373830346264346133316462323334363433356136303237633862303262396336303263363365316462636536613161663833613830326532616461656564396331626437316433313035393864666534393366393736313535653436613436396634353639303936326439633161393836383363653766326364623337613235346136393233383866393264356434633461393034663037333336396334633165386135613833666131363836383461396666343661323633653362643139646431636533393866393862616563643638363930373766626532663465636639326635656565616232393063643235653639336235313936346366656362643134376665383837626635303935333463383562653537653433356235356666616637616163323962303438383230333931643366353661626231633939643437306665636636333066653932383535323732343739613836343030613035646630323030303461616636623334646531646530623234383866326439396436303031646336613739366338373836346564303134356162313036643166363262393438313662373735386365346630363237353332373738343538353937343066343863313565626537623938653735643238633732303530373562306134376233623964333335653838653436346431313265323363376235623564663139653436656162636562373031383862376435376661653865646166393064333330333938656465393230633535643465343831653832353437336336643834303065643464646338643339333366303339636239323763646261626437343763656538316436626137356439313364363338643565653361313564626535303939393035663530396263656633316137653538646537373132333766366632396130303035383936623132366236623766363464656662653032303030333038323033383233303832303162313061303330323031303230323034303031623063653834333038313061303630383261383634383836663730643031303130623035303030613831393733303833363130623330303933303631303433353533343130633033353535333130313133303132303630333535303430613063306236313730373036633635323036393665363332653330316533303163303630333535303430333063313535313631373030366336353230343934343230353137323635373336393734363537363636363936333631373436393666366535333635373237363639363365373330323030353364653532633537326133383833306266656466613763383130333066333734663030653261323963336631383032636330323364353764316132346137663165366161326533623538636566333333356631656337313135623830333264623963643866313131636638303661643038643738653538626236353135316233643439663966303165356535356166383732333738626138623633393436316532623562313638653563393436393932303065643634656531306665336434333433343332356431666336353139613537393966303363623465323734306664316563656265333866376431376539613064653936623138623066383666353662386664663061613730396232653736616439376437616632383464623536646662373164383166653961633635646533613533393837336666373165353966336131373539373765343935393966393337636135626133376232353735343233373938343433373863326564353261343765366338393337376135343764646234633835313039663165383033353631396431623632333738383839333434366531393461653930393065333738373433383863353966373437646434323334646462623633353036303030222C22706F6453223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D222C22706F64223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D22222C22747261646554223A313534373531373737393030302C22727041223A22456A30334E7A597A4E7A4D304D7A4D794E5463794E4441784E7A45334E6A67354E446B314E6A6C6D4D7A4E6A4D324D7A51794E6D566D4E4463344E324A684F4738325A4755304E7A5530597A466A4E446B314E7A593551413D3D222C227230336B53636F7265223A312C2272336B53636F7265223A312C22723361723053636F7265223A312C2264737377536D34537461747573223A302C227231676D536D34537461747573223A302C22697373756572536D34537461747573223A302C22687638386D74537461747573223A302C2268763838537461747573223A317D');
  });

  // Test Stripe connection endpoint
  app.get("/api/stripe-test", async (_req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({
          success: false,
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.'
        });
      }
      
      console.log('Testing Stripe connection...');
      console.log('Stripe key configured:', !!process.env.STRIPE_SECRET_KEY);
      console.log('Stripe key format:', process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...');
      
      // Try to create a minimal payment intent for testing
      const testIntent = await stripe.paymentIntents.create({
        amount: 100, // $1.00
        currency: 'usd',
        metadata: { test: 'true' }
      });
      
      console.log('Test payment intent created:', testIntent.id);
      
      return res.json({
        success: true,
        message: 'Stripe connection working',
        testIntentId: testIntent.id,
        status: testIntent.status
      });
    } catch (error: any) {
      console.error('Stripe test failed:', {
        message: error.message,
        type: error.type,
        code: error.code,
        decline_code: error.decline_code
      });
      
      return res.status(500).json({
        success: false,
        error: error.message,
        type: error.type,
        code: error.code
      });
    }
  });

  // Stripe payment route for donations
  app.post("/api/create-session-checkout", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({
          success: false,
          error: 'Payment processing is currently unavailable. Please contact support.'
        });
      }
      
      const { amount, donationType, metadata } = req.body;
      
      // console.log('=== PAYMENT INTENT REQUEST ===');
      // console.log('Request body:', { amount, donationType, metadata });
      // console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);
      // console.log('Stripe key starts with sk_:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));
      
      // if (!amount || amount <= 0) {
      //   console.log('Invalid amount provided:', amount);
      //   return res.status(400).json({ message: "Invalid amount" });
      // }

      // if (!process.env.STRIPE_SECRET_KEY) {
      //   console.error('STRIPE_SECRET_KEY not found in environment');
      //   return res.status(500).json({ message: "Stripe not configured" });
      // }

      // console.log('Creating payment intent with:', { 
      //   amount, 
      //   donationType, 
      //   metadata,
      //   stripeConfigured: !!process.env.STRIPE_SECRET_KEY
      // });
      
      // const paymentIntentData: any = {
      //   amount: Math.round(amount * 100), // Convert to cents
      //   currency: "usd",
      //   metadata: {
      //     source: "ezras-nashim-donation",
      //     donationType: donationType || "General Donation",
      //     sponsorName: metadata?.sponsorName || "",
      //     dedication: metadata?.dedication || "",
      //     email: email || metadata?.email || "",
      //     timestamp: new Date().toISOString()
      //   },
      //   // Enable automatic payment methods including Apple Pay and Google Pay
      //   automatic_payment_methods: {
      //     enabled: true,
      //     allow_redirects: 'never' as const // Keep on same page for better UX
      //   }
      // };
      
      // // Add receipt_email if provided - this will trigger Stripe to send receipts
      // const receiptEmail = email || metadata?.email;
      // if (receiptEmail && receiptEmail.includes('@')) {
      //   paymentIntentData.receipt_email = receiptEmail;
      //   console.log('Receipt email will be sent to:', receiptEmail);
      // }
      
      // console.log('Payment intent configuration:', paymentIntentData);
      
      // const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      
      // console.log('Payment intent created successfully:', {
      //   id: paymentIntent.id,
      //   status: paymentIntent.status,
      //   amount: paymentIntent.amount,
      //   client_secret_exists: !!paymentIntent.client_secret
      // });
      
      // // Track the donation attempt in our database
      // try {
      //   await storage.createDonation({
      //     stripePaymentIntentId: paymentIntent.id,
      //     amount: paymentIntent.amount, // Already in cents
      //     donationType: donationType || "General Donation",
      //     sponsorName: metadata?.sponsorName,
      //     dedication: metadata?.dedication,
      //     email: receiptEmail,
      //     status: 'pending'
      //   });
      //   console.log('Donation tracked in database:', paymentIntent.id);
      // } catch (dbError) {
      //   console.error('Error saving donation to database:', dbError);
      //   // Continue even if database save fails
      // }

      const returnUrl = req.body.returnUrl;
      const session = await stripe.checkout.sessions.create({
        currency: 'usd',
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount_decimal: Math.round(parseFloat(amount) * 100).toString(),
            product_data: {
              name: "Ezras Nashim Donation",
            }
          }
        }],
        ui_mode: 'custom',
        mode: 'payment',
        return_url: returnUrl,
        payment_intent_data: {
          description: 'Just One Chesed Inc.\nEIN: 47-5615860\nNo tangible benefits were received from this donation.',
          metadata: {
            source: "ezras-nashim-donation",
            donationType:  donationType || "Ezras Nashim Donation",
            buttonType: metadata?.buttonType || "put_a_coin", // Track which button was clicked
            sponsorName:  metadata?.sponsorName || "",
            dedication: metadata?.dedication || "",
            message: metadata?.message || "",
            email: metadata?.email || "",
            timestamp: new Date().toISOString(),
          },
        },
        invoice_creation: {
          enabled: false,
          invoice_data: {
            description: 'Just One Chesed Inc.\nEIN: 47-5615860\nNo tangible benefits were received from this donation.',
          },
        },
      });

      // Track the donation attempt in our database with enhanced schema
      try {
        await storage.createDonation({
          userId: null, // We don't have user auth yet
          stripePaymentIntentId: session.id,
          stripeSessionId: session.id,
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          type: metadata?.buttonType || "put_a_coin",
          donationType: donationType || "General Donation",
          sponsorName: metadata?.sponsorName || null,
          dedication: metadata?.dedication || null,
          email: metadata?.email || null,
          metadata: {
            buttonType: metadata?.buttonType || "put_a_coin",
            sponsorName: metadata?.sponsorName || "",
            dedication: metadata?.dedication || "",
            message: metadata?.message || "",
            email: metadata?.email || "",
            source: "ezras-nashim-donation",
            timestamp: new Date().toISOString()
          },
          status: 'pending'
        });
        console.log('Donation tracked in database with enhanced schema:', session.id);
      } catch (dbError) {
        console.error('Error saving donation to database:', dbError);
        // Continue even if database save fails
      }

      console.log('Session created successfully:', session.id)
      return res.json({ 
        sessionId: session.id,
        amount: amount,
      });
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', {
        error: error.message,
        code: error.code,
        type: error.type,
        decline_code: error.decline_code
      });
      return res.status(500).json({ 
        message: "Error creating payment intent: " + error.message,
        code: error.code,
        type: error.type
      });
    }
  });

  // Universal media proxy endpoint - supports multiple hosting services
  app.get("/api/media-proxy/:service/*", async (req, res) => {
    try {
      const { service } = req.params;
      const filePath = (req.params as any)[0]; // Capture everything after service
      let mediaUrl = '';
      
      // Support different hosting services
      switch (service) {
        case 'github':
          // GitHub raw file format: https://raw.githubusercontent.com/username/repo/branch/path/file
          mediaUrl = `https://raw.githubusercontent.com/${filePath}`;
          break;
        case 'cloudinary':
          // Cloudinary format: https://res.cloudinary.com/cloud-name/resource_type/upload/v1234567890/file
          mediaUrl = `https://res.cloudinary.com/${filePath}`;
          break;
        case 'supabase':
          // Supabase storage format
          mediaUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${filePath}`;
          break;
        case 'firebase':
          // Firebase storage format
          mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${filePath}`;
          break;
        case 'gdrive':
        default:
          // Fallback to Google Drive for backward compatibility
          mediaUrl = `https://drive.usercontent.google.com/download?id=${filePath}&export=download`;
          break;
      }
      
      const response = await serverAxiosClient.get(mediaUrl, {
        maxRedirects: 10,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EzrasNashim/1.0)'
        },
        responseType: 'stream'
      });
      
      if (response.status !== 200) {
        return res.status(404).json({ error: "Media file not found" });
      }
      
      // Set appropriate headers for media streaming
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Stream the response directly with axios
      if (response.data) {
        return response.data.pipe(res);
      } else {
        return res.status(500).json({ error: "No response body" });
      }
    } catch (error) {
      console.error('Media proxy error:', error);
      return res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Keep old audio proxy for backward compatibility
  app.get("/api/audio-proxy/:fileId", async (req, res) => {
    const { fileId } = req.params;
    // Redirect to new universal proxy with gdrive service
    return res.redirect(`/api/media-proxy/gdrive/${fileId}`);
  });

  // Serve frontend application on root route
  // app.get("/", (req, res) => {
  //   // In Replit environment, we need to serve the frontend differently
  //   if (process.env.REPLIT_DOMAINS) {
  //     // For Replit, redirect to the frontend port
  //     const replitDomain = process.env.REPLIT_DOMAINS;
  //     res.redirect(`https://${replitDomain}`);
  //   } else {
  //     // Local development
  //     res.redirect("http://localhost:5173");
  //   }
  // });

  // REMOVED: First duplicate /api/payments/confirm endpoint - using the second one below

  // Debug endpoint to verify webhook secret is loaded
  app.get("/api/webhooks/stripe/debug", async (_req, res) => {
    return res.json({
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretPrefix: process.env.STRIPE_WEBHOOK_SECRET ? (Array.isArray(process.env.STRIPE_WEBHOOK_SECRET) ? process.env.STRIPE_WEBHOOK_SECRET[0] : process.env.STRIPE_WEBHOOK_SECRET).substring(0, 10) + '...' : 'NOT_SET',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Alternative webhook endpoint with different path (in case proxy is blocking /api/webhooks/stripe)
  app.post("/api/stripe-webhook", async (req, res) => {
    // Forward to main webhook handler
    return app._router.handle(Object.assign(req, { url: '/api/webhooks/stripe' }), res, () => {});
  });

  // Stripe webhook handler for processing successful payments
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Log webhook attempt for debugging
      console.log('Webhook received:', {
        hasSignature: !!sig,
        hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        bodyType: typeof req.body,
        bodyLength: req.body ? req.body.length : 0
      });

      // Verify webhook signature for security
      if (!sig) {
        console.error('Missing stripe signature header');
        return res.status(400).json({ error: 'Missing stripe signature' });
      }
      if (!stripe) {
        console.error('Stripe not configured - cannot process webhook');
        return res.status(503).json({ error: 'Stripe not configured' });
      }
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Missing stripe webhook secret environment variable');
        return res.status(400).json({ error: 'Missing webhook secret configuration' });
      }
      
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('Webhook signature verified successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', {
        error: errorMessage,
        signatureHeader: sig ? (typeof sig === 'string' ? sig.substring(0, 20) + '...' : 'array') : 'none',
        secretPrefix: process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...' : 'none'
      });
      return res.status(400).json({ error: `Webhook validation failed: ${errorMessage}` });
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Webhook: Payment succeeded:', paymentIntent.id);
          
          // BACKUP RECONCILIATION: Check if already processed by frontend
          const existingAct = await storage.getActByPaymentIntentId(paymentIntent.id);
          if (existingAct) {
            console.log(`Webhook: Payment ${paymentIntent.id} already processed by frontend - skipping`);
            break; // Already handled by frontend confirmation
          }
          
          console.log(`Webhook: Processing payment ${paymentIntent.id} as backup reconciliation`);
          
          // Update donation status to succeeded
          const donation = await storage.getDonationByPaymentIntentId(paymentIntent.id);
          if (donation) {
            await storage.updateDonationStatus(paymentIntent.id, 'succeeded');
            
            // Create an act record for tracking individual button completion
            const buttonType = paymentIntent.metadata?.buttonType || 'put_a_coin';
            await storage.createAct({
              userId: null, // We don't have user auth yet
              category: 'tzedaka',
              subtype: buttonType,
              amount: paymentIntent.amount,
              paymentIntentId: paymentIntent.id // Store for idempotency
            });
            
            console.log(`Created act record for ${buttonType} completion`);

            // Track tzedaka completion in analytics for stats counting
            await storage.trackEvent({
              eventType: 'tzedaka_completion',
              eventData: {
                buttonType: buttonType,
                amount: paymentIntent.amount / 100, // Convert from cents to dollars
                donationId: donation.id
              },
              sessionId: null // We don't have session context in webhook
            });

            // CRITICAL FIX: Also track as modal_complete so it appears in Feature Usage section
            await storage.trackEvent({
              eventType: 'modal_complete',
              eventData: {
                modalType: 'tzedaka',
                buttonType: buttonType,
                amount: paymentIntent.amount / 100,
                donationId: donation.id
              },
              sessionId: null
            });
            console.log('Tracked donation as modal_complete for Feature Usage display');

            // Update campaign progress if this is an active_campaign donation
            if (buttonType === 'active_campaign') {
              try {
                // Get current active campaign
                const activeCampaign = await storage.getActiveCampaign();
                if (activeCampaign) {
                  const newAmount = activeCampaign.currentAmount + (paymentIntent.amount / 100); // Convert from cents
                  await storage.updateCampaignProgress(activeCampaign.id, newAmount);
                  console.log(`Updated campaign progress: $${newAmount}`);
                }
              } catch (campaignError) {
                console.error('Error updating campaign progress:', campaignError);
              }
            }

            // Update today's analytics stats to show immediate impact
            // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
            try {
              await storage.recalculateDailyStats(today);
              console.log('Recalculated daily stats after donation');
            } catch (statsError) {
              console.error('Error recalculating daily stats:', statsError);
            }

            // Store completion in database for frontend to pick up (backup to URL redirect)
            try {
              await storage.trackEvent({
                eventType: 'tzedaka_button_completion',
                eventData: {
                  buttonType: buttonType,
                  paymentIntentId: paymentIntent.id,
                  amount: paymentIntent.amount / 100,
                  timestamp: new Date().toISOString(),
                  source: 'webhook'
                },
                sessionId: null
              });
              console.log(`Stored ${buttonType} completion event for frontend pickup`);
            } catch (completionError) {
              console.error('Error storing completion event:', completionError);
            }
          }
          break;
          
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('Webhook: Checkout session completed:', session.id);
          
          // CRITICAL FIX: Only process if payment was successful
          // checkout.session.completed fires even for failed payments
          if (session.payment_status !== 'paid') {
            console.log(`Webhook: Checkout session ${session.id} payment status is ${session.payment_status} - skipping analytics`);
            break;
          }
          
          // Get the payment intent from the session
          const paymentIntentId = session.payment_intent;
          console.log('Webhook: Payment intent from session:', paymentIntentId);
          
          // CRITICAL: Skip if no valid payment intent ID
          if (!paymentIntentId || typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
            console.log(`Webhook: Invalid or missing payment intent ID in session ${session.id} - skipping to prevent duplicate counting`);
            break;
          }
          
          // BACKUP RECONCILIATION: Check if already processed by frontend
          const existingSessionAct = await storage.getActByPaymentIntentId(paymentIntentId as string);
          if (existingSessionAct) {
            console.log(`Webhook: Session ${session.id} already processed by frontend - skipping`);
            break; // Already handled by frontend confirmation
          }
          
          console.log(`Webhook: Processing session ${session.id} as backup reconciliation`);
          
          // Find donation by session ID (stored in stripe_payment_intent_id field incorrectly)
          const sessionDonation = await storage.getDonationByPaymentIntentId(session.id);
          if (sessionDonation) {
            // Update the donation with correct payment intent ID and status
            await storage.updateDonation(sessionDonation.id, {
              stripePaymentIntentId: paymentIntentId as string,
              status: 'succeeded'
            });
            console.log('Webhook: Updated donation with correct payment intent ID');
            
            // Extract metadata from session
            const buttonType = session.metadata?.buttonType || 'active_campaign';
            const amount = session.amount_total || 100;
            
            // Create an act record for tracking
            await storage.createAct({
              userId: null,
              category: 'tzedaka',
              subtype: buttonType,
              amount: amount,
              paymentIntentId: paymentIntentId as string // Store for idempotency
            });
            
            console.log(`Created act record for ${buttonType} completion from checkout session`);

            // Track tzedaka completion in analytics
            await storage.trackEvent({
              eventType: 'tzedaka_completion',
              eventData: {
                buttonType: buttonType,
                amount: amount / 100,
                donationId: sessionDonation.id,
                sessionId: session.id
              },
              sessionId: null
            });

            // Track as modal_complete for Feature Usage
            await storage.trackEvent({
              eventType: 'modal_complete',
              eventData: {
                modalType: 'tzedaka',
                buttonType: buttonType,
                amount: amount / 100,
                donationId: sessionDonation.id
              },
              sessionId: null
            });
            console.log('Tracked checkout donation as modal_complete for Feature Usage');

            // Update campaign progress if this is an active_campaign donation
            if (buttonType === 'active_campaign') {
              try {
                const activeCampaign = await storage.getActiveCampaign();
                if (activeCampaign) {
                  const newAmount = activeCampaign.currentAmount + (amount / 100);
                  await storage.updateCampaignProgress(activeCampaign.id, newAmount);
                  console.log(`Updated campaign progress from checkout: $${newAmount}`);
                }
              } catch (campaignError) {
                console.error('Error updating campaign progress:', campaignError);
              }
            }

            // Recalculate daily stats
            // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
            try {
              await storage.recalculateDailyStats(today);
              console.log('Recalculated daily stats after checkout donation');
            } catch (statsError) {
              console.error('Error recalculating daily stats:', statsError);
            }
          } else {
            console.warn('No donation found for checkout session:', session.id);
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log('Payment failed:', failedPayment.id);
          await storage.updateDonationStatus(failedPayment.id, 'failed');
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Check for recent donation completions (backup endpoint)
  app.get("/api/donations/check-completion/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      console.log('Checking completion for session:', sessionId);
      
      // Check if donation exists and was completed
      const donation = await storage.getDonationBySessionId(sessionId);
      
      if (donation && donation.status === 'succeeded') {
        console.log('Found completed donation:', donation.id);
        
        const metadata = donation.metadata as Record<string, any> || {};
        const buttonType = metadata.buttonType || donation.type || 'put_a_coin';
        
        return res.json({
          completed: true,
          buttonType: buttonType,
          amount: donation.amount,
          timestamp: donation.createdAt
        });
      } else {
        return res.json({ completed: false });
      }
    } catch (error) {
      console.error('Error checking donation completion:', error);
      return res.status(500).json({ completed: false, error: 'Failed to check completion' });
    }
  });

  // Donation success callback - marks individual button as complete
  app.post("/api/donations/success", async (req, res) => {
    console.log('=== DONATIONS SUCCESS ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        console.log('ERROR: No session ID provided');
        return res.status(400).json({ message: "Session ID required" });
      }
      
      console.log('Looking up donation with session ID:', sessionId);
      
      // Get donation by session ID
      const donation = await storage.getDonationBySessionId(sessionId);
      
      console.log('Donation found:', donation ? 'YES' : 'NO');
      if (donation) {
        console.log('Donation details:', {
          id: donation.id,
          amount: donation.amount,
          type: donation.type,
          metadata: donation.metadata
        });
      }
      
      if (!donation) {
        console.log('ERROR: Donation not found in database');
        return res.status(404).json({ message: "Donation not found" });
      }
      
      // Extract button type from metadata
      const metadata = donation.metadata as Record<string, any> || {};
      const buttonType = metadata.buttonType || donation.type || 'put_a_coin';
      
      // Create an act record if it doesn't exist already
      await storage.createAct({
        userId: null,
        category: 'tzedaka',
        subtype: buttonType,
        amount: donation.amount
      });
      
      console.log('SUCCESS: Donation success processing complete');
      console.log('Button type processed:', buttonType);
      
      return res.json({ 
        success: true, 
        buttonType: buttonType,
        message: `${buttonType} completion recorded successfully` 
      });
    } catch (error) {
      console.error('Error processing donation success:', error);
      return res.status(500).json({ message: "Failed to process donation success" });
    }
  });

  // Frontend-driven payment confirmation (idempotent)
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId, sessionId, amount, metadata } = req.body;
      void sessionId; // Mark as used
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }
      
      // Check if we've already processed this payment (idempotency check)
      const existingAct = await storage.getActByPaymentIntentId(paymentIntentId);
      if (existingAct) {
        console.log(`Payment ${paymentIntentId} already processed - checking campaign update`);
        
        // CRITICAL FIX: Still update campaign progress even if act exists
        // This handles race condition where webhook created act but didn't update campaign
        const buttonType = existingAct.subtype || metadata?.buttonType || 'put_a_coin';
        if (buttonType === 'active_campaign') {
          try {
            const activeCampaign = await storage.getActiveCampaign();
            if (activeCampaign) {
              // Check if this specific donation amount was already added to campaign
              // by looking at the donation record and campaign update timestamp
              const donation = await storage.getDonationByPaymentIntentId(paymentIntentId);
              if (donation) {
                const donationAmount = donation.amount / 100; // Convert cents to dollars
                // Only update if campaign was last updated before the donation was created
                // This prevents double-counting
                const campaignLastUpdated = new Date(activeCampaign.updatedAt || 0);
                const donationCreated = new Date(donation.createdAt);
                
                if (campaignLastUpdated < donationCreated) {
                  const newAmount = activeCampaign.currentAmount + donationAmount;
                  await storage.updateCampaignProgress(activeCampaign.id, newAmount);
                  console.log(`Late campaign update: ${activeCampaign.currentAmount} + ${donationAmount} = ${newAmount}`);
                } else {
                  console.log(`Campaign already updated after this donation (${campaignLastUpdated.toISOString()} >= ${donationCreated.toISOString()})`);
                }
              }
            }
          } catch (campaignError) {
            console.error('Error checking/updating campaign for existing payment:', campaignError);
          }
        }
        
        return res.json({ 
          success: true, 
          message: "Payment already processed",
          alreadyProcessed: true 
        });
      }
      
      // Create donation record if not exists
      let donation = await storage.getDonationByPaymentIntentId(paymentIntentId);
      if (!donation && sessionId) {
        donation = await storage.getDonationBySessionId(sessionId);
      }
      
      if (!donation) {
        // Create new donation record
        donation = await storage.createDonation({
          userId: null,
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: sessionId,
          amount: amount || 100, // Amount in cents
          type: metadata?.buttonType || "put_a_coin",
          donationType: metadata?.donationType || "General Donation",
          sponsorName: metadata?.sponsorName,
          dedication: metadata?.dedication,
          email: metadata?.email,
          metadata: metadata || {},
          status: 'succeeded'
        });
      } else if (donation.status !== 'succeeded') {
        // Update existing donation to succeeded
        await storage.updateDonationStatus(paymentIntentId, 'succeeded');
      }
      
      // Create act record with payment_intent_id for idempotency
      const buttonType = metadata?.buttonType || donation.type || 'put_a_coin';
      await storage.createAct({
        userId: null,
        category: 'tzedaka',
        subtype: buttonType,
        amount: amount || donation.amount,
        paymentIntentId: paymentIntentId // Store for idempotency
      });
      
      // Update daily stats
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      
      const stats = await storage.getDailyStats(today);
      const amountInCents = amount || donation.amount;
      const amountInDollars = amountInCents / 100; // Convert cents to dollars for financial tracking
      
      const updated: any = {
        tzedakaActs: (stats?.tzedakaActs || 0) + 1,
        moneyRaised: (stats?.moneyRaised || 0) + amountInDollars, // Fixed: Convert to dollars
        totalActs: (stats?.totalActs || 0) + 1
      };
      
      // Update specific donation type counter (in dollars)
      if (buttonType === 'active_campaign') {
        updated.activeCampaignTotal = (stats?.activeCampaignTotal || 0) + amountInDollars;
      } else if (buttonType === 'put_a_coin') {
        updated.putACoinTotal = (stats?.putACoinTotal || 0) + amountInDollars;
      } else if (buttonType === 'sponsor_a_day') {
        updated.sponsorADayTotal = (stats?.sponsorADayTotal || 0) + amountInDollars;
      }
      
      await storage.updateDailyStats(today, updated);
      
      // Track analytics events for proper statistics
      await storage.trackEvent({
        eventType: 'tzedaka_completion',
        eventData: {
          buttonType: buttonType,
          amount: amountInDollars,
          paymentIntentId: paymentIntentId,
          date: today
        },
        sessionId: metadata?.sessionId || null
      });
      
      // Track as modal_complete for Feature Usage display
      await storage.trackEvent({
        eventType: 'modal_complete',
        eventData: {
          modalType: 'tzedaka',
          buttonType: buttonType,
          amount: amountInDollars,
          paymentIntentId: paymentIntentId,
          date: today
        },
        sessionId: metadata?.sessionId || null
      });
      
      // Update campaign progress if this is an active_campaign donation
      if (buttonType === 'active_campaign') {
        try {
          const activeCampaign = await storage.getActiveCampaign();
          if (activeCampaign) {
            const donationAmount = (amount || donation.amount) / 100; // Convert cents to dollars
            const newAmount = activeCampaign.currentAmount + donationAmount;
            await storage.updateCampaignProgress(activeCampaign.id, newAmount);
            console.log(`Campaign updated to ${newAmount}/${activeCampaign.goalAmount}`);
          }
        } catch (campaignError) {
          console.error('Error updating campaign progress:', campaignError);
        }
      }
      
      console.log(`Payment ${paymentIntentId} confirmed and stats updated`);
      
      return res.json({ 
        success: true, 
        message: "Payment confirmed successfully",
        buttonType: buttonType
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      return res.status(500).json({ message: "Failed to confirm payment" });
    }
  });
  
  // Manual donation success update (for testing when webhook isn't configured)
  app.post("/api/donations/update-status", async (req, res) => {
    try {
      const { paymentIntentId, status } = req.body;
      
      if (!paymentIntentId || !status) {
        return res.status(400).json({ message: "Payment intent ID and status required" });
      }
      
      // First check if donation exists
      let donation = await storage.getDonationByPaymentIntentId(paymentIntentId);
      
      if (donation) {
        // Update existing donation status
        donation = await storage.updateDonationStatus(paymentIntentId, status);
      } else if (status === 'succeeded') {
        // Only create donation record if payment succeeded
        // Get payment intent details from Stripe to get accurate amount and metadata
        try {
          if (!stripe) {
            console.warn('Stripe not configured - cannot retrieve payment intent details');
            // Fallback - create with minimal info
            donation = await storage.createDonation({
              userId: null,
              stripePaymentIntentId: paymentIntentId,
              amount: 100, // Default $1
              type: "put_a_coin",
              donationType: "General Donation",
              status: status
            });
            return res.json({ success: true, message: "Donation recorded (Stripe unavailable)", donation });
          }
          
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          donation = await storage.createDonation({
            userId: null,
            stripePaymentIntentId: paymentIntentId,
            stripeSessionId: paymentIntent.metadata?.sessionId,
            amount: paymentIntent.amount, // Amount in cents from Stripe
            type: paymentIntent.metadata?.buttonType || "put_a_coin",
            donationType: paymentIntent.metadata?.donationType || "General Donation",
            sponsorName: paymentIntent.metadata?.sponsorName,
            dedication: paymentIntent.metadata?.dedication,
            email: paymentIntent.receipt_email || paymentIntent.metadata?.email,
            metadata: {
              buttonType: paymentIntent.metadata?.buttonType || "put_a_coin",
              sponsorName: paymentIntent.metadata?.sponsorName || "",
              dedication: paymentIntent.metadata?.dedication || "",
              message: paymentIntent.metadata?.message || "",
              source: "ezras-nashim-donation",
              timestamp: new Date().toISOString()
            },
            status: 'succeeded'
          });
          
          // Create an act record for tracking individual button completion
          await storage.createAct({
            userId: null,
            category: 'tzedaka',
            subtype: paymentIntent.metadata?.buttonType || 'put_a_coin',
            amount: paymentIntent.amount
          });
          
          console.log('Created donation record and act for successful payment:', paymentIntentId);
        } catch (err) {
          console.error('Error retrieving payment intent from Stripe:', err);
          // Fallback - create with minimal info
          donation = await storage.createDonation({
            userId: null,
            stripePaymentIntentId: paymentIntentId,
            amount: 100, // Default $1
            type: "put_a_coin",
            donationType: "General Donation",
            status: status
          });
        }
      } else {
        // Don't create donation records for failed/pending payments
        console.log(`Skipping donation creation for ${status} payment:`, paymentIntentId);
        return res.json({ message: `Payment status: ${status}`, created: false });
      }
      
      return res.json({ message: "Donation status updated", donation });
    } catch (error) {
      console.error('Error updating donation status:', error);
      return res.status(500).json({ message: "Failed to update donation status" });
    }
  });

  // Offline bootstrap endpoint - Essential content for offline access
  app.get("/api/offline/bootstrap", async (_req, res) => {
    try {
      // Gather essential content for offline access
      const [
        morningPrayers,
        minchaPrayers,
        maarivPrayers,
        brochas,
        nishmasHebrew,
        nishmasEnglish
      ] = await Promise.all([
        storage.getMorningPrayers(),
        storage.getMinchaPrayers(),
        storage.getMaarivPrayers(),
        storage.getBrochas(),
        storage.getNishmasTextByLanguage('hebrew'),
        storage.getNishmasTextByLanguage('english')
      ]);

      // Set long cache headers for offline content
      res.set({
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'Content-Type': 'application/json'
      });

      return res.json({
        timestamp: new Date().toISOString(),
        prayers: {
          morning: morningPrayers,
          mincha: minchaPrayers,
          maariv: maarivPrayers
        },
        brochas,
        nishmas: {
          hebrew: nishmasHebrew,
          english: nishmasEnglish
        }
      });
    } catch (error) {
      console.error('Error getting offline bootstrap:', error);
      return res.status(500).json({ message: "Failed to get offline content" });
    }
  });

  // Jewish events API endpoint for Events page
  app.get("/api/events/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      // Get current date and calculate date range (6 months past, 12 months future)
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setMonth(pastDate.getMonth() - 6);
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + 12);

      const startDate = pastDate.toISOString().split('T')[0];
      const endDate = futureDate.toISOString().split('T')[0];

      // Fetch events from Hebcal with specified categories
      const eventsUrl = `https://www.hebcal.com/hebcal?v=1&cfg=json&start=${startDate}&end=${endDate}&maj=on&min=on&nx=on&geo=pos&latitude=${latitude}&longitude=${longitude}`;
      
      const eventsResponse = await serverAxiosClient.get(eventsUrl);

      if (eventsResponse.data && eventsResponse.data.items) {
        // Filter and process events
        const filteredEvents = eventsResponse.data.items.filter((item: any) => {
          const title = (item.title || '').toLowerCase();
          const memo = (item.memo || '').toLowerCase();
          
          // Skip fast end/begin events
          if (title.includes('fast ends') || title.includes('fast begins')) {
            return false;
          }
          
          // Skip standalone candle lighting and havdalah unless they're for holidays/fasts
          if (item.category === 'candles' || item.category === 'havdalah') {
            // Only include if it's for a holiday or fast
            return memo.includes('holiday') || memo.includes('fast') || 
                   title.includes('erev') || title.includes('yom kippur') || 
                   title.includes('rosh hashana') || title.includes('pesach') ||
                   title.includes('sukkot') || title.includes('shavuot') ||
                   memo.includes('chanukah') || memo.includes('purim');
          }
          return true;
        });

        // Process and sort events
        const events = filteredEvents.map((item: any) => ({
          title: item.title || '',
          hebrew: item.hebrew || '',
          date: item.date,
          hdate: item.hdate || '',
          category: item.category || '',
          subcat: item.subcat || '',
          memo: item.memo || '',
          yomtov: item.yomtov || false,
          link: item.link || ''
        })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return res.json({
          events,
          location: eventsResponse.data.location || null
        });
      } else {
        return res.json({ events: [], location: null });
      }
    } catch (error) {
      console.error('Error fetching Jewish events:', error);
      return res.status(500).json({ message: "Failed to fetch Jewish events" });
    }
  });

  // Batched homepage data endpoint - reduces initial load requests
  // Now includes: message, sponsor, todaysSpecial (3 calls → 1)
  app.get("/api/home-summary", async (req, res) => {
    try {
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD format)" });
      }

      const errors: { field: string; error: string }[] = [];
      
      // Fetch all data in parallel with individual error handling
      const [message, sponsor, todaysSpecial] = await Promise.allSettled([
        storage.getMessageByDate(date),
        storage.getDailySponsor(date),
        storage.getTodaysSpecialByDate(date)
      ]);

      // Track any errors
      if (message.status === 'rejected') {
        errors.push({ field: 'message', error: message.reason?.message || 'Failed to fetch message' });
      }
      if (sponsor.status === 'rejected') {
        errors.push({ field: 'sponsor', error: sponsor.reason?.message || 'Failed to fetch sponsor' });
      }
      if (todaysSpecial.status === 'rejected') {
        errors.push({ field: 'todaysSpecial', error: todaysSpecial.reason?.message || 'Failed to fetch today\'s special' });
      }

      const summary = {
        message: message.status === 'fulfilled' ? message.value : null,
        sponsor: sponsor.status === 'fulfilled' ? sponsor.value : null,
        todaysSpecial: todaysSpecial.status === 'fulfilled' ? todaysSpecial.value : null,
        errors: errors.length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Set caching: 2 minutes for messages (check frequently)
      res.set({
        'Cache-Control': 'public, max-age=120', // 2 minutes
      });

      return res.json(summary);
    } catch (error) {
      console.error('Error fetching home summary:', error);
      return res.status(500).json({ error: "Failed to fetch home summary" });
    }
  });

  // Torah Summary - Batched endpoint for all Torah section data
  app.get("/api/torah-summary", async (req, res) => {
    try {
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD format)" });
      }

      // Check server-side cache first (5 minute TTL)
      const cacheKey = `torah-summary:${date}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        res.set({ 'Cache-Control': 'public, max-age=300' });
        return res.json(cached);
      }

      // Fetch all Torah data in parallel with individual error tracking
      const [halacha, chizuk, emuna, featured, pirkeiAvot, parshaVorts, torahClasses, gemsOfGratitude] = await Promise.allSettled([
        storage.getDailyHalachaByDate(date),
        storage.getDailyChizukByDate(date),
        storage.getDailyEmunaByDate(date),
        storage.getFeaturedContentByDate(date),
        storage.getCurrentPirkeiAvot(),
        storage.getParshaVortsByDate(date),
        storage.getTorahClassesByDate(date),
        storage.getGemsOfGratitudeByDate(date)
      ]);

      // Track per-section errors for UI fallback messages
      const errors: Record<string, boolean> = {};
      if (halacha.status === 'rejected') errors.halacha = true;
      if (chizuk.status === 'rejected') errors.chizuk = true;
      if (emuna.status === 'rejected') errors.emuna = true;
      if (featured.status === 'rejected') errors.featured = true;
      if (pirkeiAvot.status === 'rejected') errors.pirkeiAvot = true;
      if (parshaVorts.status === 'rejected') errors.parshaVorts = true;
      if (torahClasses.status === 'rejected') errors.torahClasses = true;
      if (gemsOfGratitude.status === 'rejected') errors.gemsOfGratitude = true;

      // Format Pirkei Avot response to match existing /api/torah/pirkei-avot/:date API
      let formattedPirkeiAvot = null;
      if (pirkeiAvot.status === 'fulfilled' && pirkeiAvot.value) {
        formattedPirkeiAvot = {
          text: pirkeiAvot.value.content,
          chapter: pirkeiAvot.value.chapter,
          source: `${pirkeiAvot.value.chapter}.${pirkeiAvot.value.perek}`
        };
      }

      const summary = {
        halacha: halacha.status === 'fulfilled' ? halacha.value : null,
        chizuk: chizuk.status === 'fulfilled' ? chizuk.value : null,
        emuna: emuna.status === 'fulfilled' ? emuna.value : null,
        featured: featured.status === 'fulfilled' ? featured.value : null,
        pirkeiAvot: formattedPirkeiAvot,
        parshaVorts: parshaVorts.status === 'fulfilled' ? parshaVorts.value : [],
        torahClasses: torahClasses.status === 'fulfilled' ? torahClasses.value : [],
        gemsOfGratitude: gemsOfGratitude.status === 'fulfilled' ? gemsOfGratitude.value : null,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result for 5 minutes
      cache.set(cacheKey, summary, { ttl: 300 });

      // Set HTTP caching: 5 minutes for Torah content
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
      });

      return res.json(summary);
    } catch (error) {
      console.error('Error fetching torah summary:', error);
      return res.status(500).json({ error: "Failed to fetch torah summary" });
    }
  });

  // Tzedaka Summary - Batched endpoint for all Tzedaka section data
  app.get("/api/tzedaka-summary", async (req, res) => {
    try {
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD format)" });
      }

      // Check server-side cache first (5 minute TTL)
      const cacheKey = `tzedaka-summary:${date}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        res.set({ 'Cache-Control': 'public, max-age=300' });
        return res.json(cached);
      }

      // Fetch all Tzedaka data in parallel
      const [campaign, communityImpact] = await Promise.allSettled([
        storage.getActiveCampaign(),
        storage.getCommunityImpactByDate(date)
      ]);

      // Track per-section errors
      const errors: Record<string, boolean> = {};
      if (campaign.status === 'rejected') errors.campaign = true;
      if (communityImpact.status === 'rejected') errors.communityImpact = true;

      const summary = {
        campaign: campaign.status === 'fulfilled' ? campaign.value : null,
        communityImpact: communityImpact.status === 'fulfilled' ? communityImpact.value : null,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result for 5 minutes
      cache.set(cacheKey, summary, { ttl: 300 });

      res.set({ 'Cache-Control': 'public, max-age=300' });
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching tzedaka summary:', error);
      return res.status(500).json({ error: "Failed to fetch tzedaka summary" });
    }
  });

  // Tefilla Stats Summary - Batched endpoint for Tehillim chain statistics
  app.get("/api/tefilla-stats", async (_req, res) => {
    try {
      // Check server-side cache first (1 minute TTL for stats)
      const cacheKey = 'tefilla-stats';
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        res.set({ 'Cache-Control': 'public, max-age=60' });
        return res.json(cached);
      }

      // Fetch all stats in parallel
      const [totalStats, globalStats] = await Promise.allSettled([
        storage.getTotalChainTehillimCompleted(),
        storage.getTehillimGlobalStats()
      ]);

      // Track per-section errors
      const errors: Record<string, boolean> = {};
      if (totalStats.status === 'rejected') errors.totalStats = true;
      if (globalStats.status === 'rejected') errors.globalStats = true;

      const summary = {
        total: totalStats.status === 'fulfilled' ? totalStats.value || 0 : 0,
        globalStats: globalStats.status === 'fulfilled' ? globalStats.value : null,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result for 1 minute (stats update more frequently)
      cache.set(cacheKey, summary, { ttl: 60 });

      res.set({ 'Cache-Control': 'public, max-age=60' });
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching tefilla stats:', error);
      return res.status(500).json({ error: "Failed to fetch tefilla stats" });
    }
  });

  // Table Summary - Batched endpoint for all Table section data
  app.get("/api/table-summary", async (req, res) => {
    try {
      const date = req.query.date as string;
      const dayOfWeek = parseInt(req.query.dayOfWeek as string);
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD format)" });
      }
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ error: "dayOfWeek parameter required (0-6)" });
      }

      // Check server-side cache first (5 minute TTL)
      const cacheKey = `table-summary:${date}:${dayOfWeek}`;
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        res.set({ 'Cache-Control': 'public, max-age=300' });
        return res.json(cached);
      }

      // Fetch all Table data in parallel with individual error tracking
      const [giftOfChatzos, lifeClasses, inspiration, recipe, shopItems] = await Promise.allSettled([
        storage.getGiftOfChatzosByDayOfWeek(dayOfWeek),
        storage.getLifeClassesByDate(date),
        storage.getTableInspirationByDate(date),
        storage.getDailyRecipeByDate(date),
        storage.getAllShopItems()
      ]);

      // Track per-section errors for UI fallback messages
      const errors: Record<string, boolean> = {};
      if (giftOfChatzos.status === 'rejected') errors.giftOfChatzos = true;
      if (lifeClasses.status === 'rejected') errors.lifeClasses = true;
      if (inspiration.status === 'rejected') errors.inspiration = true;
      if (recipe.status === 'rejected') errors.recipe = true;
      if (shopItems.status === 'rejected') errors.shopItems = true;

      const summary = {
        giftOfChatzos: giftOfChatzos.status === 'fulfilled' ? giftOfChatzos.value : null,
        lifeClasses: lifeClasses.status === 'fulfilled' ? lifeClasses.value : [],
        inspiration: inspiration.status === 'fulfilled' ? inspiration.value : null,
        recipe: recipe.status === 'fulfilled' ? recipe.value : null,
        shopItems: shopItems.status === 'fulfilled' ? shopItems.value : [],
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result for 5 minutes
      cache.set(cacheKey, summary, { ttl: 300 });

      // Set HTTP caching: 5 minutes for Table content
      res.set({
        'Cache-Control': 'public, max-age=300',
      });

      return res.json(summary);
    } catch (error) {
      console.error('Error fetching table summary:', error);
      return res.status(500).json({ error: "Failed to fetch table summary" });
    }
  });

  // Messages routes - Public endpoint for fetching messages by date (no auth required)
  app.get("/api/messages/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const message = await storage.getMessageByDate(date);
      
      if (!message) {
        return res.status(404).json({ message: "No message found for this date" });
      }
      
      return res.json(message);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch message" });
    }
  });
  
  // Admin-only endpoints - require authentication
  app.post("/api/messages", requireAdminAuth, async (req, res) => {
    try {
      // Validate request body with Zod schema
      const validatedData = insertMessagesSchema.parse(req.body);
      const newMessage = await storage.createMessage(validatedData);
      return res.status(201).json(newMessage);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: error.errors 
        });
      }
      console.error("Error creating message:", error);
      return res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages", requireAdminAuth, async (req, res) => {
    try {
      const { upcoming } = req.query;
      const messages = upcoming === 'true' 
        ? await storage.getUpcomingMessages()
        : await storage.getAllMessages();
      return res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put("/api/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Validate request body with Zod schema (insertMessagesSchema already omits id and timestamps)
      const validatedData = insertMessagesSchema.parse(req.body);
      const updatedMessage = await storage.updateMessage(parseInt(id), validatedData);
      return res.json(updatedMessage);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: error.errors 
        });
      }
      console.error("Error updating message:", error);
      return res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete("/api/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessage(parseInt(id));
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      return res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Feed routes - Public endpoints for accessing the message feed
  app.get("/api/feed", async (_req, res) => {
    try {
      // Disable caching to ensure fresh vote counts
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const allMessages = await storage.getAllMessages();
      const today = new Date().toISOString().split('T')[0];
      
      // Sort: pinned first, then today's message, then by date descending
      allMessages.sort((a, b) => {
        // Pinned messages always first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Today's message comes next (if not pinned)
        const aIsToday = a.date === today;
        const bIsToday = b.date === today;
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        
        // Then sort by date descending
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      return res.json(allMessages);
    } catch (error) {
      console.error("Error fetching feed:", error);
      return res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // Like/dislike routes for feed messages
  app.post("/api/feed/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMessage = await storage.incrementMessageLike(parseInt(id));
      return res.json(updatedMessage);
    } catch (error) {
      console.error("Error liking message:", error);
      return res.status(500).json({ message: "Failed to like message" });
    }
  });

  app.post("/api/feed/:id/dislike", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMessage = await storage.incrementMessageDislike(parseInt(id));
      return res.json(updatedMessage);
    } catch (error) {
      console.error("Error disliking message:", error);
      return res.status(500).json({ message: "Failed to dislike message" });
    }
  });

  app.delete("/api/feed/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMessage = await storage.decrementMessageLike(parseInt(id));
      return res.json(updatedMessage);
    } catch (error) {
      console.error("Error removing like:", error);
      return res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.delete("/api/feed/:id/dislike", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedMessage = await storage.decrementMessageDislike(parseInt(id));
      return res.json(updatedMessage);
    } catch (error) {
      console.error("Error removing dislike:", error);
      return res.status(500).json({ message: "Failed to remove dislike" });
    }
  });

  // Pin/unpin message routes (admin only)
  app.post("/api/messages/:id/pin", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const pinnedMessage = await storage.pinMessage(parseInt(id));
      return res.json(pinnedMessage);
    } catch (error) {
      console.error("Error pinning message:", error);
      return res.status(500).json({ message: "Failed to pin message" });
    }
  });

  app.delete("/api/messages/:id/pin", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.unpinMessage(parseInt(id));
      return res.json({ success: true });
    } catch (error) {
      console.error("Error unpinning message:", error);
      return res.status(500).json({ message: "Failed to unpin message" });
    }
  });

  // Scheduled Notification endpoints (admin-only)
  app.get("/api/scheduled-notifications", requireAdminAuth, async (_req, res) => {
    try {
      const notifications = await storage.getAllScheduledNotifications();
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      return res.status(500).json({ message: "Failed to fetch scheduled notifications" });
    }
  });

  app.get("/api/scheduled-notifications/upcoming", requireAdminAuth, async (_req, res) => {
    try {
      const notifications = await storage.getUpcomingScheduledNotifications();
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching upcoming scheduled notifications:", error);
      return res.status(500).json({ message: "Failed to fetch upcoming scheduled notifications" });
    }
  });

  app.get("/api/scheduled-notifications/pending", requireAdminAuth, async (_req, res) => {
    try {
      const notifications = await storage.getPendingScheduledNotifications();
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching pending scheduled notifications:", error);
      return res.status(500).json({ message: "Failed to fetch pending scheduled notifications" });
    }
  });

  app.post("/api/scheduled-notifications", requireAdminAuth, async (req, res) => {
    try {
      const { insertScheduledNotificationSchema } = await import("../shared/schema");
      const validatedData = insertScheduledNotificationSchema.parse(req.body);
      const newNotification = await storage.createScheduledNotification(validatedData);
      return res.json(newNotification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: error.errors 
        });
      }
      console.error("Error creating scheduled notification:", error);
      return res.status(500).json({ message: "Failed to create scheduled notification" });
    }
  });

  app.put("/api/scheduled-notifications/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertScheduledNotificationSchema } = await import("../shared/schema");
      const updateSchema = insertScheduledNotificationSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      // Filter out undefined values for exactOptionalPropertyTypes compatibility
      const cleanedData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, v]) => v !== undefined)
      );
      const updatedNotification = await storage.updateScheduledNotification(parseInt(id), cleanedData as any);
      return res.json(updatedNotification);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: error.errors 
        });
      }
      console.error("Error updating scheduled notification:", error);
      return res.status(500).json({ message: "Failed to update scheduled notification" });
    }
  });

  app.delete("/api/scheduled-notifications/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteScheduledNotification(parseInt(id));
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled notification:", error);
      return res.status(500).json({ message: "Failed to delete scheduled notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
