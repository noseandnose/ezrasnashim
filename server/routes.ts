import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContentSchema, insertCalendarEventSchema } from "@shared/schema";
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
      const hebcalUrl = `https://www.hebcal.com/shabbat?cfg=json&geonameid=${location}&M=on&lg=s`;
      
      const response = await fetch(hebcalUrl);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch from Hebcal API" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
