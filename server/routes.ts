import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertCalendarEventSchema, insertTehillimNameSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Content routes
  app.get("/api/content/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const content = await storage.getContentByType(type);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/content/date/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const content = await storage.getContentByDate(date);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content by date" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(validatedData);
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid content data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create content" });
      }
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
      const response = await fetch(hebcalUrl);
      
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }
      
      const data = await response.json();
      
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
          console.error('Time formatting error:', error, 'for time:', timeStr);
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
        location: data.location?.title || closestCity.name
      };

      res.json(formattedTimes);
    } catch (error) {
      console.error('Error fetching Hebcal zmanim:', error);
      res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
    }
  });

  // Calendar events routes
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create calendar event" });
      }
    }
  });

  // Shop routes
  app.get("/api/shop", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === 'string') {
        const items = await storage.getShopItemsByCategory(category);
        res.json(items);
      } else {
        const items = await storage.getAllShopItems();
        res.json(items);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  // Hebcal API proxy
  app.get("/api/hebcal/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await fetch(hebcalUrl);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch from Hebcal API" });
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

  // Zmanim route that returns parsed and adjusted times
  app.get("/api/zmanim/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await fetch(hebcalUrl);
      const data = await response.json();
      
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
      const progress = await storage.getGlobalTehillimProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Tehillim progress" });
    }
  });

  app.post("/api/tehillim/complete", async (req, res) => {
    try {
      const { completedBy } = req.body;
      const currentProgress = await storage.getGlobalTehillimProgress();
      const nextPerek = currentProgress.currentPerek + 1;
      const updatedProgress = await storage.updateGlobalTehillimProgress(nextPerek, completedBy);
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete Tehillim perek" });
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

  const httpServer = createServer(app);
  return httpServer;
}
