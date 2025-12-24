import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { cacheMiddleware } from "../middleware/cache";
import { CACHE_TTL, cache } from "../cache/categoryCache";
import { 
  insertTableInspirationSchema, 
  insertMarriageInsightSchema,
  insertDailyHalachaSchema,
  insertDailyEmunaSchema,
  insertDailyChizukSchema,
  insertFeaturedContentSchema,
  insertTodaysSpecialSchema,
  insertGiftOfChatzosSchema,
  insertPirkeiAvotSchema
} from "../../shared/schema";

export interface ContentRouteDeps {
  storage: IStorage;
  requireAdminAuth: (req: Request, res: Response, next: () => void) => void;
}

export function registerContentRoutes(app: Express, deps: ContentRouteDeps) {
  const { storage, requireAdminAuth } = deps;

  // Table inspiration routes
  app.get("/api/table/inspiration/:date", async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const inspiration = await storage.getTableInspirationByDate(date);
      res.json(inspiration || null);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch table inspiration" });
    }
  });

  app.post("/api/table/inspiration", requireAdminAuth, async (req: Request, res: Response) => {
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

  app.get("/api/table/inspirations", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const inspirations = await storage.getAllTableInspirations();
      res.json(inspirations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch table inspirations" });
    }
  });

  app.put("/api/table/inspiration/:id", requireAdminAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/table/inspiration/:id", requireAdminAuth, async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const insight = await storage.getMarriageInsightByDate(date);
        res.json(insight || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch marriage insight" });
      }
    }
  );

  app.post("/api/marriage-insights", requireAdminAuth, async (req: Request, res: Response) => {
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

  app.get("/api/marriage-insights", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const insights = await storage.getAllMarriageInsights();
      res.json(insights);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch marriage insights" });
    }
  });

  app.patch("/api/marriage-insights/:id", requireAdminAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/marriage-insights/:id", requireAdminAuth, async (req: Request, res: Response) => {
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

  // Daily Torah content routes
  app.get("/api/torah/halacha/:date", 
    cacheMiddleware({ ttl: CACHE_TTL.DAILY_TORAH, category: 'torah-halacha' }),
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const halacha = await storage.getDailyHalachaByDate(date);
        res.json(halacha || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily halacha" });
      }
    }
  );

  app.post("/api/torah/halacha", requireAdminAuth, async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const emuna = await storage.getDailyEmunaByDate(date);
        res.json(emuna || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily emuna" });
      }
    }
  );

  app.post("/api/torah/emuna", requireAdminAuth, async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const chizuk = await storage.getDailyChizukByDate(date);
        res.json(chizuk || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch daily chizuk" });
      }
    }
  );

  app.post("/api/torah/chizuk", requireAdminAuth, async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const featured = await storage.getFeaturedContentByDate(date);
        res.json(featured || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch featured content" });
      }
    }
  );

  app.post("/api/torah/featured", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertFeaturedContentSchema.parse(req.body);
      const featured = await storage.createFeaturedContent(validatedData);
      cache.clearCategory('torah-featured');
      res.json(featured);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create featured content" });
    }
  });

  // Today's Special routes
  app.get("/api/home/todays-special/:date",
    cacheMiddleware({ ttl: CACHE_TTL.TODAYS_SPECIAL, category: 'todays-special' }),
    async (req: Request, res: Response) => {
      try {
        const { date } = req.params;
        const special = await storage.getTodaysSpecialByDate(date);
        res.json(special || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch today's special" });
      }
    }
  );

  app.post("/api/home/todays-special", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertTodaysSpecialSchema.parse(req.body);
      const special = await storage.createTodaysSpecial(validatedData);
      cache.clearCategory('todays-special');
      res.json(special);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create today's special" });
    }
  });

  // Gift of Chatzos routes
  app.get("/api/life/gift-of-chatzos/:dayOfWeek",
    cacheMiddleware({ ttl: CACHE_TTL.TODAYS_SPECIAL, category: 'gift-of-chatzos' }),
    async (req: Request, res: Response) => {
      try {
        const dayOfWeek = parseInt(req.params.dayOfWeek);
        if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
          return res.status(400).json({ message: "Invalid day of week (0-6)" });
        }
        const gift = await storage.getGiftOfChatzosByDayOfWeek(dayOfWeek);
        res.json(gift || null);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch gift of chatzos" });
      }
    }
  );

  app.get("/api/life/gift-of-chatzos",
    cacheMiddleware({ ttl: CACHE_TTL.TODAYS_SPECIAL, category: 'gift-of-chatzos-all' }),
    async (req: Request, res: Response) => {
      try {
        const allGifts = await storage.getAllGiftOfChatzos();
        res.json(allGifts);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch all gift of chatzos" });
      }
    }
  );

  app.post("/api/life/gift-of-chatzos", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertGiftOfChatzosSchema.parse(req.body);
      const gift = await storage.createGiftOfChatzos(validatedData);
      cache.clearCategory('gift-of-chatzos');
      cache.clearCategory('gift-of-chatzos-all');
      res.json(gift);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create gift of chatzos" });
    }
  });

  app.patch("/api/life/gift-of-chatzos/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const gift = await storage.updateGiftOfChatzos(id, req.body);
      cache.clearCategory('gift-of-chatzos');
      cache.clearCategory('gift-of-chatzos-all');
      res.json(gift);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update gift of chatzos" });
    }
  });

  // Pirkei Avot routes
  app.get("/api/torah/pirkei-avot/:date",
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'pirkei-avot' }),
    async (req: Request, res: Response) => {
      try {
        const currentPirkeiAvot = await storage.getCurrentPirkeiAvot();
        
        if (currentPirkeiAvot) {
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

  app.post("/api/torah/pirkei-avot/advance", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const progress = await storage.advancePirkeiAvotProgress();
      cache.clearCategory('pirkei-avot');
      cache.clearCategory('pirkei-avot-all');
      res.json(progress);
    } catch (error) {
      return res.status(500).json({ message: "Failed to advance Pirkei Avot progress" });
    }
  });

  app.get("/api/pirkei-avot",
    cacheMiddleware({ ttl: CACHE_TTL.PIRKEI_AVOT, category: 'pirkei-avot-all' }),
    async (req: Request, res: Response) => {
      try {
        const allPirkeiAvot = await storage.getAllPirkeiAvot();
        res.json(allPirkeiAvot);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch all Pirkei Avot" });
      }
    }
  );

  app.post("/api/pirkei-avot", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPirkeiAvotSchema.parse(req.body);
      const pirkeiAvot = await storage.createPirkeiAvot(validatedData);
      cache.clearCategory('pirkei-avot');
      cache.clearCategory('pirkei-avot-all');
      res.json(pirkeiAvot);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create Pirkei Avot" });
    }
  });
}
