import { Router } from "express";
import { requireAdminAuth } from "./shared";
import { insertTorahClassSchema, insertLifeClassSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function createTorahClassesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const classes = await storage.getTorahClassesByDate(today);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching Torah classes:', error);
      return res.status(500).json({ message: "Failed to fetch Torah classes" });
    }
  });

  router.get("/all", requireAdminAuth, async (req, res) => {
    try {
      const classes = await storage.getAllTorahClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching all Torah classes:', error);
      return res.status(500).json({ message: "Failed to fetch Torah classes" });
    }
  });

  router.post("/", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertTorahClassSchema.parse(req.body);
      const torahClass = await storage.createTorahClass(validatedData);
      res.json(torahClass);
    } catch (error) {
      console.error('Error creating Torah class:', error);
      return res.status(500).json({ message: "Failed to create Torah class" });
    }
  });

  router.put("/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertTorahClassSchema.partial().parse(req.body);
      const torahClass = await storage.updateTorahClass(id, validatedData);
      
      if (!torahClass) {
        return res.status(404).json({ message: "Torah class not found" });
      }
      
      res.json(torahClass);
    } catch (error) {
      console.error('Error updating Torah class:', error);
      return res.status(500).json({ message: "Failed to update Torah class" });
    }
  });

  router.delete("/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteTorahClass(id);
      
      if (!success) {
        return res.status(404).json({ message: "Torah class not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Torah class:', error);
      return res.status(500).json({ message: "Failed to delete Torah class" });
    }
  });

  return router;
}

export function createLifeClassesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 2) {
        now.setDate(now.getDate() - 1);
      }
      const today = now.toISOString().split('T')[0];
      const classes = await storage.getLifeClassesByDate(today);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching Life classes:', error);
      return res.status(500).json({ message: "Failed to fetch Life classes" });
    }
  });

  router.get("/all", requireAdminAuth, async (req, res) => {
    try {
      const classes = await storage.getAllLifeClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching all Life classes:', error);
      return res.status(500).json({ message: "Failed to fetch Life classes" });
    }
  });

  router.post("/", requireAdminAuth, async (req, res) => {
    try {
      const validatedData = insertLifeClassSchema.parse(req.body);
      const lifeClass = await storage.createLifeClass(validatedData);
      res.json(lifeClass);
    } catch (error) {
      console.error('Error creating Life class:', error);
      return res.status(500).json({ message: "Failed to create Life class" });
    }
  });

  router.put("/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const validatedData = insertLifeClassSchema.partial().parse(req.body);
      const lifeClass = await storage.updateLifeClass(id, validatedData);
      
      if (!lifeClass) {
        return res.status(404).json({ message: "Life class not found" });
      }
      
      res.json(lifeClass);
    } catch (error) {
      console.error('Error updating Life class:', error);
      return res.status(500).json({ message: "Failed to update Life class" });
    }
  });

  router.delete("/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteLifeClass(id);
      
      if (!success) {
        return res.status(404).json({ message: "Life class not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Life class:', error);
      return res.status(500).json({ message: "Failed to delete Life class" });
    }
  });

  return router;
}
