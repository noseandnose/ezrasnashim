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

  // Jewish times routes
  app.get("/api/times/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const times = await storage.getJewishTimesByDate(date);
      if (!times) {
        // Try to fetch from Hebcal API if not in storage
        const hebcalUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=5128581&M=on&lg=s`;
        try {
          const response = await fetch(hebcalUrl);
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const hebrewDate = data.date?.hebrew || "Hebrew Date";
            
            const newTimes = await storage.createJewishTimes({
              date: today,
              location: data.location?.title || "New York, NY",
              sunrise: "7:12 AM", // Would extract from API
              sunset: "4:32 PM",
              candleLighting: data.items.find((item: any) => item.category === "candles")?.time || "4:18 PM",
              havdalah: data.items.find((item: any) => item.category === "havdalah")?.time || "5:33 PM",
              hebrewDate: hebrewDate
            });
            
            res.json(newTimes);
          } else {
            res.status(404).json({ message: "Times not found for this date" });
          }
        } catch (apiError) {
          res.status(404).json({ message: "Times not found and unable to fetch from API" });
        }
      } else {
        res.json(times);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Jewish times" });
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
