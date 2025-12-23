import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { cacheMiddleware } from "../middleware/cache";
import { CACHE_TTL } from "../cache/categoryCache";

export interface PrayerRouteDeps {
  storage: IStorage;
  requireAdminAuth: (req: Request, res: Response, next: () => void) => void;
}

export function registerPrayerRoutes(app: Express, deps: PrayerRouteDeps) {
  const { storage, requireAdminAuth } = deps;

  // Mincha routes
  app.get("/api/mincha/prayers",
    cacheMiddleware({ ttl: CACHE_TTL.STATIC_PRAYERS, category: 'prayers-mincha' }),
    async (req: Request, res: Response) => {
      try {
        const prayers = await storage.getMinchaPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Mincha prayers" });
      }
    }
  );

  app.get("/api/mincha/prayer", async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
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
    async (req: Request, res: Response) => {
      try {
        const prayers = await storage.getMaarivPrayers();
        res.json(prayers);
      } catch (error) {
        return res.status(500).json({ message: "Failed to fetch Maariv prayers" });
      }
    }
  );

  app.get("/api/maariv/prayer", async (req: Request, res: Response) => {
    try {
      const prayers = await storage.getMaarivPrayers();
      res.json(prayers);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Maariv prayers" });
    }
  });

  // Brochas routes
  app.get("/api/brochas", async (req: Request, res: Response) => {
    try {
      const brochas = await storage.getBrochas();
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching brochas:", error);
      return res.status(500).json({ message: "Failed to fetch brochas" });
    }
  });

  app.get("/api/brochas/daily", async (req: Request, res: Response) => {
    try {
      const brochas = await storage.getBrochasByType(false);
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching daily brochas:", error);
      return res.status(500).json({ message: "Failed to fetch daily brochas" });
    }
  });

  app.get("/api/brochas/special", async (req: Request, res: Response) => {
    try {
      const brochas = await storage.getBrochasByType(true);
      res.json(brochas);
    } catch (error) {
      console.error("Error fetching special brochas:", error);
      return res.status(500).json({ message: "Failed to fetch special brochas" });
    }
  });

  app.get("/api/brochas/:id", async (req: Request, res: Response) => {
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

  app.post("/api/brochas", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const brocha = await storage.createBrocha(req.body);
      res.json(brocha);
    } catch (error) {
      console.error("Error creating brocha:", error);
      return res.status(500).json({ message: "Failed to create brocha" });
    }
  });
}
