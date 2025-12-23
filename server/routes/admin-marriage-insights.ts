import { Router } from "express";
import { requireAdminAuth } from "./shared";
import { cacheMiddleware } from "../middleware/cache";
import { CACHE_TTL, cache } from "../cache/categoryCache";
import { insertMarriageInsightSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function createMarriageInsightsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:date", 
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

  router.post("/", requireAdminAuth, async (req, res) => {
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

  router.get("/", requireAdminAuth, async (req, res) => {
    try {
      const insights = await storage.getAllMarriageInsights();
      res.json(insights);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch marriage insights" });
    }
  });

  router.patch("/:id", requireAdminAuth, async (req, res) => {
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

  router.delete("/:id", requireAdminAuth, async (req, res) => {
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

  return router;
}
