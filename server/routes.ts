import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage.js";
import serverAxiosClient from "./axiosClient.js";
import path from "path";
import { fileURLToPath } from "url";
import { find as findTimezone } from "geo-tz";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});
import { 
  insertTehillimNameSchema,
  insertDailyHalachaSchema,
  insertDailyEmunaSchema,
  insertDailyChizukSchema,
  insertFeaturedContentSchema,
  insertDailyRecipeSchema,
  insertParshaVortSchema,
  insertTableInspirationSchema,
  insertNishmasTextSchema
} from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Schedule periodic cleanup of expired names (every hour)
  setInterval(async () => {
    try {
      await storage.cleanupExpiredNames();
      // Cleaned up expired Tehillim names
    } catch (error) {
      console.error('Error cleaning up expired names:', error);
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
      
      console.log('Calendar download request:', { title, hebrewDate, gregorianDate, years, afterNightfall });
      
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
              console.error(`Failed to convert Hebrew date for year ${targetYear}:`, error);
            }
          }
        } catch (error) {
          console.error('Hebrew date conversion error:', error);
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
      console.error('Calendar download error:', error);
      res.status(500).json({ message: "Failed to generate calendar" });
    }
  });



  // Hebcal Zmanim API proxy route
  app.get("/api/zmanim/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const today = new Date().toISOString().split('T')[0];
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Comprehensive worldwide timezone detection using geo-tz library
      let tzid = 'America/New_York'; // Default fallback
      
      // Log coordinates for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Zmanim request for coordinates: lat=${latitude}, lng=${longitude}`);
      }
      
      try {
        // Use geo-tz library for accurate worldwide timezone detection
        const timezones = findTimezone(latitude, longitude);
        
        if (timezones && timezones.length > 0) {
          tzid = timezones[0]; // Use the first (most accurate) timezone
          if (process.env.NODE_ENV === 'development') {
            console.log(`geo-tz detected timezone: ${tzid} for coordinates lat=${latitude}, lng=${longitude}`);
            if (timezones.length > 1) {
              console.log(`Alternative timezones available: ${timezones.slice(1).join(', ')}`);
            }
          }
        } else {
          // Fallback to basic detection for edge cases
          if (process.env.NODE_ENV === 'development') {
            console.log(`geo-tz returned no timezones, using fallback detection`);
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
          console.error('geo-tz timezone detection error:', error);
        }
        // Keep default fallback timezone
      }
      
      // Log final timezone selection
      if (process.env.NODE_ENV === 'development') {
        console.log(`Final selected timezone: ${tzid} for coordinates lat=${latitude}, lng=${longitude}`);
      }
      
      // Call Hebcal with exact coordinates
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&latitude=${latitude}&longitude=${longitude}&tzid=${tzid}&date=${today}`;
      const response = await serverAxiosClient.get(hebcalUrl);
      const data = response.data;
      
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
            console.error('Time formatting error:', error, 'for time:', timeStr);
          }
          return timeStr;
        }
      };

      // Get a more user-friendly location name using reverse geocoding
      let locationName = 'Current Location';
      
      try {
        // Use OpenStreetMap Nominatim API for free reverse geocoding
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        const geocodeResponse = await serverAxiosClient.get(nominatimUrl, {
          headers: {
            'User-Agent': 'EzrasNashim/1.0 (jewish-prayer-app)'
          }
        });
        
        if (geocodeResponse.data && geocodeResponse.data.address) {
          const address = geocodeResponse.data.address;
          
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
          } else if (geocodeResponse.data.display_name) {
            // Use display name but clean it up
            const parts = geocodeResponse.data.display_name.split(',');
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
          console.warn('Reverse geocoding failed:', geocodeError);
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
        hebrewDate: data.date || '',
        location: locationName,
        coordinates: {
          lat: latitude,
          lng: longitude
        },
        
        // TODO: Add notification/reminder functionality
        // - Can set alerts for specific zmanim times
        // - Push notifications for important times like candle lighting
        
        // TODO: Add minhag customization options
        // - Different calculations for tzait hakochavim (18 min, 42 min, etc.)
        // - Sephardic vs Ashkenazi customs for zmanim
        // - Custom candle lighting time preferences
      };
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Formatted times for ${locationName}:`, {
          sunrise: formattedTimes.sunrise,
          minchaGedolah: formattedTimes.minchaGedolah,
          shkia: formattedTimes.shkia,
          tzid: tzid
        });
      }

      res.json(formattedTimes);
    } catch (error) {
      console.error('Error fetching Hebcal zmanim:', error);
      res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
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

      console.log(`[Server API Request] GET https://www.hebcal.com/shabbat/?cfg=json&latitude=${latitude}&longitude=${longitude}`);
      
      const response = await fetch(
        `https://www.hebcal.com/shabbat/?cfg=json&latitude=${latitude}&longitude=${longitude}`
      );
      
      console.log(`[Server API Response] ${response.status} GET https://www.hebcal.com/shabbat/?cfg=json&latitude=${latitude}&longitude=${longitude}`);

      if (!response.ok) {
        throw new Error('Failed to fetch Shabbos times from Hebcal');
      }

      const data = await response.json();

      // Get location name from our zmanim endpoint for consistency
      const zmanimResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/zmanim/${latitude}/${longitude}`);
      const zmanimData = await zmanimResponse.json();

      // Parse the Shabbos data
      const result = {
        location: zmanimData.location || 'Unknown Location',
        candleLighting: null as string | null,
        havdalah: null as string | null,
        parsha: null as string | null
      };

      data.items.forEach((item: any) => {
        console.log('Processing item:', item.title);
        if (item.title.includes("Candle lighting:")) {
          // Extract time with possible pm/am suffix (e.g., "Candle lighting: 8:00pm" or "Candle lighting: 19:23")
          const timeMatch = item.title.match(/Candle lighting: (\d{1,2}:\d{2})(pm|am|p\.m\.|a\.m\.)?/i);
          console.log('Candle lighting timeMatch:', timeMatch);
          if (timeMatch) {
            const [hours, minutes] = timeMatch[1].split(':');
            const hour12 = parseInt(hours);
            const suffix = timeMatch[2]?.toLowerCase();
            
            console.log('Candle lighting - hour12:', hour12, 'minutes:', minutes, 'suffix:', suffix);
            
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
            console.log('Final candleLighting:', result.candleLighting);
          }
        } else if (item.title.includes("Havdalah:")) {
          console.log('Full title for havdalah:', item.title);
          // Check if it has pm/am at the end of the full title  
          const timeWithSuffixMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})\s*(pm|am)/i);
          if (timeWithSuffixMatch) {
            const [, time, suffix] = timeWithSuffixMatch;
            const [hours, minutes] = time.split(':');
            const hour12 = parseInt(hours);
            console.log('Havdalah with suffix - hour12:', hour12, 'minutes:', minutes, 'suffix:', suffix);
            const displayHour = hour12 === 0 ? 12 : hour12;
            result.havdalah = `${displayHour}:${minutes} ${suffix.toUpperCase()}`;
            console.log('Final havdalah:', result.havdalah);
          } else {
            // Try 24-hour format
            const timeMatch = item.title.match(/Havdalah: (\d{1,2}:\d{2})/);
            if (timeMatch) {
              const [hours, minutes] = timeMatch[1].split(':');
              const hour24 = parseInt(hours);
              console.log('Havdalah 24hr - hour24:', hour24, 'minutes:', minutes);
              const displayHour = hour24 > 12 ? hour24 - 12 : (hour24 === 0 ? 12 : hour24);
              const period = hour24 >= 12 ? 'PM' : 'AM';
              result.havdalah = `${displayHour}:${minutes} ${period}`;
              console.log('Final havdalah:', result.havdalah);
            }
          }
        } else if (item.title.startsWith("Parashat ") || item.title.startsWith("Parashah ")) {
          result.parsha = item.title;
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching Shabbos times:', error);
      res.status(500).json({ message: "Failed to fetch Shabbos times from Hebcal API" });
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
                console.log('Found English text:', englishText.substring(0, 50) + '...');
              }
            } catch (englishError) {
              if (process.env.NODE_ENV === 'development') {
                console.log('No English version available for:', url);
              }
            }
            
            return {
              hebrew: hebrewText,
              english: englishText,
              ref: hebrewResponse.data?.ref || ''
            };
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Error fetching morning blessing from Sefaria:', error);
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
        console.error('Error fetching morning brochas from Sefaria:', error);
      }
      res.status(500).json({ message: "Failed to fetch morning brochas from Sefaria API" });
    }
  });





  // Handle preflight OPTIONS request for calendar download
  app.options("/api/calendar-events/download", (req, res) => {
    console.log('OPTIONS preflight request for calendar download');
    res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  });

  // Generate and download ICS calendar file
  app.post("/api/calendar-events/download", async (req, res) => {
    try {
      console.log('Calendar download request received:', { 
        method: req.method,
        headers: req.headers,
        body: req.body,
        origin: req.get('origin')
      });
      
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
      res.status(500).json({ 
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
      res.status(500).json({ message: "Failed to fetch shop items" });
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
      res.status(500).json({ message: "Failed to fetch shop item" });
    }
  });

  // Hebcal API proxy
  app.get("/api/hebcal/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await serverAxiosClient.get(hebcalUrl);
      const data = response.data;
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch from Hebcal API" });
    }
  });

  // Table inspiration routes
  app.get("/api/table/inspiration/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const inspiration = await storage.getTableInspirationByDate(date);
      res.json(inspiration || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table inspiration" });
    }
  });

  app.post("/api/table/inspiration", async (req, res) => {
    try {
      const validatedData = insertTableInspirationSchema.parse(req.body);
      const inspiration = await storage.createTableInspiration(validatedData);
      res.json(inspiration);
    } catch (error) {
      res.status(500).json({ message: "Failed to create table inspiration" });
    }
  });

  // Community impact routes
  app.get("/api/community/impact/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const impact = await storage.getCommunityImpactByDate(date);
      res.json(impact || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  // Mincha routes
  app.get("/api/mincha/prayers", async (req, res) => {
    try {
      const prayers = await storage.getMinchaPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Mincha prayers" });
    }
  });

  // Morning prayer routes
  app.get("/api/morning/prayers", async (req, res) => {
    try {
      const prayers = await storage.getMorningPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Morning prayers" });
    }
  });

  // Maariv routes
  app.get("/api/maariv/prayers", async (req, res) => {
    try {
      const prayers = await storage.getMaarivPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Maariv prayers" });
    }
  });

  // After Brochas routes
  app.get("/api/after-brochas/prayers", async (req, res) => {
    try {
      const prayers = await storage.getAfterBrochasPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch After Brochas prayers" });
    }
  });

  app.post("/api/after-brochas/prayers", async (req, res) => {
    try {
      const prayer = await storage.createAfterBrochasPrayer(req.body);
      res.json(prayer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create After Brochas prayer" });
    }
  });

  // Birkat Hamazon routes
  app.get("/api/birkat-hamazon/prayers", async (req, res) => {
    try {
      const prayers = await storage.getBirkatHamazonPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Birkat Hamazon prayers" });
    }
  });

  app.post("/api/birkat-hamazon/prayers", async (req, res) => {
    try {
      const prayer = await storage.createBirkatHamazonPrayer(req.body);
      res.json(prayer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Birkat Hamazon prayer" });
    }
  });

  // Sponsor routes
  app.get("/api/sponsors/:contentType/:date", async (req, res) => {
    try {
      const { contentType, date } = req.params;
      const sponsor = await storage.getSponsorByContentTypeAndDate(contentType, date);
      res.json(sponsor || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsor" });
    }
  });

  app.get("/api/sponsors/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const sponsor = await storage.getDailySponsor(date);
      res.json(sponsor || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily sponsor" });
    }
  });

  app.get("/api/sponsors", async (req, res) => {
    try {
      const sponsors = await storage.getActiveSponsors();
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post("/api/sponsors", async (req, res) => {
    try {
      const sponsor = await storage.createSponsor(req.body);
      res.json(sponsor);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaign = await storage.getActiveCampaign();
      res.json(campaign || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active campaign" });
    }
  });

  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Daily Torah content routes
  app.get("/api/torah/halacha/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const halacha = await storage.getDailyHalachaByDate(date);
      res.json(halacha || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily halacha" });
    }
  });

  app.post("/api/torah/halacha", async (req, res) => {
    try {
      const validatedData = insertDailyHalachaSchema.parse(req.body);
      const halacha = await storage.createDailyHalacha(validatedData);
      res.json(halacha);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily halacha" });
    }
  });

  app.get("/api/torah/emuna/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const emuna = await storage.getDailyEmunaByDate(date);
      res.json(emuna || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily emuna" });
    }
  });

  app.post("/api/torah/emuna", async (req, res) => {
    try {
      const validatedData = insertDailyEmunaSchema.parse(req.body);
      const emuna = await storage.createDailyEmuna(validatedData);
      res.json(emuna);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily emuna" });
    }
  });

  app.get("/api/torah/chizuk/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const chizuk = await storage.getDailyChizukByDate(date);
      res.json(chizuk || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily chizuk" });
    }
  });

  app.post("/api/torah/chizuk", async (req, res) => {
    try {
      const validatedData = insertDailyChizukSchema.parse(req.body);
      const chizuk = await storage.createDailyChizuk(validatedData);
      res.json(chizuk);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily chizuk" });
    }
  });

  app.get("/api/torah/featured/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const featured = await storage.getFeaturedContentByDate(date);
      res.json(featured || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured content" });
    }
  });

  app.post("/api/torah/featured", async (req, res) => {
    try {
      const validatedData = insertFeaturedContentSchema.parse(req.body);
      const featured = await storage.createFeaturedContent(validatedData);
      res.json(featured);
    } catch (error) {
      res.status(500).json({ message: "Failed to create featured content" });
    }
  });

  app.get("/api/torah/pirkei-avot/:date", async (req, res) => {
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
      res.status(500).json({ message: "Failed to fetch Pirkei Avot content" });
    }
  });

  app.post("/api/torah/pirkei-avot/advance", async (req, res) => {
    try {
      const progress = await storage.advancePirkeiAvotProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to advance Pirkei Avot progress" });
    }
  });

  // New routes for Pirkei Avot management
  app.get("/api/pirkei-avot", async (req, res) => {
    try {
      const allPirkeiAvot = await storage.getAllPirkeiAvot();
      res.json(allPirkeiAvot);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all Pirkei Avot content" });
    }
  });

  app.post("/api/pirkei-avot", async (req, res) => {
    try {
      const newPirkeiAvot = await storage.createPirkeiAvot(req.body);
      res.json(newPirkeiAvot);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Pirkei Avot content" });
    }
  });

  // Daily recipe routes
  app.get("/api/table/recipe/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const recipe = await storage.getDailyRecipeByDate(date);
      res.json(recipe || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily recipe" });
    }
  });

  app.get("/api/table/recipe", async (req, res) => {
    try {
      // Get current date
      const today = new Date().toISOString().split('T')[0];
      
      const recipe = await storage.getDailyRecipeByDate(today);
      res.json(recipe || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily recipe" });
    }
  });

  app.post("/api/table/recipe", async (req, res) => {
    try {
      const validatedData = insertDailyRecipeSchema.parse(req.body);
      const recipe = await storage.createDailyRecipe(validatedData);
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily recipe" });
    }
  });

  app.get("/api/table/vort/:week", async (req, res) => {
    try {
      const { week } = req.params;
      const vort = await storage.getParshaVortByWeek(week);
      res.json(vort || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Parsha vort" });
    }
  });

  app.get("/api/table/vort", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const vort = await storage.getParshaVortByDate(today);
      res.json(vort || null);
    } catch (error) {
      console.error('Error fetching Parsha vort:', error);
      res.status(500).json({ message: "Failed to fetch Parsha vort" });
    }
  });

  app.post("/api/table/vort", async (req, res) => {
    try {
      const validatedData = insertParshaVortSchema.parse(req.body);
      const vort = await storage.createParshaVort(validatedData);
      res.json(vort);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Parsha vort" });
    }
  });

  // Zmanim route that returns parsed and adjusted times
  app.get("/api/zmanim/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
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
      res.status(500).json({ message: "Failed to fetch zmanim data" });
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
      res.status(500).json({ error: "Failed to fetch Tehillim progress" });
    }
  });

  app.post("/api/tehillim/complete", async (req, res) => {
    try {
      const { currentPerek, language, completedBy } = req.body;
      
      if (!currentPerek || currentPerek < 1 || currentPerek > 150) {
        return res.status(400).json({ error: "Invalid perek number" });
      }
      
      if (!language || !['english', 'hebrew'].includes(language)) {
        return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
      }
      
      const updatedProgress = await storage.updateGlobalTehillimProgress(currentPerek, language, completedBy);
      res.json(updatedProgress);
    } catch (error) {
      console.error('Error completing Tehillim:', error);
      res.status(500).json({ error: "Failed to complete Tehillim" });
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
      res.status(500).json({ message: "Failed to fetch current name" });
    }
  });

  app.get("/api/tehillim/names", async (req, res) => {
    try {
      const names = await storage.getActiveNames();
      res.json(names);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Tehillim names" });
    }
  });

  // Global Tehillim Progress endpoint
  app.get("/api/tehillim/global-progress", async (_req, res) => {
    try {
      const progress = await storage.getGlobalTehillimProgress();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching global tehillim progress:", error);
      res.status(500).json({ message: "Failed to fetch global tehillim progress" });
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
      res.status(500).json({ error: "Failed to fetch Tehillim info" });
    }
  });

  // Get Tehillim text from Supabase
  app.get("/api/tehillim/text/:perek", async (req, res) => {
    try {
      const perek = parseInt(req.params.perek);
      const language = req.query.language as string || 'english';
      
      if (isNaN(perek) || perek < 1 || perek > 150) {
        return res.status(400).json({ error: "Perek must be between 1 and 150" });
      }
      
      if (!['english', 'hebrew'].includes(language)) {
        return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
      }
      
      // Use new Supabase method instead of Sefaria
      const tehillimData = await storage.getSupabaseTehillim(perek, language);
      res.json(tehillimData);
    } catch (error) {
      console.error('Error fetching Tehillim text:', error);
      res.status(500).json({ error: "Failed to fetch Tehillim text" });
    }
  });

  // Get Tehillim text by ID (for proper part handling of Psalm 119)
  app.get("/api/tehillim/text/by-id/:id", async (req, res) => {
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
      res.status(500).json({ error: "Failed to fetch Tehillim text" });
    }
  });

  // Get Tehillim preview (first line) from Sefaria API
  app.get("/api/tehillim/preview/:perek", async (req, res) => {
    try {
      const perek = parseInt(req.params.perek);
      const language = req.query.language as string || 'hebrew';
      
      if (isNaN(perek) || perek < 1 || perek > 150) {
        return res.status(400).json({ error: 'Perek must be between 1 and 150' });
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
      res.status(500).json({ error: 'Failed to fetch Tehillim preview' });
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

  // Nishmas text routes
  app.get("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const text = await storage.getNishmasTextByLanguage(language);
      res.json(text || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Nishmas text" });
    }
  });

  app.post("/api/nishmas", async (req, res) => {
    try {
      const validatedData = insertNishmasTextSchema.parse(req.body);
      const text = await storage.createNishmasText(validatedData);
      res.json(text);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Nishmas text" });
    }
  });

  app.put("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const validatedData = insertNishmasTextSchema.partial().parse(req.body);
      const text = await storage.updateNishmasText(language, validatedData);
      res.json(text);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Nishmas text" });
    }
  });

  // Pirkei Avot progression route
  app.get("/api/pirkei-avot/progress", async (req, res) => {
    try {
      const progress = await storage.getPirkeiAvotProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Pirkei Avot progress" });
    }
  });

  // Women's prayer routes
  app.get("/api/womens-prayers/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const prayers = await storage.getWomensPrayersByCategory(category);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch women's prayers" });
    }
  });

  app.get("/api/womens-prayers/prayer/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prayer = await storage.getWomensPrayerById(parseInt(id));
      res.json(prayer || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayer" });
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
      
      const promotion = await storage.getActiveDiscountPromotion(userLocation);
      res.json(promotion || null);
    } catch (error) {
      console.error('Error fetching discount promotion:', error);
      res.status(500).json({ message: "Failed to fetch active discount promotion" });
    }
  });



  // Donation completion handler
  app.post("/api/donation-complete", async (req, res) => {
    try {
      const { donationType, sponsorName, dedication, message } = req.body;
      
      // Only create sponsor record for "Sponsor a Day" donations
      if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
        const today = new Date().toISOString().split('T')[0];
        
        // Create sponsor record
        await storage.createSponsor({
          name: sponsorName,
          sponsorshipDate: today,
          inHonorMemoryOf: dedication || null,
          message: message || null,
          isActive: true
        });
        
        console.log(`Created sponsor record for ${sponsorName} on ${today}`);
        res.json({ success: true, message: 'Sponsor record created' });
      } else {
        res.json({ success: true, message: 'No sponsor record needed' });
      }
    } catch (error: any) {
      console.error('Failed to create sponsor record:', error);
      res.status(500).json({ 
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
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Keep old audio proxy for backward compatibility
  app.get("/api/audio-proxy/:fileId", async (req, res) => {
    const { fileId } = req.params;
    // Redirect to new universal proxy with gdrive service
    res.redirect(`/api/media-proxy/gdrive/${fileId}`);
  });

  // Serve frontend application on root route
  app.get("/", (req, res) => {
    // In Replit environment, we need to serve the frontend differently
    if (process.env.REPLIT_DOMAINS) {
      // For Replit, redirect to the frontend port
      const replitDomain = process.env.REPLIT_DOMAINS;
      res.redirect(`https://${replitDomain}`);
    } else {
      // Local development
      res.redirect("http://localhost:5173");
    }
  });

  // Stripe webhook handler for processing successful payments
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In development mode without webhook secret, skip verification
      if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('⚠️ WARNING: Running webhook without signature verification in development mode');
        event = req.body;
      } else {
        // Production mode or webhook secret available - verify signature
        if (!sig) {
          throw new Error('Missing stripe signature');
        }
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          throw new Error('Missing stripe webhook secret');
        }
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      return res.status(400).send(`Webhook Error: ${errorMessage}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          
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
              amount: paymentIntent.amount
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
            const today = new Date().toISOString().split('T')[0];
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
          console.log('Checkout session completed:', session.id);
          
          // Get the payment intent from the session
          const paymentIntentId = session.payment_intent;
          console.log('Payment intent from session:', paymentIntentId);
          
          // Find donation by session ID (stored in stripe_payment_intent_id field incorrectly)
          const sessionDonation = await storage.getDonationByPaymentIntentId(session.id);
          if (sessionDonation) {
            // Update the donation with correct payment intent ID and status
            await storage.updateDonation(sessionDonation.id, {
              stripePaymentIntentId: paymentIntentId as string,
              status: 'succeeded'
            });
            console.log('Updated donation with correct payment intent ID');
            
            // Extract metadata from session
            const buttonType = session.metadata?.buttonType || 'active_campaign';
            const amount = session.amount_total || 100;
            
            // Create an act record for tracking
            await storage.createAct({
              userId: null,
              category: 'tzedaka',
              subtype: buttonType,
              amount: amount
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
            const today = new Date().toISOString().split('T')[0];
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
      res.status(500).json({ error: 'Webhook processing failed' });
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
      res.status(500).json({ completed: false, error: 'Failed to check completion' });
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
      res.status(500).json({ message: "Failed to process donation success" });
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
      res.status(500).json({ message: "Failed to update donation status" });
    }
  });

  // Analytics routes
  // Only track essential completion events (not page views)
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, eventData, sessionId } = req.body;
      
      // Only allow completion events, reject high-volume events like page_view
      const allowedEvents = ['modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete', 'tzedaka_completion'];
      if (!allowedEvents.includes(eventType)) {
        return res.status(400).json({ message: "Event type not tracked" });
      }
      
      const event = await storage.trackEvent({
        eventType,
        eventData,
        sessionId
      });
      
      // Immediately recalculate today's stats to show live updates
      const today = new Date().toISOString().split('T')[0];
      await storage.recalculateDailyStats(today);
      
      res.json(event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      res.status(500).json({ message: "Failed to track event" });
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
      res.status(500).json({ message: "Failed to record session" });
    }
  });

  // Data cleanup endpoint - remove old analytics data
  app.post("/api/analytics/cleanup", async (req, res) => {
    try {
      await storage.cleanupOldAnalytics();
      res.json({ success: true, message: "Old analytics data cleaned up" });
    } catch (error) {
      console.error('Error cleaning up analytics:', error);
      res.status(500).json({ message: "Failed to cleanup analytics" });
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
      
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDailyStats(today);
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
      res.status(500).json({ message: "Failed to fetch today's stats" });
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
      res.status(500).json({ message: "Failed to fetch monthly stats" });
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
      res.status(500).json({ message: "Failed to fetch total stats" });
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
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/community-impact", async (req, res) => {
    try {
      const period = req.query.period as string || 'alltime';
      const impact = await storage.getCommunityImpact(period);
      res.json(impact);
    } catch (error) {
      console.error('Error fetching community impact:', error);
      res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  // IP-based location detection (works with VPN)
  app.get("/api/location/ip", async (req, res) => {
    try {
      // Get client IP address
      const clientIP = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection as any)?.socket?.remoteAddress ||
                      '127.0.0.1';
      
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
      res.status(500).json({ error: 'Failed to detect location from IP' });
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
      res.status(500).json({ message: "Failed to fetch location data" });
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
        `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&mf=on&ss=on&mod=on&nx=on&o=on&s=on`
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
        res.json({
          hebrew: hebrewResponse.data.hebrew || '',
          date: date,
          isRoshChodesh,
          events,
          hebrewDay: hebrewResponse.data.hd,
          hebrewMonth: hebrewResponse.data.hm,
          hebrewYear: hebrewResponse.data.hy
        });
      } else {
        res.status(404).json({ message: "Hebrew date not found" });
      }
    } catch (error) {
      console.error('Error fetching Hebrew date:', error);
      res.status(500).json({ message: "Failed to fetch Hebrew date data" });
    }
  });

  app.get("/healthcheck", (req, res) => {
    res.json({ status: "OK" });
  })
  
  // Version endpoint for PWA update checking
  // Use server start time as the build timestamp to detect actual deployments
  let SERVER_START_TIME = Date.now();
  
  // Update build timestamp when server restarts (deployment detection)
  const updateBuildTimestamp = () => {
    SERVER_START_TIME = Date.now();
    console.log('Updated build timestamp to:', new Date(SERVER_START_TIME).toISOString());
  };
  
  app.get("/api/version", (req, res) => {
    const version = {
      timestamp: SERVER_START_TIME,
      version: process.env.APP_VERSION || '1.0.1',
      buildDate: new Date(SERVER_START_TIME).toISOString(),
      serverUptime: Date.now() - SERVER_START_TIME
    };
    res.json(version);
  });
  
  // Endpoint to manually trigger version update (for testing)
  app.post("/api/version/update", (req, res) => {
    updateBuildTimestamp();
    res.json({ message: "Build timestamp updated", timestamp: SERVER_START_TIME });
  });

  // Messages routes
  app.get("/api/messages/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const message = await storage.getMessageByDate(date);
      
      if (!message) {
        return res.status(404).json({ message: "No message found for this date" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      const newMessage = await storage.createMessage(messageData);
      res.json(newMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
