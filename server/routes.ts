import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage.js";
import serverAxiosClient from "./axiosClient.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { 
  insertTehillimNameSchema,
  insertDailyHalachaSchema,
  insertDailyEmunaSchema,
  insertDailyChizukSchema,
  insertFeaturedContentSchema,
  insertShabbatRecipeSchema,
  insertParshaVortSchema,
  insertTableInspirationSchema,
  insertNishmasTextSchema
} from "../shared/schema.js";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {

  // Media serving route for attached assets
  app.get("/api/media/:filename", (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      const mediaPath = path.join(__dirname, "..", "attached_assets", filename);
      
      // Set appropriate headers for images
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      
      res.sendFile(mediaPath, (err) => {
        if (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error serving media file:', err);
          }
          res.status(404).json({ error: 'Media file not found' });
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Media route error:', error);
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Hebcal Zmanim API proxy route
  app.get("/api/zmanim/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const today = new Date().toISOString().split('T')[0];
      
      // Map coordinates to nearest major city geonameid
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Find closest major Jewish community by distance
      const cities = [
        { name: "New York City, New York, USA", geonameid: 5128581, lat: 40.7128, lng: -74.0060 },
        { name: "Los Angeles, California, USA", geonameid: 5368361, lat: 34.0522, lng: -118.2437 },
        { name: "Chicago, Illinois, USA", geonameid: 4887398, lat: 41.8781, lng: -87.6298 },
        { name: "Philadelphia, Pennsylvania, USA", geonameid: 4560349, lat: 39.9526, lng: -75.1652 },
        { name: "Miami, Florida, USA", geonameid: 4164138, lat: 25.7617, lng: -80.1918 },
        { name: "Boston, Massachusetts, USA", geonameid: 4930956, lat: 42.3601, lng: -71.0589 },
        { name: "Baltimore, Maryland, USA", geonameid: 4347778, lat: 39.2904, lng: -76.6122 },
        { name: "Brooklyn, New York, USA", geonameid: 5110302, lat: 40.6782, lng: -73.9442 },
        { name: "Jerusalem, Israel", geonameid: 281184, lat: 31.7683, lng: 35.2137 },
        { name: "Tel Aviv, Israel", geonameid: 293397, lat: 32.0853, lng: 34.7818 },
        { name: "London, England, UK", geonameid: 2643743, lat: 51.5074, lng: -0.1278 },
        { name: "Toronto, Ontario, Canada", geonameid: 6167865, lat: 43.6532, lng: -79.3832 }
      ];
      
      // Calculate distance and find closest city
      let closestCity = cities[0]; // Default to NYC
      let minDistance = Number.MAX_VALUE;
      
      for (const city of cities) {
        const distance = Math.sqrt(
          Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      }
      
      // Call Hebcal with geonameid
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${closestCity.geonameid}&date=${today}`;
      const response = await serverAxiosClient.get(hebcalUrl);
      const data = response.data;
      
      // Format times to 12-hour format with AM/PM
      const formatTime = (timeStr: string) => {
        if (!timeStr) return null;
        try {
          // Parse ISO timestamp and extract local time components
          const match = timeStr.match(/T(\d{2}):(\d{2}):/);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = match[2];
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${displayHours}:${minutes} ${period}`;
          }
          return timeStr;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Time formatting error:', error, 'for time:', timeStr);
          }
          return timeStr;
        }
      };

      const formattedTimes = {
        sunrise: formatTime(data.times?.sunrise),
        shkia: formatTime(data.times?.sunset),
        tzaitHakochavim: formatTime(data.times?.tzeit7083deg),
        minchaGedolah: formatTime(data.times?.minchaGedola),
        minchaKetanah: formatTime(data.times?.minchaKetana),
        candleLighting: formatTime(data.times?.candleLighting),
        havdalah: formatTime(data.times?.havdalah),
        hebrewDate: data.date || '',
        location: data.location?.title || data.location?.geo || closestCity.name,
        
        // TODO: Add notification/reminder functionality
        // - Can set alerts for specific zmanim times
        // - Push notifications for important times like candle lighting
        
        // TODO: Add minhag customization options
        // - Different calculations for tzait hakochavim (18 min, 42 min, etc.)
        // - Sephardic vs Ashkenazi customs for zmanim
        // - Custom candle lighting time preferences
      };

      res.json(formattedTimes);
    } catch (error) {
      console.error('Error fetching Hebcal zmanim:', error);
      res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
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



  // Generate and download ICS calendar file
  app.post("/api/calendar-events/download", async (req, res) => {
    try {
      const { title, hebrewDate, gregorianDate, years = 10 } = req.body;
      
      if (!title || !hebrewDate || !gregorianDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Extract Hebrew date components (e.g., "19th of Tevet" -> day=19, month=Tevet)
      const parseHebrewDate = (hebrewDateStr: string) => {
        // Handle formats like "19th of Tevet", "19 Tevet", "Tevet 19", etc.
        const cleanDate = hebrewDateStr.replace(/(\d+)(st|nd|rd|th)\s+of\s+/i, '$1 ');
        const parts = cleanDate.split(/\s+/);
        
        let day, month;
        if (parts.length >= 2) {
          // Try to find day number and month name
          const dayMatch = parts.find(p => /^\d+$/.test(p));
          const monthMatch = parts.find(p => isNaN(parseInt(p)) && p.length > 2);
          day = dayMatch ? parseInt(dayMatch) : null;
          month = monthMatch || null;
        }
        
        return { day, month };
      };

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

        const { day, month } = parseHebrewDate(hebrewDate);
        const currentYear = new Date().getFullYear();
        
        // Create events for the next 'years' years starting from current year
        for (let i = 0; i < years; i++) {
          const targetYear = currentYear + i;
          let englishDateForYear = null;
          
          if (day && month) {
            // Normalize Hebrew month names for Hebcal API
            const hebrewMonthNames: { [key: string]: string } = {
              'tishrei': 'Tishrei', 'cheshvan': 'Cheshvan', 'kislev': 'Kislev', 'tevet': 'Tevet', 
              'shevat': 'Shevat', 'adar': 'Adar', 'nissan': 'Nissan', 'iyar': 'Iyar', 
              'sivan': 'Sivan', 'tammuz': 'Tammuz', 'av': 'Av', 'elul': 'Elul',
              'adar i': 'Adar I', 'adar ii': 'Adar II'
            };
            
            const monthName = hebrewMonthNames[month.toLowerCase()];
            
            if (monthName) {
              try {
                // Calculate Hebrew year more accurately
                const hebrewYear = targetYear < 2025 ? 5785 : 5785 + (targetYear - 2025);
                
                // Convert Hebrew date to Gregorian for this year
                const response = await serverAxiosClient.get(`https://www.hebcal.com/converter?cfg=json&hd=${day}&hm=${monthName}&hy=${hebrewYear}&h2g=1`);
                
                if (response.data && response.data.gy && response.data.gm && response.data.gd) {
                  const { gy, gm, gd } = response.data;
                  englishDateForYear = new Date(gy, gm - 1, gd); // gm is 1-based
                }
              } catch (error) {
                console.error(`Error converting Hebrew date for year ${targetYear}:`, error);
              }
            }
          }
          
          // Only use fallback if Hebrew conversion completely failed
          if (!englishDateForYear) {
            const baseDate = new Date(gregorianDate);
            englishDateForYear = new Date(targetYear, baseDate.getMonth(), baseDate.getDate());
          }
          
          const dateStr = englishDateForYear.toISOString().split('T')[0].replace(/-/g, '');
          
          icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}-${i}`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART;VALUE=DATE:${dateStr}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:Hebrew Date: ${hebrewDate}\\nEnglish Date: ${englishDateForYear.toLocaleDateString()}\\nYear: ${targetYear}`,
            'STATUS:CONFIRMED',
            'TRANSP:TRANSPARENT',
            'END:VEVENT'
          );
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
      res.status(500).json({ message: "Failed to generate calendar file" });
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

  // Mincha routes
  app.get("/api/mincha/prayers", async (req, res) => {
    try {
      const prayers = await storage.getMinchaPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Mincha prayers" });
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
      const pirkeiAvot = await storage.getPirkeiAvotByDate(date);
      res.json(pirkeiAvot || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Pirkei Avot content" });
    }
  });

  app.post("/api/torah/pirkei-avot/advance", async (req, res) => {
    try {
      const nextRef = await storage.getNextPirkeiAvotReference();
      const progress = await storage.updatePirkeiAvotProgress(nextRef.chapter, nextRef.verse);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to advance Pirkei Avot progress" });
    }
  });

  // Weekly Torah content routes
  app.get("/api/table/recipe/:week", async (req, res) => {
    try {
      const { week } = req.params;
      const recipe = await storage.getShabbatRecipeByWeek(week);
      res.json(recipe || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Shabbat recipe" });
    }
  });

  app.get("/api/table/recipe", async (req, res) => {
    try {
      // Get current week
      const date = new Date();
      const year = date.getFullYear();
      const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
      const weekKey = `${year}-W${week}`;
      
      const recipe = await storage.getShabbatRecipeByWeek(weekKey);
      res.json(recipe || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Shabbat recipe" });
    }
  });

  app.post("/api/table/recipe", async (req, res) => {
    try {
      const validatedData = insertShabbatRecipeSchema.parse(req.body);
      const recipe = await storage.createShabbatRecipe(validatedData);
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Shabbat recipe" });
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
      // Get current week
      const date = new Date();
      const year = date.getFullYear();
      const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
      const weekKey = `${year}-W${week}`;
      
      const vort = await storage.getParshaVortByWeek(weekKey);
      res.json(vort || null);
    } catch (error) {
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

  // Tehillim routes
  app.get("/api/tehillim/progress", async (req, res) => {
    try {
      await storage.cleanupExpiredNames();
      const progress = await storage.getGlobalTehillimProgress();
      const randomName = await storage.getRandomNameForPerek();
      
      res.json({
        ...progress,
        assignedName: randomName?.hebrewName || null
      });
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
      const name = await storage.getRandomNameForPerek();
      res.json(name || null);
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

  // Get Tehillim text from Sefaria API
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
      
      const tehillimData = await storage.getSefariaTehillim(perek, language);
      res.json(tehillimData);
    } catch (error) {
      console.error('Error fetching Tehillim text:', error);
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
      const { donationType, sponsorName, dedication } = req.body;
      
      // Only create sponsor record for "Sponsor a Day" donations
      if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
        const today = new Date().toISOString().split('T')[0];
        
        // Create sponsor record
        await storage.createSponsor({
          name: sponsorName,
          sponsorshipDate: today,
          message: dedication || null,
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

  // Stripe payment route for donations
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, donationType, metadata } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_configuration: "pmc_1Rgkz8FBzwAA3fO1GtotOiNc",
        metadata: {
          source: "ezras-nashim-donation",
          donationType: donationType || "General Donation",
          sponsorName: metadata?.sponsorName || "",
          dedication: metadata?.dedication || ""
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount 
      });
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
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

  // Analytics routes
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, eventData, sessionId } = req.body;
      const userAgent = req.headers['user-agent'];
      
      const event = await storage.trackEvent({
        eventType,
        eventData,
        sessionId,
        userAgent
      });
      
      res.json(event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  app.get("/api/analytics/stats/today", async (req, res) => {
    try {
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

  app.get("/api/analytics/stats/total", async (req, res) => {
    try {
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
      const impact = await storage.getCommunityImpact();
      res.json(impact);
    } catch (error) {
      console.error('Error fetching community impact:', error);
      res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  app.get("/healthcheck", (req, res) => {
    res.json({ status: "OK" });
  })

  const httpServer = createServer(app);
  return httpServer;
}
