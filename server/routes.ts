import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { and, eq, gt } from "drizzle-orm";
import serverAxiosClient from "./axiosClient";
import path from "path";
import { fileURLToPath } from "url";
import { find as findTimezone } from "geo-tz";
import webpush from "web-push";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { pushRetryQueue, PushRetryQueue } from "./pushRetryQueue";
import { cacheMiddleware } from "./middleware/cache";
import { CACHE_TTL, cache } from "./cache/categoryCache";

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
const __dirname = path.dirname(__filename);

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
  insertTehillimNameSchema,
  insertTehillimChainSchema,
  insertTehillimChainReadingSchema,
  tehillimChains,
  tehillimChainReadings,
  insertDailyHalachaSchema,
  insertDailyEmunaSchema,
  insertDailyChizukSchema,
  insertFeaturedContentSchema,
  insertDailyRecipeSchema,
  baseParshaVortSchema,
  insertParshaVortSchema,
  insertTableInspirationSchema,
  insertMarriageInsightSchema,
  insertNishmasTextSchema,
  insertMessagesSchema
} from "../shared/schema";
import { z } from "zod";

// Admin authentication middleware
function requireAdminAuth(req: any, res: any, next: any) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return res.status(500).json({ 
      message: "Admin authentication not configured" 
    });
  }
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!token || token !== adminPassword) {
    return res.status(401).json({ 
      message: "Unauthorized: Invalid admin credentials" 
    });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Schedule periodic cleanup of expired names (every hour)
  setInterval(async () => {
    try {
      await storage.cleanupExpiredNames();
      // Cleaned up expired Tehillim names
    } catch (error) {
      // Error cleaning up expired names
    }
  }, 60 * 60 * 1000); // Run every hour

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
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(icsContent).toString());
      
      res.send(icsContent);
      
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

      res.json(formattedTimes);
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

      res.json({
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

      res.json(result);
    } catch (error) {
      // Error fetching Shabbos times
      return res.status(500).json({ message: "Failed to fetch Shabbos times from Hebcal API" });
    }
  });

  // Sefaria API proxy route for Morning Brochas
  app.get("/api/sefaria/morning-brochas", async (req, res) => {
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

      res.json(validBlessings);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Error fetching morning brochas from Sefaria
      }
      res.status(500).json({ message: "Failed to fetch morning brochas from Sefaria API" });
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
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(icsContent);
      
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
  app.get("/api/shop", async (req, res) => {
    try {
      const items = await storage.getAllShopItems();
      res.json(items);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  app.get("/api/shop/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop item ID" });
      }
      const item = await storage.getShopItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Shop item not found" });
      }
      res.json(item);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch shop item" });
    }
  });

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
      
      res.json(data);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch from Hebcal API" });
    }
  });

  // Table inspiration routes
  app.get("/api/table/inspiration/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const inspiration = await storage.getTableInspirationByDate(date);
      res.json(inspiration || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch table inspiration" });
    }
  });

  app.post("/api/table/inspiration", requireAdminAuth, async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Inspiration creation request body:", req.body);
      }
      const validatedData = insertTableInspirationSchema.parse(req.body);
      if (process.env.NODE_ENV === 'development') {
        console.log("Inspiration validated data:", validatedData);
      }
      const inspiration = await storage.createTableInspiration(validatedData);
      res.json(inspiration);
    } catch (error) {
      console.error("Failed to create table inspiration:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: "Failed to create table inspiration", error: error.message });
      } else {
        return res.status(500).json({ message: "Failed to create table inspiration", error: String(error) });
      }
    }
  });

  // Get all table inspirations
  app.get("/api/table/inspirations", requireAdminAuth, async (req, res) => {
    try {
      const inspirations = await storage.getAllTableInspirations();
      res.json(inspirations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch table inspirations" });
    }
  });

  // Update table inspiration
  app.put("/api/table/inspiration/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (process.env.NODE_ENV === 'development') {
        console.log("Inspiration update request body:", req.body);
      }
      const validatedData = insertTableInspirationSchema.parse(req.body);
      if (process.env.NODE_ENV === 'development') {
        console.log("Inspiration validated data:", validatedData);
      }
      const inspiration = await storage.updateTableInspiration(id, validatedData);
      if (!inspiration) {
        return res.status(404).json({ message: "Table inspiration not found" });
      }
      res.json(inspiration);
    } catch (error) {
      console.error("Failed to update table inspiration:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: "Failed to update table inspiration", error: error.message });
      } else {
        return res.status(500).json({ message: "Failed to update table inspiration", error: String(error) });
      }
    }
  });

  // Delete table inspiration
  app.delete("/api/table/inspiration/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTableInspiration(id);
      if (!success) {
        return res.status(404).json({ message: "Table inspiration not found" });
      }
      res.json({ message: "Table inspiration deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete table inspiration" });
    }
  });

  // Marriage Insights routes
  app.get("/api/marriage-insights/:date", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'marriage-insights' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const insight = await storage.getMarriageInsightByDate(date);
        res.json(insight || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch marriage insight" });
      }
    }
  );

  app.post("/api/marriage-insights", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertMarriageInsightSchema.parse(req.body);
      const insight = await storage.createMarriageInsight(validatedData);
      cache.clearCategory('marriage-insights');
      res.json(insight);
    } catch (error) {
      console.error("Failed to create marriage insight:", error);
      return res.status(500).json({ message: "Failed to create marriage insight" });
    }
  });

  app.get("/api/marriage-insights", requireAdminAuth, async (req, res) => {
    try {
      const insights = await storage.getAllMarriageInsights();
      res.json(insights);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch marriage insights" });
    }
  });

  app.patch("/api/marriage-insights/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMarriageInsightSchema.partial().parse(req.body);
      const insight = await storage.updateMarriageInsight(id, validatedData);
      if (!insight) {
        return res.status(404).json({ message: "Marriage insight not found" });
      }
      cache.clearCategory('marriage-insights');
      res.json(insight);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update marriage insight" });
    }
  });

  app.delete("/api/marriage-insights/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMarriageInsight(id);
      if (!success) {
        return res.status(404).json({ message: "Marriage insight not found" });
      }
      cache.clearCategory('marriage-insights');
      res.json({ message: "Marriage insight deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete marriage insight" });
    }
  });

  // Object storage endpoints for file uploads
  app.post("/api/objects/upload", requireAdminAuth, async (req, res) => {
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
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting upload URL:', error);
      
      res.status(500).json({ 
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
      objectStorageService.downloadObject(objectFile, res);
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

      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting object ACL:", error);
      
      res.status(500).json({ 
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

      res.status(200).json({ objectPath });
    } catch (error: any) {
      console.error("Error setting object ACL:", error);
      
      res.status(500).json({ 
        error: "Internal server error",
        message: error.message || "Failed to process object upload"
      });
    }
  });

  // Community impact routes
  app.get("/api/community/impact/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const impact = await storage.getCommunityImpactByDate(date);
      res.json(impact || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  // Mincha routes
  app.get("/api/mincha/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-mincha' }),
    async (req, res) => {
      try {
        const prayers = await storage.getMinchaPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Mincha prayers" });
      }
    }
  );

  app.get("/api/mincha/prayer", async (req, res) => {
    try {
      const prayers = await storage.getMinchaPrayers();
      res.json(prayers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Mincha prayers" });
    }
  });

  // Morning prayer routes
  app.get("/api/morning/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-morning' }),
    async (req, res) => {
      try {
        const prayers = await storage.getMorningPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Morning prayers" });
      }
    }
  );

  // Maariv routes
  app.get("/api/maariv/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-maariv' }),
    async (req, res) => {
      try {
        const prayers = await storage.getMaarivPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Maariv prayers" });
      }
    }
  );

  app.get("/api/maariv/prayer", async (req, res) => {
    try {
      const prayers = await storage.getMaarivPrayers();
      res.json(prayers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Maariv prayers" });
    }
  });

  // After Brochas routes
  app.get("/api/after-brochas/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-after-brochas' }),
    async (req, res) => {
      try {
        const prayers = await storage.getAfterBrochasPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch After Brochas prayers" });
      }
    }
  );

  app.post("/api/after-brochas/prayers", requireAdminAuth, async (req, res) => {
    try {
      const prayer = await storage.createAfterBrochasPrayer(req.body);
      res.json(prayer);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create After Brochas prayer" });
    }
  });

  // Brochas routes
  app.get("/api/brochas", async (req, res) => {
    try {
      const brochas = await storage.getBrochas();
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching brochas:", error);
      return res.status(500).json({ message: "Failed to fetch brochas" });
    }
  });

  app.get("/api/brochas/daily", async (req, res) => {
    try {
      const brochas = await storage.getBrochasByType(false); // false = daily (not special)
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching daily brochas:", error);
      return res.status(500).json({ message: "Failed to fetch daily brochas" });
    }
  });

  app.get("/api/brochas/special", async (req, res) => {
    try {
      const brochas = await storage.getBrochasByType(true); // true = special occasions
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching special brochas:", error);
      return res.status(500).json({ message: "Failed to fetch special brochas" });
    }
  });

  // Get individual brocha by ID
  app.get("/api/brochas/:id", async (req, res) => {
    try {
      const brochaId = parseInt(req.params.id);
      if (isNaN(brochaId)) {
        return res.status(400).json({ message: "Invalid brocha ID" });
      }
      const brocha = await storage.getBrochaById(brochaId);
      if (!brocha) {
        return res.status(404).json({ message: "Brocha not found" });
      }
      res.json(brocha);
    } catch (error) {
      console.error("Error fetching brocha:", error);
      return res.status(500).json({ message: "Failed to fetch brocha" });
    }
  });

  app.post("/api/brochas", requireAdminAuth, async (req, res) => {
    try {
      const brocha = await storage.createBrocha(req.body);
      res.json(brocha);
    } catch (error) {
      console.error("Error creating brocha:", error);
      return res.status(500).json({ message: "Failed to create brocha" });
    }
  });

  // Birkat Hamazon routes
  app.get("/api/birkat-hamazon/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-birkat-hamazon' }),
    async (req, res) => {
      try {
        const prayers = await storage.getBirkatHamazonPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Birkat Hamazon prayers" });
      }
    }
  );

  app.post("/api/birkat-hamazon/prayers", requireAdminAuth, async (req, res) => {
    try {
      const prayer = await storage.createBirkatHamazonPrayer(req.body);
      res.json(prayer);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create Birkat Hamazon prayer" });
    }
  });

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
      
      res.json(sponsor || null);
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
      
      res.json(sponsor || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch daily sponsor" });
    }
  });

  app.get("/api/sponsors", async (req, res) => {
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
      
      res.json(sponsors);
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
      
      res.json(sponsor);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaign = await storage.getActiveCampaign();
      res.json(campaign || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch active campaign" });
    }
  });

  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", requireAdminAuth, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Daily Torah content routes
  app.get("/api/torah/halacha/:date", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-halacha' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const halacha = await storage.getDailyHalachaByDate(date);
        res.json(halacha || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily halacha" });
      }
    }
  );

  app.post("/api/torah/halacha", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertDailyHalachaSchema.parse(req.body);
      const halacha = await storage.createDailyHalacha(validatedData);
      cache.clearCategory('torah-halacha');
      res.json(halacha);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create daily halacha" });
    }
  });

  app.get("/api/torah/emuna/:date",
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-emuna' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const emuna = await storage.getDailyEmunaByDate(date);
        res.json(emuna || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily emuna" });
      }
    }
  );

  app.post("/api/torah/emuna", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertDailyEmunaSchema.parse(req.body);
      const emuna = await storage.createDailyEmuna(validatedData);
      cache.clearCategory('torah-emuna');
      res.json(emuna);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create daily emuna" });
    }
  });

  app.get("/api/torah/chizuk/:date",
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-chizuk' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const chizuk = await storage.getDailyChizukByDate(date);
        res.json(chizuk || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily chizuk" });
      }
    }
  );

  app.post("/api/torah/chizuk", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertDailyChizukSchema.parse(req.body);
      const chizuk = await storage.createDailyChizuk(validatedData);
      cache.clearCategory('torah-chizuk');
      res.json(chizuk);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create daily chizuk" });
    }
  });

  app.get("/api/torah/featured/:date",
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-featured' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        const featured = await storage.getFeaturedContentByDate(date);
        res.json(featured || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch featured content" });
      }
    }
  );

  app.post("/api/torah/featured", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertFeaturedContentSchema.parse(req.body);
      const featured = await storage.createFeaturedContent(validatedData);
      cache.clearCategory('torah-featured');
      res.json(featured);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create featured content" });
    }
  });

  app.get("/api/torah/pirkei-avot/:date",
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'pirkei-avot' }),
    async (req, res) => {
      try {
        const { date } = req.params;
        // Get the current Pirkei Avot content from the database
        const currentPirkeiAvot = await storage.getCurrentPirkeiAvot();
        
        if (currentPirkeiAvot) {
          // Return formatted response similar to other Torah content
          res.json({
            text: currentPirkeiAvot.content,
            chapter: currentPirkeiAvot.chapter,
            source: `${currentPirkeiAvot.chapter}.${currentPirkeiAvot.perek}`
          });
        } else {
          res.json(null);
        }
      } catch (error) {
        console.error('Error fetching Pirkei Avot:', error);
        return res.status(500).json({ message: "Failed to fetch Pirkei Avot content" });
      }
    }
  );

  app.post("/api/torah/pirkei-avot/advance", requireAdminAuth, async (req, res) => {
    try {
      const progress = await storage.advancePirkeiAvotProgress();
      cache.clearCategory('pirkei-avot');
      cache.clearCategory('pirkei-avot-all');
      res.json(progress);
    } catch (error) {
      return res.status(500).json({ message: "Failed to advance Pirkei Avot progress" });
    }
  });

  // New routes for Pirkei Avot management
  app.get("/api/pirkei-avot",
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'pirkei-avot-all' }),
    async (req, res) => {
      try {
        const allPirkeiAvot = await storage.getAllPirkeiAvot();
        res.json(allPirkeiAvot);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch all Pirkei Avot content" });
      }
    }
  );

  app.post("/api/pirkei-avot", requireAdminAuth, async (req, res) => {
    try {
      const newPirkeiAvot = await storage.createPirkeiAvot(req.body);
      res.json(newPirkeiAvot);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create Pirkei Avot content" });
    }
  });

  // Daily recipe routes
  app.get("/api/table/recipe/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const recipe = await storage.getDailyRecipeByDate(date);
      res.json(recipe || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch daily recipe" });
    }
  });

  app.get("/api/table/recipe", async (req, res) => {
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
      res.json(recipe || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch daily recipe" });
    }
  });

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
      res.json(recipe);
    } catch (error) {
      console.error("Failed to create daily recipe:", error);
      if (error instanceof Error) {
        return res.status(500).json({ message: "Failed to create daily recipe", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to create daily recipe", error: String(error) });
      }
    }
  });

  // Get all recipes for admin interface
  app.get("/api/table/recipes", requireAdminAuth, async (req, res) => {
    try {
      const recipes = await storage.getAllDailyRecipes();
      res.json(recipes);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/table/vort/:week", async (req, res) => {
    try {
      const { week } = req.params;
      const vort = await storage.getParshaVortByWeek(week);
      res.json(vort || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Parsha vort" });
    }
  });

  app.get("/api/table/vort", async (req, res) => {
    try {
      // Day starts at 02:00 local time for analytics
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const vorts = await storage.getParshaVortsByDate(today);
      res.json(vorts);
    } catch (error) {
      console.error('Error fetching Parsha vorts:', error);
      return res.status(500).json({ message: "Failed to fetch Parsha vorts" });
    }
  });

  app.post("/api/table/vort", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertParshaVortSchema.parse(req.body);
      const vort = await storage.createParshaVort(validatedData);
      res.json(vort);
    } catch (error) {
      console.error('Error creating Parsha vort:', error);
      return res.status(500).json({ message: "Failed to create Parsha vort" });
    }
  });

  // Get all Parsha vorts (admin only)
  app.get("/api/table/vorts", requireAdminAuth, async (req, res) => {
    try {
      const vorts = await storage.getAllParshaVorts();
      res.json(vorts);
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
      
      const vort = await storage.updateParshaVort(id, validatedData);
      
      if (!vort) {
        return res.status(404).json({ message: "Parsha vort not found" });
      }
      
      res.json(vort);
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
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Parsha vort:', error);
      return res.status(500).json({ message: "Failed to delete Parsha vort" });
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
      
      res.json(times);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch zmanim data" });
    }
  });

  // Tehillim routes - Optimized for faster response
  app.get("/api/tehillim/progress", async (req, res) => {
    try {
      // Get progress with assigned name in a single optimized call
      const progressWithName = await storage.getProgressWithAssignedName();
      
      res.json(progressWithName);
    } catch (error) {
      console.error('Error fetching Tehillim progress:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim progress" });
    }
  });

  app.post("/api/tehillim/complete", async (req, res) => {
    try {
      const { currentPerek, language, completedBy } = req.body;
      
      // Accept IDs up to 171 (Psalm 119 has 22 parts, making the max ID 171)
      if (!currentPerek || currentPerek < 1 || currentPerek > 171) {
        return res.status(400).json({ error: "Invalid perek ID" });
      }
      
      if (!language || !['english', 'hebrew'].includes(language)) {
        return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
      }
      
      const updatedProgress = await storage.updateGlobalTehillimProgress(currentPerek, language, completedBy);
      res.json(updatedProgress);
    } catch (error) {
      console.error('Error completing Tehillim:', error);
      return res.status(500).json({ error: "Failed to complete Tehillim" });
    }
  });

  app.get("/api/tehillim/current-name", async (req, res) => {
    try {
      // Get the progress with the currently assigned name
      const progressWithName = await storage.getProgressWithAssignedName();
      
      // If there's an assigned name ID, fetch the full name details
      if (progressWithName.currentNameId) {
        const names = await storage.getActiveNames();
        const assignedName = names.find(n => n.id === progressWithName.currentNameId);
        res.json(assignedName || null);
      } else {
        res.json(null);
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch current name" });
    }
  });

  app.get("/api/tehillim/names", async (req, res) => {
    try {
      const names = await storage.getActiveNames();
      res.json(names);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Tehillim names" });
    }
  });

  // Global Tehillim Progress endpoint
  app.get("/api/tehillim/global-progress", async (_req, res) => {
    try {
      const progress = await storage.getGlobalTehillimProgress();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching global tehillim progress:", error);
      return res.status(500).json({ message: "Failed to fetch global tehillim progress" });
    }
  });

  // Get Tehillim info by ID for Global display
  app.get("/api/tehillim/info/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id < 1) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const tehillimInfo = await storage.getSupabaseTehillimById(id);
      if (!tehillimInfo) {
        return res.status(404).json({ error: "Tehillim not found" });
      }
      
      res.json(tehillimInfo);
    } catch (error) {
      console.error('Error fetching Tehillim info:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim info" });
    }
  });

  // Get Tehillim text from Supabase
  app.get("/api/tehillim/text/:perek",
    cacheMiddleware({ ttl: CACHE_TTL.TEHILLIM, category: 'tehillim-text' }),
    async (req, res) => {
      try {
        const perek = parseInt(req.params.perek);
        const language = req.query.language as string || 'english';
        
        if (isNaN(perek) || perek < 1 || perek > 171) {
          return res.status(400).json({ error: "Perek must be between 1 and 171" });
        }
        
        if (!['english', 'hebrew'].includes(language)) {
          return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
        }
        
        // Use new Supabase method instead of Sefaria
        const tehillimData = await storage.getSupabaseTehillim(perek, language);
        res.json(tehillimData);
      } catch (error) {
        console.error('Error fetching Tehillim text:', error);
        return res.status(500).json({ error: "Failed to fetch Tehillim text" });
      }
    }
  );

  // Get Tehillim text by ID (for proper part handling of Psalm 119)
  app.get("/api/tehillim/text/by-id/:id",
    cacheMiddleware({ ttl: CACHE_TTL.TEHILLIM, category: 'tehillim-text-by-id' }),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const language = req.query.language as string || 'english';
        
        if (isNaN(id) || id < 1 || id > 171) {
          return res.status(400).json({ error: "Invalid ID" });
        }
        
        if (!['english', 'hebrew'].includes(language)) {
          return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
        }
        
        // Get the specific part by ID
        const tehillimData = await storage.getTehillimById(id, language);
        res.json(tehillimData);
      } catch (error) {
        console.error('Error fetching Tehillim text by ID:', error);
        return res.status(500).json({ error: "Failed to fetch Tehillim text" });
    }
  });

  // Get next Tehillim part ID for navigation (handles Psalm 119 parts properly)
  app.get("/api/tehillim/next-part/:id", async (req, res) => {
    try {
      const currentId = parseInt(req.params.id);
      
      if (isNaN(currentId) || currentId < 1) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      // Get current tehillim info to determine what's next
      const currentTehillim = await storage.getSupabaseTehillimById(currentId);
      
      if (!currentTehillim) {
        return res.status(404).json({ error: "Tehillim not found" });
      }
      
      // If this is Psalm 119, find the next part
      if (currentTehillim.englishNumber === 119) {
        const nextPartNumber = currentTehillim.partNumber + 1;
        
        // Find the next part of 119
        const nextPart = await storage.getSupabaseTehillimByEnglishAndPart(119, nextPartNumber);
        if (nextPart) {
          return res.json({ 
            id: nextPart.id,
            englishNumber: 119,
            partNumber: nextPartNumber,
            hebrewNumber: nextPart.hebrewNumber
          });
        }
        
        // If there's no next part, we're at the last part - move to psalm 120
        const psalm120 = await storage.getSupabaseTehillimByEnglishAndPart(120, 1);
        if (psalm120) {
          return res.json({
            id: psalm120.id,
            englishNumber: 120,
            partNumber: 1,
            hebrewNumber: psalm120.hebrewNumber
          });
        }
      }
      
      // For other psalms, move to the next English number
      const nextEnglishNumber = currentTehillim.englishNumber + 1;
      
      // Handle wrap around from 150 to 1
      if (nextEnglishNumber > 150) {
        const psalm1 = await storage.getSupabaseTehillimByEnglishAndPart(1, 1);
        if (psalm1) {
          return res.json({
            id: psalm1.id,
            englishNumber: 1,
            partNumber: 1,
            hebrewNumber: psalm1.hebrewNumber
          });
        }
      }
      
      // Handle transition from 118 to 119 (should go to 119 part 1)
      if (nextEnglishNumber === 119) {
        const psalm119Part1 = await storage.getSupabaseTehillimByEnglishAndPart(119, 1);
        if (psalm119Part1) {
          return res.json({
            id: psalm119Part1.id,
            englishNumber: 119,
            partNumber: 1,
            hebrewNumber: psalm119Part1.hebrewNumber
          });
        }
      }
      
      // For other psalms or if 119 part 1 not found, use regular logic
      const nextPsalm = await storage.getSupabaseTehillimByEnglishAndPart(nextEnglishNumber, 1);
      if (nextPsalm) {
        return res.json({
          id: nextPsalm.id,
          englishNumber: nextEnglishNumber,
          partNumber: 1,
          hebrewNumber: nextPsalm.hebrewNumber
        });
      }
      
      // Fallback
      return res.status(404).json({ error: "Could not determine next Tehillim" });
      
    } catch (error) {
      console.error("Error getting next Tehillim part:", error);
      return res.status(500).json({ message: "Failed to get next Tehillim part" });
    }
  });

  // Get Tehillim preview (first line) from Sefaria API
  app.get("/api/tehillim/preview/:perek", async (req, res) => {
    try {
      const perek = parseInt(req.params.perek);
      const language = req.query.language as string || 'hebrew';
      
      if (isNaN(perek) || perek < 1 || perek > 171) {
        return res.status(400).json({ error: 'Perek must be between 1 and 171' });
      }
      
      const tehillimText = await storage.getSefariaTehillim(perek, language);
      // Extract first line for preview
      const firstLine = tehillimText.text.split('\n')[0] || tehillimText.text.substring(0, 100) + '...';
      
      res.json({
        preview: firstLine,
        perek: tehillimText.perek,
        language: tehillimText.language
      });
    } catch (error) {
      console.error('Error fetching Tehillim preview:', error);
      return res.status(500).json({ error: 'Failed to fetch Tehillim preview' });
    }
  });

  app.post("/api/tehillim/names", async (req, res) => {
    try {
      const validatedData = insertTehillimNameSchema.parse(req.body);
      const name = await storage.createTehillimName(validatedData);
      res.json(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid name data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create Tehillim name" });
      }
    }
  });

  // Get Tehillim text by psalm number (for chain reading) - MUST be after all specific routes
  app.get("/api/tehillim/:psalmNumber", async (req, res) => {
    try {
      const psalmNumber = parseInt(req.params.psalmNumber);
      
      if (isNaN(psalmNumber) || psalmNumber < 1 || psalmNumber > 150) {
        return res.status(400).json({ error: "Psalm number must be between 1 and 150" });
      }
      
      // Fetch both Hebrew and English text
      const [hebrewResult, englishResult] = await Promise.all([
        storage.getSupabaseTehillim(psalmNumber, 'hebrew'),
        storage.getSupabaseTehillim(psalmNumber, 'english')
      ]);
      
      res.json({
        psalmNumber,
        hebrewText: hebrewResult?.text || '',
        englishText: englishResult?.text || ''
      });
    } catch (error) {
      console.error('Error fetching Tehillim:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim" });
    }
  });

  // =====================
  // Tehillim Chains Routes
  // =====================

  // Helper function to generate URL slug from name
  function generateSlug(name: string): string {
    // Check if name has Latin characters
    const latinChars = name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    if (latinChars.length >= 2) {
      // Create URL-friendly slug from Latin characters
      return latinChars
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50) + '-' + Date.now().toString(36);
    }
    // Fallback to numeric ID for Hebrew names
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  // Create a new Tehillim Chain
  app.post("/api/tehillim-chains", async (req, res) => {
    try {
      const { name, reason, deviceId } = req.body;
      
      if (!name || !reason) {
        return res.status(400).json({ error: "Name and reason are required" });
      }

      // Generate unique slug
      let slug = generateSlug(name);
      
      // Ensure slug is unique by checking database
      let existingChain = await storage.getTehillimChainBySlug(slug);
      let attempts = 0;
      while (existingChain && attempts < 5) {
        slug = generateSlug(name);
        existingChain = await storage.getTehillimChainBySlug(slug);
        attempts++;
      }

      const chain = await storage.createTehillimChain({
        name,
        reason,
        slug,
        creatorDeviceId: deviceId || null,
        isActive: true,
      });

      res.json(chain);
    } catch (error) {
      console.error("Error creating Tehillim chain:", error);
      res.status(500).json({ error: "Failed to create Tehillim chain" });
    }
  });

  // Search Tehillim Chains by name
  app.get("/api/tehillim-chains/search", async (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      const chains = await storage.searchTehillimChains(query);
      res.json(chains);
    } catch (error) {
      // Return empty array if database tables don't exist yet
      console.error("Error searching Tehillim chains (returning empty):", error);
      res.json([]);
    }
  });

  // Get all-time total tehillim completed across all chains
  // NOTE: This must be BEFORE the :slug route to avoid "stats" being matched as a slug
  app.get("/api/tehillim-chains/stats/total", async (req, res) => {
    try {
      const total = await storage.getTotalChainTehillimCompleted();
      res.json({ total });
    } catch (error) {
      // Return 0 if database tables don't exist yet or query fails
      console.error("Error fetching total chains tehillim (returning 0):", error);
      res.json({ total: 0 });
    }
  });

  // Get active campaign (chain) count
  app.get("/api/tehillim-chains/stats/active-count", async (req, res) => {
    try {
      const count = await storage.getActiveTehillimChainCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching active chain count:", error);
      res.json({ count: 0 });
    }
  });

  // Get a random Tehillim Chain
  app.get("/api/tehillim-chains/random", async (req, res) => {
    try {
      const randomChain = await storage.getRandomTehillimChain();
      if (!randomChain) {
        return res.status(404).json({ error: "No chains found" });
      }
      res.json(randomChain);
    } catch (error) {
      console.error("Error getting random chain:", error);
      res.status(500).json({ error: "Failed to get random chain" });
    }
  });

  // Get a specific Tehillim Chain by slug (includes stats and next psalm for fast loading)
  app.get("/api/tehillim-chains/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const { deviceId } = req.query;
      const chain = await storage.getTehillimChainBySlug(slug);
      
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      // Check if device has an active reading first (for returning users)
      let activeReading: number | null = null;
      if (deviceId) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const readings = await db.select({ psalmNumber: tehillimChainReadings.psalmNumber })
          .from(tehillimChainReadings)
          .where(and(
            eq(tehillimChainReadings.chainId, chain.id),
            eq(tehillimChainReadings.deviceId, deviceId as string),
            eq(tehillimChainReadings.status, 'reading'),
            gt(tehillimChainReadings.startedAt, tenMinutesAgo)
          ))
          .limit(1);
        if (readings.length > 0) {
          activeReading = readings[0].psalmNumber;
        }
      }

      // Fetch stats and next psalm in parallel to eliminate waterfall
      const [stats, nextAvailable] = await Promise.all([
        storage.getTehillimChainStats(chain.id),
        storage.getAvailablePsalmForChain(chain.id, deviceId as string | undefined)
      ]);

      // Return active reading if exists, otherwise next available
      const nextPsalm = activeReading || nextAvailable;

      // Pre-adjust stats when a new reading is about to start
      // This ensures consistent numbers between fresh visits and refreshes
      const willStartNewReading = !activeReading && nextAvailable !== null;
      const adjustedStats = {
        totalCompleted: stats.totalSaid,
        booksCompleted: stats.booksCompleted,
        currentlyReading: willStartNewReading ? stats.currentlyReading + 1 : stats.currentlyReading,
        available: willStartNewReading ? Math.max(0, stats.available - 1) : stats.available
      };

      res.json({
        ...chain,
        stats: adjustedStats,
        nextPsalm: nextPsalm || null,
        hasActiveReading: !!activeReading
      });
    } catch (error) {
      console.error("Error fetching Tehillim chain:", error);
      res.status(500).json({ error: "Failed to fetch Tehillim chain" });
    }
  });

  // Get chain stats (total said, books completed, currently reading, available)
  app.get("/api/tehillim-chains/:slug/stats", async (req, res) => {
    try {
      const { slug } = req.params;
      const chain = await storage.getTehillimChainBySlug(slug);
      
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      const stats = await storage.getTehillimChainStats(chain.id);
      // Map totalSaid to totalCompleted for frontend compatibility
      res.json({
        totalCompleted: stats.totalSaid,
        booksCompleted: stats.booksCompleted,
        currentlyReading: stats.currentlyReading,
        available: stats.available
      });
    } catch (error) {
      console.error("Error fetching chain stats:", error);
      res.status(500).json({ error: "Failed to fetch chain stats" });
    }
  });

  // Start reading a psalm on a chain
  app.post("/api/tehillim-chains/:slug/start-reading", async (req, res) => {
    try {
      const { slug } = req.params;
      const { deviceId, psalmNumber } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      // If no psalm specified, get an available one
      let psalm = psalmNumber;
      if (!psalm) {
        psalm = await storage.getAvailablePsalmForChain(chain.id);
        if (!psalm) {
          return res.status(404).json({ error: "No psalms available - all have been completed or are being read" });
        }
      }

      const reading = await storage.startChainReading(chain.id, psalm, deviceId);
      res.json(reading);
    } catch (error) {
      console.error("Error starting chain reading:", error);
      res.status(500).json({ error: "Failed to start reading" });
    }
  });

  // Complete a psalm on a chain
  app.post("/api/tehillim-chains/:slug/complete", async (req, res) => {
    try {
      const { slug } = req.params;
      const { deviceId, psalmNumber } = req.body;

      if (!deviceId || !psalmNumber) {
        return res.status(400).json({ error: "Device ID and psalm number are required" });
      }

      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      const reading = await storage.completeChainReading(chain.id, psalmNumber, deviceId);
      res.json(reading);
    } catch (error) {
      console.error("Error completing chain reading:", error);
      res.status(500).json({ error: "Failed to complete reading" });
    }
  });

  // Get next sequential available psalm for a chain (default on page load)
  app.get("/api/tehillim-chains/:slug/next-available", async (req, res) => {
    try {
      const { slug } = req.params;
      const { deviceId } = req.query;

      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      const psalm = await storage.getAvailablePsalmForChain(chain.id, deviceId as string);
      if (!psalm) {
        return res.status(404).json({ error: "No psalms available" });
      }

      res.json({ psalmNumber: psalm });
    } catch (error) {
      console.error("Error getting next psalm:", error);
      res.status(500).json({ error: "Failed to get next psalm" });
    }
  });

  // Get a random available psalm for a chain (for "Find me another" button)
  app.get("/api/tehillim-chains/:slug/random-available", async (req, res) => {
    try {
      const { slug } = req.params;
      const { deviceId } = req.query;

      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      const psalm = await storage.getRandomAvailablePsalmForChain(chain.id, deviceId as string);
      if (!psalm) {
        return res.status(404).json({ error: "No psalms available" });
      }

      res.json({ psalmNumber: psalm });
    } catch (error) {
      console.error("Error getting random psalm:", error);
      res.status(500).json({ error: "Failed to get random psalm" });
    }
  });

  // Admin: Migrate tehillim_names to tehillim_chains
  app.post("/api/admin/migrate-tehillim-names", requireAdminAuth, async (req, res) => {
    try {
      const result = await storage.migrateTehillimNamesToChains();
      res.json(result);
    } catch (error) {
      console.error("Error migrating tehillim names:", error);
      res.status(500).json({ error: "Failed to migrate tehillim names" });
    }
  });

  // Nishmas text routes
  app.get("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const text = await storage.getNishmasTextByLanguage(language);
      res.json(text || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Nishmas text" });
    }
  });

  app.post("/api/nishmas", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertNishmasTextSchema.parse(req.body);
      const text = await storage.createNishmasText(validatedData);
      res.json(text);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create Nishmas text" });
    }
  });

  app.put("/api/nishmas/:language", requireAdminAuth, async (req, res) => {
    try {
      const { language } = req.params;
      const validatedData = insertNishmasTextSchema.partial().parse(req.body);
      const text = await storage.updateNishmasText(language, validatedData);
      res.json(text);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update Nishmas text" });
    }
  });

  // Pirkei Avot progression route
  app.get("/api/pirkei-avot/progress", async (req, res) => {
    try {
      const progress = await storage.getPirkeiAvotProgress();
      res.json(progress);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Pirkei Avot progress" });
    }
  });

  // Women's prayer routes
  app.get("/api/womens-prayers/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const prayers = await storage.getWomensPrayersByCategory(category);
      res.json(prayers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch women's prayers" });
    }
  });

  app.get("/api/womens-prayers/prayer/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prayer = await storage.getWomensPrayerById(parseInt(id));
      res.json(prayer || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch prayer" });
    }
  });

  // Meditation routes
  app.get("/api/meditations/categories", async (req, res) => {
    try {
      const categories = await storage.getMeditationCategories();
      res.json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch meditation categories" });
    }
  });

  app.get("/api/meditations/section/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const meditations = await storage.getMeditationsBySection(section);
      res.json(meditations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch meditations" });
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
      res.json(promotions);
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
        
        res.json({ success: true, message: 'Sponsor record created', sponsor: createdSponsor });
      } else {
        console.log('⏭️ No sponsor record needed - conditions not met:', {
          donationType,
          sponsorName,
          isCorrectType: donationType === 'Sponsor a Day of Ezras Nashim',
          hasName: !!sponsorName
        });
        res.json({ success: true, message: 'No sponsor record needed' });
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
  app.get("/.well-known/apple-developer-merchantid-domain-association", (req, res) => {
    console.log('Apple Pay domain verification file requested');
    res.setHeader('Content-Type', 'text/plain');
    // Send the Apple Pay domain verification content
    res.send('7B227073704964223A2239373830303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222C2276657273696F6E223A312C22637265617465644F6E223A313534373531373737393538332C227369676E6174757265223A22333038303036303932613836343838366637306430313037303261303830333038303330383130373061303132383034383336633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933656436656537613738303830333038623135333032303136633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653465363536333736333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030333038316330313035313030313031303330383161323330613036303832613836343836366637306430323031303130353030613038316138306161613863633763373036346166336535303635633532383336303830343363333462646338663034376335383230653566346165613333383035396430303862343030626536646662366562633036316236636632666637353633643832326231333436326631353638346633343730323666346134623430393231633666643234613432626639316462623366616430666332353265663763306562333062656165663532376338393964633962633934366234336533633633373434656535643333353935373766613730356233323863373330326635313934306433653231656165613730306436636638613039316137383435363237663131373437343832363738623634626238636330373766343439346533336262646633656665353264653331643339363030313531643165353832636166633264373563373737303765373937616636613733356135326431656137356639393737323661666533306531356232616336633330653430313536633737326436623638323735333634363736343730373637323734363936633735373332653633366637323265363136663639373332653632373536313639363533363635363237343631366337333265363636313733373436323635373436313265363436353766373436313635373436353733373432653631363933653065363536333637333230323030316634663932343461353835653935386164633135383334393834333030613036303832613836343836366637306430323031303130353030613038316331393938643831373439373531643362343261646365643234306633373830346264346133316462323334363433356136303237633862303262396336303263363365316462636536613161663833613830326532616461656564396331626437316433313035393864666534393366393736313535653436613436396634353639303936326439633161393836383363653766326364623337613235346136393233383866393264356434633461393034663037333336396334633165386135613833666131363836383461396666343661323633653362643139646431636533393866393862616563643638363930373766626532663465636639326635656565616232393063643235653639336235313936346366656362643134376665383837626635303935333463383562653537653433356235356666616637616163323962303438383230333931643366353661626231633939643437306665636636333066653932383535323732343739613836343030613035646630323030303461616636623334646531646530623234383866326439396436303031646336613739366338373836346564303134356162313036643166363262393438313662373735386365346630363237353332373738343538353937343066343863313565626537623938653735643238633732303530373562306134376233623964333335653838653436346431313265323363376235623564663139653436656162636562373031383862376435376661653865646166393064333330333938656465393230633535643465343831653832353437336336643834303065643464646338643339333366303339636239323763646261626437343763656538316436626137356439313364363338643565653361313564626535303939393035663530396263656633316137653538646537373132333766366632396130303035383936623132366236623766363464656662653032303030333038323033383233303832303162313061303330323031303230323034303031623063653834333038313061303630383261383634383836663730643031303130623035303030613831393733303833363130623330303933303631303433353533343130633033353535333130313133303132303630333535303430613063306236313730373036633635323036393665363332653330316533303163303630333535303430333063313535313631373030366336353230343934343230353137323635373336393734363537363636363936333631373436393666366535333635373237363639363365373330323030353364653532633537326133383833306266656466613763383130333066333734663030653261323963336631383032636330323364353764316132346137663165366161326533623538636566333333356631656337313135623830333264623963643866313131636638303661643038643738653538626236353135316233643439663966303165356535356166383732333738626138623633393436316532623562313638653563393436393932303065643634656531306665336434333433343332356431666336353139613537393966303363623465323734306664316563656265333866376431376539613064653936623138623066383666353662386664663061613730396232653736616439376437616632383464623536646662373164383166653961633635646533613533393837336666373165353966336131373539373765343935393966393337636135626133376232353735343233373938343433373863326564353261343765366338393337376135343764646234633835313039663165383033353631396431623632333738383839333434366531393461653930393065333738373433383863353966373437646434323334646462623633353036303030222C22706F6453223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D222C22706F64223A224D4947654D5167724243674B4A6B69615256596E61517245414151524341444242414C6F33364B675447456469306C656D456D6A526C597A67744C43386B58434B7547456A376F7648733978716E416C736F2B5841343648794A454A4E6B576A69524D415054714B316D786E393253664A39373637336545505567776966357834636C4F76316976726E6E6D3942783947666C4144615A4B5377334E7A4B764B6C6B6E334B484B77324B33494C484C7243525A6857655561613346446D5153413D22222C22747261646554223A313534373531373737393030302C22727041223A22456A30334E7A597A4E7A4D304D7A4D794E5463794E4441784E7A45334E6A67354E446B314E6A6C6D4D7A4E6A4D324D7A51794E6D566D4E4463344E324A684F4738325A4755304E7A5530597A466A4E446B314E7A593551413D3D222C227230336B53636F7265223A312C2272336B53636F7265223A312C22723361723053636F7265223A312C2264737377536D34537461747573223A302C227231676D536D34537461747573223A302C22697373756572536D34537461747573223A302C22687638386D74537461747573223A302C2268763838537461747573223A317D');
  });

  // Test Stripe connection endpoint
  app.get("/api/stripe-test", async (req, res) => {
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
      
      res.json({
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
      
      res.status(500).json({
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
          metadata: {
            buttonType: metadata?.buttonType || "put_a_coin",
            sponsorName: metadata?.sponsorName || "",
            dedication: metadata?.dedication || "",
            message: metadata?.message || "",
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
      res.json({ 
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
      res.status(500).json({ 
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
        response.data.pipe(res);
      } else {
        res.status(500).json({ error: "No response body" });
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
    res.redirect(`/api/media-proxy/gdrive/${fileId}`);
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
  app.get("/api/webhooks/stripe/debug", async (req, res) => {
    res.json({
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

      res.json({ received: true });
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
      
      // Look for completion events in the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      // Check if donation exists and was completed
      const donation = await storage.getDonationBySessionId(sessionId);
      
      if (donation && donation.status === 'succeeded') {
        console.log('Found completed donation:', donation.id);
        
        const metadata = donation.metadata as Record<string, any> || {};
        const buttonType = metadata.buttonType || donation.type || 'put_a_coin';
        
        res.json({
          completed: true,
          buttonType: buttonType,
          amount: donation.amount,
          timestamp: donation.createdAt
        });
      } else {
        res.json({ completed: false });
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
      
      res.json({ 
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
      const { paymentIntentId, sessionId, amount, currency, metadata } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }
      
      // Check if we've already processed this payment (idempotency check)
      const existingAct = await storage.getActByPaymentIntentId(paymentIntentId);
      if (existingAct) {
        console.log(`Payment ${paymentIntentId} already processed - returning success`);
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
      
      res.json({ 
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
      
      res.json({ message: "Donation status updated", donation });
    } catch (error) {
      console.error('Error updating donation status:', error);
      return res.status(500).json({ message: "Failed to update donation status" });
    }
  });

  // Offline bootstrap endpoint - Essential content for offline access
  app.get("/api/offline/bootstrap", async (req, res) => {
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

      res.json({
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

  // Mitzvah tracking routes - Server-side sync for community totals
  app.post("/api/mitzvos/sync", async (req, res) => {
    try {
      const { deviceId, completions } = req.body;
      
      if (!deviceId || !Array.isArray(completions)) {
        return res.status(400).json({ message: "deviceId and completions array required" });
      }
      
      // Validate completions format
      for (const c of completions) {
        if (!c.category || !c.date || !c.idempotencyKey) {
          return res.status(400).json({ message: "Each completion requires category, date, and idempotencyKey" });
        }
        if (!['torah', 'tefilla', 'tzedaka'].includes(c.category)) {
          return res.status(400).json({ message: "Invalid category. Must be torah, tefilla, or tzedaka" });
        }
      }
      
      const result = await storage.syncMitzvahCompletions(deviceId, completions);
      res.json(result);
    } catch (error) {
      console.error('Error syncing mitzvah completions:', error);
      return res.status(500).json({ message: "Failed to sync completions" });
    }
  });

  app.get("/api/mitzvos/totals", async (req, res) => {
    try {
      const date = req.query.date as string | undefined;
      const totals = await storage.getMitzvahTotals(date);
      res.json(totals);
    } catch (error) {
      console.error('Error getting mitzvah totals:', error);
      return res.status(500).json({ message: "Failed to get totals" });
    }
  });

  app.get("/api/mitzvos/streak/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      if (!deviceId) {
        return res.status(400).json({ message: "deviceId required" });
      }
      const streak = await storage.getDeviceStreak(deviceId);
      res.json({ streak });
    } catch (error) {
      console.error('Error getting device streak:', error);
      return res.status(500).json({ message: "Failed to get streak" });
    }
  });

  // Analytics routes
  // Only track essential completion events (not page views)
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, eventData, sessionId, idempotencyKey, date } = req.body;
      
      // Only allow completion events, reject high-volume events like page_view
      const allowedEvents = ['modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete', 'tzedaka_completion', 'meditation_complete', 'feature_usage'];
      if (!allowedEvents.includes(eventType)) {
        return res.status(400).json({ message: "Event type not tracked" });
      }
      
      const event = await storage.trackEvent({
        eventType,
        eventData,
        sessionId,
        idempotencyKey,
        analyticsDate: date // Store client-provided date for accurate timezone-aware aggregation
      });
      
      res.json(event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      return res.status(500).json({ message: "Failed to track event" });
    }
  });
  
  // Sync endpoint for offline queued analytics events
  app.post("/api/analytics/sync", async (req, res) => {
    try {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ message: "Events array required" });
      }
      
      // Filter to only allowed event types
      const allowedEvents = ['modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete', 'tzedaka_completion', 'meditation_complete', 'feature_usage'];
      const validEvents = events.filter((e: any) => allowedEvents.includes(e.eventType));
      
      const result = await storage.syncAnalyticsEvents(validEvents);
      
      res.json(result);
    } catch (error) {
      console.error('Error syncing analytics events:', error);
      return res.status(500).json({ message: "Failed to sync events" });
    }
  });

  // Feature usage tracking endpoint
  app.post("/api/feature-usage", async (req, res) => {
    try {
      const { featureName, category } = req.body;
      
      if (!featureName) {
        return res.status(400).json({ message: "Feature name required" });
      }
      
      const event = await storage.trackEvent({
        eventType: 'feature_usage',
        eventData: {
          feature: featureName,
          category: category || 'general'
        },
        sessionId: null
      });
      
      res.json({ success: true, event });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      return res.status(500).json({ message: "Failed to track feature usage" });
    }
  });

  // Efficient session tracking - updates daily stats only once per session
  app.post("/api/analytics/session", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      
      await storage.recordActiveSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error recording session:', error);
      return res.status(500).json({ message: "Failed to record session" });
    }
  });

  // Data cleanup endpoint - remove old analytics data
  app.post("/api/analytics/cleanup", requireAdminAuth, async (req, res) => {
    try {
      await storage.cleanupOldAnalytics();
      res.json({ success: true, message: "Old analytics data cleaned up" });
    } catch (error) {
      console.error('Error cleaning up analytics:', error);
      return res.status(500).json({ message: "Failed to cleanup analytics" });
    }
  });

  app.get("/api/analytics/stats/today", async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // Accept client-provided date parameter for proper timezone handling
      // If no date provided, calculate using server time (fallback for backward compatibility)
      let today: string;
      if (req.query.date && typeof req.query.date === 'string') {
        // Client provides the correct analytics date accounting for their local 2 AM boundary
        today = req.query.date;
      } else {
        // Fallback: use server time calculation (may be incorrect for users in different timezones)
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        today = now.toISOString().split('T')[0];
      }
      
      // Recalculate stats to ensure they're current
      const stats = await storage.recalculateDailyStats(today);
      
      res.json(stats || {
        date: today,
        uniqueUsers: 0,
        pageViews: 0,
        tehillimCompleted: 0,
        namesProcessed: 0,
        modalCompletions: {}
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return res.status(500).json({ message: "Failed to fetch today's stats" });
    }
  });

  app.get("/api/analytics/stats/week", async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      // Accept client-provided start date parameter for proper timezone handling
      // The client should send the start of the current week (Sunday 2 AM in their timezone)
      let weekStart: string;
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        // Client provides the correct week start date accounting for their local 2 AM boundary
        weekStart = req.query.startDate;
      } else {
        // Fallback: calculate using server time (may be incorrect for users in different timezones)
        const now = new Date();
        const hours = now.getHours();
        const currentDate = new Date(now);
        
        // Adjust for 2 AM boundary
        if (hours < 2) {
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // Find the most recent Sunday
        const dayOfWeek = currentDate.getDay();
        const daysToSubtract = dayOfWeek; // 0 for Sunday, 1 for Monday, etc.
        currentDate.setDate(currentDate.getDate() - daysToSubtract);
        
        weekStart = currentDate.toISOString().split('T')[0];
      }
      
      const weeklyStats = await storage.getWeeklyStats(weekStart);
      res.json(weeklyStats);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/analytics/stats/month", async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const now = new Date();
      const year = parseInt(req.query.year as string) || now.getFullYear();
      const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
      
      const monthlyStats = await storage.getMonthlyStats(year, month);
      res.json(monthlyStats);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  app.get("/api/analytics/stats/total", async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const totals = await storage.getTotalStats();
      res.json(totals);
    } catch (error) {
      console.error('Error fetching total stats:', error);
      return res.status(500).json({ message: "Failed to fetch total stats" });
    }
  });

  // Recalculate all historical analytics to fix brocha counting
  app.post("/api/analytics/recalculate-all", requireAdminAuth, async (req, res) => {
    try {
      console.log('Starting recalculation of all historical analytics...');
      const result = await storage.recalculateAllHistoricalStats();
      console.log(`Completed: Updated ${result.updated} dates`);
      
      res.json({ 
        success: true, 
        message: `Successfully recalculated analytics for ${result.updated} dates`,
        datesUpdated: result.updated,
        dates: result.dates
      });
    } catch (error) {
      console.error('Error recalculating all analytics:', error);
      return res.status(500).json({ message: "Failed to recalculate all analytics" });
    }
  });

  app.get("/api/analytics/stats/daily", async (req, res) => {
    try {
      // Get stats for the last 30 days
      const dailyStats = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const stats = await storage.getDailyStats(dateStr);
        if (stats) {
          dailyStats.push(stats);
        }
      }
      
      res.json(dailyStats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/stats/range", requireAdminAuth, async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const rangeStats = await storage.getDateRangeStats(startDate, endDate);
      res.json(rangeStats);
    } catch (error) {
      console.error('Error fetching date range stats:', error);
      return res.status(500).json({ message: "Failed to fetch date range stats" });
    }
  });

  app.get("/api/analytics/stats/compare", requireAdminAuth, async (req, res) => {
    try {
      // Force no caching for real-time analytics
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      const period = req.query.period as 'week' | 'month';

      if (!period || (period !== 'week' && period !== 'month')) {
        return res.status(400).json({ message: "period must be 'week' or 'month'" });
      }

      const comparisonStats = await storage.getComparisonStats(period);
      res.json(comparisonStats);
    } catch (error) {
      console.error('Error fetching comparison stats:', error);
      return res.status(500).json({ message: "Failed to fetch comparison stats" });
    }
  });

  app.get("/api/analytics/community-impact", async (req, res) => {
    try {
      const period = req.query.period as string || 'alltime';
      const impact = await storage.getCommunityImpact(period);
      res.json(impact);
    } catch (error) {
      console.error('Error fetching community impact:', error);
      return res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  // IP-based location detection (works with VPN)
  app.get("/api/location/ip", async (req, res) => {
    try {
      // Get client IP address - handle multiple IPs by taking the first one
      let clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection as any)?.socket?.remoteAddress ||
                      '127.0.0.1';
      
      // If x-forwarded-for contains multiple IPs, take the first one
      if (typeof clientIP === 'string' && clientIP.includes(',')) {
        clientIP = clientIP.split(',')[0].trim();
      }
      
      // Remove IPv6 prefix if present
      if (typeof clientIP === 'string' && clientIP.startsWith('::ffff:')) {
        clientIP = clientIP.replace('::ffff:', '');
      }
      
      console.log('IP-based location detection for IP:', clientIP);
      
      // Use ip-api.com for IP-based geolocation (free, no API key needed)
      const ipResponse = await serverAxiosClient.get(`http://ip-api.com/json/${clientIP}?fields=status,message,country,regionName,city,lat,lon,timezone`);
      
      if (ipResponse.data.status === 'success') {
        const locationData = {
          coordinates: {
            lat: ipResponse.data.lat,
            lng: ipResponse.data.lon
          },
          location: `${ipResponse.data.city}, ${ipResponse.data.regionName}, ${ipResponse.data.country}`,
          timezone: ipResponse.data.timezone,
          source: 'ip'
        };
        
        console.log('IP-based location detected:', locationData);
        res.json(locationData);
      } else {
        console.log('IP-based location failed:', ipResponse.data.message);
        res.status(400).json({ error: 'Could not determine location from IP address' });
      }
    } catch (error) {
      console.error('IP-based location detection error:', error);
      return res.status(500).json({ error: 'Failed to detect location from IP' });
    }
  });

  // Location API endpoint for Tefilla conditional processing
  app.get("/api/location/:lat/:lon", async (req, res) => {
    try {
      const { lat, lon } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      // Use OpenStreetMap Nominatim for reverse geocoding
      const response = await serverAxiosClient.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );

      if (response.data) {
        res.json({
          country: response.data.address?.country || 'Unknown',
          city: response.data.address?.city || response.data.address?.town || response.data.address?.village || 'Unknown',
          state: response.data.address?.state || response.data.address?.province || null,
          coordinates: { latitude, longitude }
        });
      } else {
        res.status(404).json({ message: "Location not found" });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      return res.status(500).json({ message: "Failed to fetch location data" });
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

        res.json({
          events,
          location: eventsResponse.data.location || null
        });
      } else {
        res.json({ events: [], location: null });
      }
    } catch (error) {
      console.error('Error fetching Jewish events:', error);
      return res.status(500).json({ message: "Failed to fetch Jewish events" });
    }
  });

  // Hebrew date API endpoint for Tefilla conditional processing
  app.get("/api/hebrew-date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const inputDate = new Date(date);
      
      if (isNaN(inputDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const year = inputDate.getFullYear();
      const month = inputDate.getMonth() + 1;
      const day = inputDate.getDate();

      // Get Hebrew date conversion
      const hebrewResponse = await serverAxiosClient.get(
        `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`
      );

      // Get events and holidays for this date
      const eventsResponse = await serverAxiosClient.get(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=on&nx=on`
      );

      let isRoshChodesh = false;
      let events: string[] = [];

      if (eventsResponse.data && eventsResponse.data.items) {
        // Filter events for the specific date
        const dateString = inputDate.toISOString().split('T')[0];
        const dayEvents = eventsResponse.data.items.filter((item: any) => {
          if (item.date) {
            const eventDate = new Date(item.date).toISOString().split('T')[0];
            return eventDate === dateString;
          }
          return false;
        });

        events = dayEvents.map((item: any) => item.title || item.hebrew || '');
        isRoshChodesh = events.some(event => 
          event.toLowerCase().includes('rosh chodesh') ||
          event.toLowerCase().includes('ראש חודש')
        );
      }

      if (hebrewResponse.data) {
        // Calculate Hebrew month length
        // Some months always have 30 days, some 29, and Cheshvan/Kislev vary by year
        // Hebcal API might return it, or we default based on common patterns
        let monthLength = 30; // Default to 30
        
        const hebrewMonth = hebrewResponse.data.hm || '';
        
        // Hebrew months that always have 29 days
        const shortMonths = ['Tevet', 'Adar I', 'Adar', 'Iyyar', 'Tammuz', 'Elul'];
        if (shortMonths.includes(hebrewMonth)) {
          monthLength = 29;
        }
        
        // Check if Hebcal provides the length
        if (hebrewResponse.data.monthLength) {
          monthLength = hebrewResponse.data.monthLength;
        }
        
        // Note: Cheshvan and Kislev can be either 29 or 30 days depending on the year
        // Without additional calendar calculation, we default to 30 for these
        // The actual length would require more complex Hebrew calendar calculations
        
        res.json({
          hebrew: hebrewResponse.data.hebrew || '',
          date: date,
          isRoshChodesh,
          events,
          hebrewDay: hebrewResponse.data.hd,
          hebrewMonth: hebrewResponse.data.hm,
          hebrewYear: hebrewResponse.data.hy,
          monthLength: monthLength,
          dd: hebrewResponse.data.hd, // Alias for compatibility
          hm: hebrewResponse.data.hm  // Alias for compatibility
        });
      } else {
        res.status(404).json({ message: "Hebrew date not found" });
      }
    } catch (error) {
      console.error('Error fetching Hebrew date:', error);
      return res.status(500).json({ message: "Failed to fetch Hebrew date data" });
    }
  });

  // Enhanced health check with configuration status
  app.get("/healthcheck", (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Check critical services
    const health = {
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: !!process.env.DATABASE_URL,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        pushNotifications: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        admin: !!process.env.ADMIN_PASSWORD
      }
    };
    
    // In production, include a warnings array for missing optional services
    if (isProduction) {
      const warnings: string[] = [];
      if (!health.services.stripe) warnings.push('Stripe not configured - donations disabled');
      if (!health.services.pushNotifications) warnings.push('Push notifications not configured');
      if (!health.services.admin) warnings.push('Admin panel not configured');
      
      if (warnings.length > 0) {
        (health as any).warnings = warnings;
      }
    }
    
    res.json(health);
  })

  // Development: Inform about frontend port  
  if (process.env.NODE_ENV === 'development') {
    app.get("/", (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Ezras Nashim API Server</title>
            <style>
              body { font-family: Platypi, serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 15px; }
              .frontend-link { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .frontend-link:hover { background: #0056b3; }
              .api-status { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🌺 Ezras Nashim API Server</h1>
              <p class="api-status">✅ API Server Running (Port 5000)</p>
              <p>This is the backend API server. To access the Ezras Nashim application interface, please use:</p>
              <a href="https://${req.get('host')?.replace(':5000', ':5173')}" class="frontend-link">
                Access Frontend Application (Port 5173)
              </a>
              <p><small>The frontend runs on port 5173 during development.</small></p>
            </div>
          </body>
        </html>
      `);
    });
  } else {
    // Production: Serve API status  
    app.get("/", (req, res) => {
      res.json({ status: "OK" });
    });
  }
  
  // Version endpoint for PWA update checking - AUTOMATIC VERSIONING
  // Automatically generate version based on deployment time
  const SERVER_START_TIME = Date.now();
  const DEPLOYMENT_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const DEPLOYMENT_TIME = Math.floor(SERVER_START_TIME / 1000); // Unix timestamp in seconds
  
  // Generate automatic version: date + time-based
  const generateAutoVersion = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day}.${hour}${minute}`;
  };
  
  const APP_VERSION = process.env.APP_VERSION || generateAutoVersion();
  
  // Use deployment timestamp as version timestamp for automatic updates
  const getVersionTimestamp = (): number => {
    // In production, use server start time as deployment timestamp
    // This ensures each deployment gets a unique timestamp
    return SERVER_START_TIME;
  };
  
  app.get("/api/version", (req, res) => {
    // Aggressive no-cache headers to ensure users always get fresh version info
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    const versionTimestamp = getVersionTimestamp();
    const version = {
      timestamp: versionTimestamp,
      version: APP_VERSION,
      buildDate: new Date(versionTimestamp).toISOString(),
      serverUptime: Date.now() - SERVER_START_TIME,
      // Support for critical updates - set these env vars when deploying urgent fixes
      isCritical: process.env.CRITICAL_UPDATE === 'true',
      releaseNotes: process.env.RELEASE_NOTES || undefined
    };
    res.json(version);
  });

  // Admin endpoint to regenerate cache version - Forces PWA update
  app.post("/api/regenerate-cache-version", requireAdminAuth, async (req, res) => {
    try {
      const { execSync } = await import('child_process');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const scriptPath = path.join(__dirname, '../scripts/generate-version.js');
      
      // Execute the version generation script
      const output = execSync(`node ${scriptPath}`, { encoding: 'utf-8' });
      
      console.log('[Admin] Cache version regenerated:', output);
      
      res.status(200).json({
        success: true,
        message: 'Cache version regenerated successfully',
        output: output.trim(),
        newVersion: `v1.0.0-${Date.now()}`,
        note: 'Users will receive update prompt on next app focus'
      });
    } catch (error: any) {
      console.error('[Admin] Failed to regenerate cache version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate cache version',
        error: error.message
      });
    }
  });

  // Batched homepage data endpoint - reduces initial load requests from 2+ to 1
  app.get("/api/home-summary", async (req, res) => {
    try {
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ error: "Date parameter required (YYYY-MM-DD format)" });
      }

      const errors: { field: string; error: string }[] = [];
      
      // Fetch all data in parallel with individual error handling
      const [message, sponsor] = await Promise.allSettled([
        storage.getMessageByDate(date),
        storage.getDailySponsor(date)
      ]);

      // Track any errors
      if (message.status === 'rejected') {
        errors.push({ field: 'message', error: message.reason?.message || 'Failed to fetch message' });
      }
      if (sponsor.status === 'rejected') {
        errors.push({ field: 'sponsor', error: sponsor.reason?.message || 'Failed to fetch sponsor' });
      }

      const summary = {
        message: message.status === 'fulfilled' ? message.value : null,
        sponsor: sponsor.status === 'fulfilled' ? sponsor.value : null,
        errors: errors.length > 0 ? errors : undefined,
        fetchedAt: new Date().toISOString()
      };

      // Set caching: 2 minutes for messages (check frequently), 15 minutes for sponsors
      res.set({
        'Cache-Control': 'public, max-age=120', // 2 minutes
      });

      res.json(summary);
    } catch (error) {
      console.error('Error fetching home summary:', error);
      return res.status(500).json({ error: "Failed to fetch home summary" });
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
      
      res.json(message);
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
      res.status(201).json(newMessage);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: error.errors 
        });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages", requireAdminAuth, async (req, res) => {
    try {
      const { upcoming } = req.query;
      const messages = upcoming === 'true' 
        ? await storage.getUpcomingMessages()
        : await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put("/api/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      // Validate request body with Zod schema (omit id and timestamps for updates)
      const updateSchema = insertMessagesSchema.omit({ 
        id: true, 
        createdAt: true, 
        updatedAt: true 
      });
      const validatedData = updateSchema.parse(req.body);
      const updatedMessage = await storage.updateMessage(parseInt(id), validatedData);
      res.json(updatedMessage);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid message data", 
          errors: error.errors 
        });
      }
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete("/api/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessage(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      return res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Scheduled Notification endpoints (admin-only)
  app.get("/api/scheduled-notifications", requireAdminAuth, async (req, res) => {
    try {
      const notifications = await storage.getAllScheduledNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      return res.status(500).json({ message: "Failed to fetch scheduled notifications" });
    }
  });

  app.get("/api/scheduled-notifications/upcoming", requireAdminAuth, async (req, res) => {
    try {
      const notifications = await storage.getUpcomingScheduledNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching upcoming scheduled notifications:", error);
      return res.status(500).json({ message: "Failed to fetch upcoming scheduled notifications" });
    }
  });

  app.get("/api/scheduled-notifications/pending", requireAdminAuth, async (req, res) => {
    try {
      const notifications = await storage.getPendingScheduledNotifications();
      res.json(notifications);
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
      res.json(newNotification);
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
      const updatedNotification = await storage.updateScheduledNotification(parseInt(id), validatedData);
      res.json(updatedNotification);
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
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled notification:", error);
      return res.status(500).json({ message: "Failed to delete scheduled notification" });
    }
  });

  // Push notification endpoints
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY || null });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, sessionId } = req.body;
      
      // Validate subscription structure
      if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ error: "Invalid subscription object - missing required fields" });
      }

      const savedSubscription = await storage.subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        sessionId: sessionId || null
      });

      res.json({ 
        success: true, 
        message: "Successfully subscribed to push notifications",
        subscriptionId: savedSubscription.id 
      });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await storage.unsubscribeFromPush(endpoint);
      res.json({ success: true, message: "Successfully unsubscribed from push notifications" });
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      return res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  // Admin endpoint to send push notifications
  app.post("/api/push/send", requireAdminAuth, async (req, res) => {
    try {
      const { title, body, icon, badge, url, requireInteraction } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      // Get all active subscriptions
      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: false, 
          message: "No active subscriptions found",
          sentCount: 0 
        });
      }

      // Create notification record
      const notification = await storage.createNotification({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        url: url || '/',
        data: { timestamp: Date.now() },
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
        createdBy: 'admin'
      });

      // Send to all subscriptions
      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        url: url || '/',
        requireInteraction: requireInteraction || false,
        timestamp: Date.now()
      });

      let successCount = 0;
      let failureCount = 0;

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          // Validate subscription before sending
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.markSubscriptionInvalid(sub.endpoint, 400, "Invalid subscription structure");
            failureCount++;
            return;
          }
          
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          
          // Success - mark as valid
          await storage.markSubscriptionValid(sub.endpoint);
          successCount++;
        } catch (error: any) {
          const statusCode = error.statusCode || error.status;
          const errorCategory = PushRetryQueue.categorizeError(statusCode);
          
          console.error(`Push notification failed for ${sub.endpoint.substring(0, 50)}...`, {
            statusCode,
            message: error.message,
            category: errorCategory.type,
            action: errorCategory.action
          });
          
          // Handle based on error category
          if (errorCategory.action === 'remove') {
            // Terminal error - mark as invalid and will auto-unsubscribe after 3 failures
            await storage.markSubscriptionInvalid(sub.endpoint, statusCode, error.message);
            failureCount++;
          } else if (errorCategory.action === 'retry') {
            // Temporary error - add to retry queue
            pushRetryQueue.add(sub, payload, notification.id);
            failureCount++; // Count as failure for now, will be retried
          } else if (errorCategory.action === 'keep') {
            // Config error - keep subscription, log for admin
            console.error(`Configuration issue: ${errorCategory.description}`);
            failureCount++;
          } else {
            // Unknown - add to retry queue to be safe
            pushRetryQueue.add(sub, payload, notification.id);
            failureCount++;
          }
        }
      });

      await Promise.all(sendPromises);

      // Update notification stats
      await storage.updateNotificationStats(notification.id, successCount, failureCount);

      res.json({ 
        success: true, 
        message: `Sent to ${successCount} users`,
        sentCount: successCount + failureCount,
        successCount,
        failureCount
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      return res.status(500).json({ error: "Failed to send push notification" });
    }
  });

  // Get notification history (admin)
  app.get("/api/push/history", requireAdminAuth, async (req, res) => {
    try {
      const history = await storage.getNotificationHistory(50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      return res.status(500).json({ error: "Failed to fetch notification history" });
    }
  });

  // Simple test push - minimal payload
  app.post("/api/push/simple-test", async (req, res) => {
    try {
      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ success: false, message: "No subscriptions" });
      }

      // Extremely simple payload - just title
      const payload = JSON.stringify({
        title: "Test Push"
      });

      console.log('[Simple Test] Sending minimal payload:', payload);
      
      let sent = 0;
      for (const sub of subscriptions) {
        try {
          // Validate subscription before sending
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.unsubscribeFromPush(sub.endpoint);
            continue;
          }
          
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          sent++;
          console.log('[Simple Test] Sent successfully');
        } catch (error: any) {
          console.error('[Simple Test] Error:', error.statusCode, error.message);
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 400) {
            await storage.unsubscribeFromPush(sub.endpoint);
          }
        }
      }

      res.json({ success: sent > 0, sent });
    } catch (error) {
      console.error("[Simple Test] Error:", error);
      return res.status(500).json({ error: "Failed" });
    }
  });

  // Test push notification endpoint (for debugging)
  app.post("/api/push/test", async (req, res) => {
    try {
      const { title, body } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      // Get all active subscriptions
      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: false, 
          message: "No active subscriptions found",
          sentCount: 0 
        });
      }

      // Send test notification
      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        timestamp: Date.now()
      });

      console.log('[Test Push] Sending to', subscriptions.length, 'subscription(s)');
      console.log('[Test Push] Payload:', payload);

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          // Validate subscription before sending
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.unsubscribeFromPush(sub.endpoint);
            failureCount++;
            errors.push(`Invalid subscription structure`);
            return;
          }
          
          console.log('[Test Push] Sending to endpoint:', sub.endpoint.substring(0, 50) + '...');
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          successCount++;
          console.log('[Test Push] Success for endpoint:', sub.endpoint.substring(0, 50) + '...');
        } catch (error: any) {
          failureCount++;
          const errorMsg = `Endpoint ${sub.endpoint.substring(0, 50)}...: ${error.message}`;
          errors.push(errorMsg);
          console.error('[Test Push] Failed:', errorMsg);
          
          // If subscription is invalid/expired (terminal errors), mark it as unsubscribed
          const statusCode = error.statusCode || error.status;
          if (statusCode === 410 || statusCode === 404 || statusCode === 400) {
            await storage.unsubscribeFromPush(sub.endpoint);
            console.log('[Test Push] Removed invalid subscription (', statusCode, ')');
          } else if (statusCode === 401 || statusCode === 403) {
            console.error('[Test Push] Auth error - check VAPID configuration');
          }
        }
      });

      await Promise.all(sendPromises);

      res.json({ 
        success: successCount > 0, 
        message: `Sent to ${successCount} users, ${failureCount} failed`,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("[Test Push] Error:", error);
      return res.status(500).json({ error: "Failed to send test push notification" });
    }
  });

  // Subscription validation endpoint (admin only)
  app.post("/api/push/validate-subscriptions", requireAdminAuth, async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptionsNeedingValidation(24);
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: true, 
          message: "All subscriptions are up to date",
          validated: 0
        });
      }

      // Send lightweight validation ping
      const validationPayload = JSON.stringify({
        title: "Connection Check",
        body: "",
        tag: "validation-ping",
        silent: true,
        data: { type: "validation" }
      });

      let validCount = 0;
      let invalidCount = 0;
      const errors: Array<{ endpoint: string; error: string }> = [];

      for (const sub of subscriptions) {
        try {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.markSubscriptionInvalid(sub.endpoint, 400, "Invalid subscription structure");
            invalidCount++;
            continue;
          }

          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, validationPayload);

          // Success - mark as valid
          await storage.markSubscriptionValid(sub.endpoint);
          validCount++;
        } catch (error: any) {
          const statusCode = error.statusCode || error.status;
          const errorMessage = error.message;
          
          // Mark as invalid with error details
          await storage.markSubscriptionInvalid(sub.endpoint, statusCode, errorMessage);
          invalidCount++;
          
          errors.push({
            endpoint: sub.endpoint.substring(0, 50) + "...",
            error: `${statusCode || 'Unknown'}: ${errorMessage}`
          });
        }
      }

      res.json({
        success: true,
        message: `Validated ${subscriptions.length} subscriptions`,
        validCount,
        invalidCount,
        totalChecked: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error validating subscriptions:", error);
      return res.status(500).json({ error: "Failed to validate subscriptions" });
    }
  });

  // Get all subscriptions with health status (admin only)
  app.get("/api/push/subscriptions", requireAdminAuth, async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      
      // Return sanitized subscription data with health metrics
      const sanitized = subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + "...",
        sessionId: sub.sessionId,
        subscribed: sub.subscribed,
        lastValidatedAt: sub.lastValidatedAt,
        validationFailures: sub.validationFailures,
        lastErrorCode: sub.lastErrorCode,
        lastErrorMessage: sub.lastErrorMessage,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }));

      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Get retry queue status (admin only)
  app.get("/api/push/queue-status", requireAdminAuth, (req, res) => {
    const status = pushRetryQueue.getStatus();
    res.json(status);
  });

  const httpServer = createServer(app);
  return httpServer;
}
