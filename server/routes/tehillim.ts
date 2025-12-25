import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { insertTehillimNameSchema } from "../../shared/schema";
import { z } from "zod";
import { cacheMiddleware } from "../middleware/cache";
import { CACHE_TTL } from "../cache/categoryCache";

export interface TehillimRouteDeps {
  storage: IStorage;
}

function generateSlug(name: string): string {
  const latinChars = name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  if (latinChars.length >= 2) {
    return latinChars
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36);
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

let globalStatsCache: { data: any; timestamp: number } | null = null;
const GLOBAL_STATS_CACHE_TTL = 5 * 60 * 1000;

export function registerTehillimRoutes(app: Express, deps: TehillimRouteDeps) {
  const { storage } = deps;

  app.get("/api/tehillim/progress", async (_req: Request, res: Response) => {
    try {
      const progressWithName = await storage.getProgressWithAssignedName();
      return res.json(progressWithName);
    } catch (error) {
      console.error('Error fetching Tehillim progress:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim progress" });
    }
  });

  app.post("/api/tehillim/complete", async (req: Request, res: Response) => {
    try {
      const { currentPerek, language, completedBy } = req.body;
      
      if (!currentPerek || currentPerek < 1 || currentPerek > 171) {
        return res.status(400).json({ error: "Invalid perek ID" });
      }
      
      if (!language || !['english', 'hebrew'].includes(language)) {
        return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
      }
      
      const updatedProgress = await storage.updateGlobalTehillimProgress(currentPerek, language, completedBy);
      return res.json(updatedProgress);
    } catch (error) {
      console.error('Error completing Tehillim:', error);
      return res.status(500).json({ error: "Failed to complete Tehillim" });
    }
  });

  app.get("/api/tehillim/current-name", async (_req: Request, res: Response) => {
    try {
      const progressWithName = await storage.getProgressWithAssignedName();
      
      if (progressWithName.currentNameId) {
        const names = await storage.getActiveNames();
        const assignedName = names.find(n => n.id === progressWithName.currentNameId);
        return res.json(assignedName || null);
      } else {
        return res.json(null);
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch current name" });
    }
  });

  app.get("/api/tehillim/names", async (_req: Request, res: Response) => {
    try {
      const names = await storage.getActiveNames();
      return res.json(names);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch Tehillim names" });
    }
  });

  app.get("/api/tehillim/global-progress", async (_req: Request, res: Response) => {
    try {
      const progress = await storage.getGlobalTehillimProgress();
      return res.json(progress);
    } catch (error) {
      console.error("Error fetching global tehillim progress:", error);
      return res.status(500).json({ message: "Failed to fetch global tehillim progress" });
    }
  });

  app.get("/api/tehillim/info/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id < 1) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const tehillimInfo = await storage.getSupabaseTehillimById(id);
      if (!tehillimInfo) {
        return res.status(404).json({ error: "Tehillim not found" });
      }
      
      return res.json(tehillimInfo);
    } catch (error) {
      console.error('Error fetching Tehillim info:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim info" });
    }
  });

  app.get("/api/tehillim/text/:perek",
    cacheMiddleware({ ttl: CACHE_TTL.TEHILLIM, category: 'tehillim-text' }),
    async (req: Request, res: Response) => {
      try {
        const perek = parseInt(req.params.perek);
        const language = req.query.language as string || 'english';
        
        if (isNaN(perek) || perek < 1 || perek > 171) {
          return res.status(400).json({ error: "Perek must be between 1 and 171" });
        }
        
        if (!['english', 'hebrew'].includes(language)) {
          return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
        }
        
        const tehillimData = await storage.getSupabaseTehillim(perek, language);
        return res.json(tehillimData);
      } catch (error) {
        console.error('Error fetching Tehillim text:', error);
        return res.status(500).json({ error: "Failed to fetch Tehillim text" });
      }
    }
  );

  app.get("/api/tehillim/text/by-id/:id",
    cacheMiddleware({ ttl: CACHE_TTL.TEHILLIM, category: 'tehillim-text-by-id' }),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const language = req.query.language as string || 'english';
        
        if (isNaN(id) || id < 1 || id > 171) {
          return res.status(400).json({ error: "Invalid ID" });
        }
        
        if (!['english', 'hebrew'].includes(language)) {
          return res.status(400).json({ error: "Language must be 'english' or 'hebrew'" });
        }
        
        const tehillimData = await storage.getTehillimById(id, language);
        return res.json(tehillimData);
      } catch (error) {
        console.error('Error fetching Tehillim text by ID:', error);
        return res.status(500).json({ error: "Failed to fetch Tehillim text" });
    }
  });

  app.get("/api/tehillim/next-part/:id", async (req: Request, res: Response) => {
    try {
      const currentId = parseInt(req.params.id);
      
      if (isNaN(currentId) || currentId < 1) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const currentTehillim = await storage.getSupabaseTehillimById(currentId);
      
      if (!currentTehillim) {
        return res.status(404).json({ error: "Tehillim not found" });
      }
      
      if (currentTehillim.englishNumber === 119) {
        const nextPartNumber = currentTehillim.partNumber + 1;
        
        const nextPart = await storage.getSupabaseTehillimByEnglishAndPart(119, nextPartNumber);
        if (nextPart) {
          return res.json({ 
            id: nextPart.id,
            englishNumber: 119,
            partNumber: nextPartNumber,
            hebrewNumber: nextPart.hebrewNumber
          });
        }
        
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
      
      const nextEnglishNumber = currentTehillim.englishNumber + 1;
      
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
      
      const nextPsalm = await storage.getSupabaseTehillimByEnglishAndPart(nextEnglishNumber, 1);
      if (nextPsalm) {
        return res.json({
          id: nextPsalm.id,
          englishNumber: nextEnglishNumber,
          partNumber: 1,
          hebrewNumber: nextPsalm.hebrewNumber
        });
      }
      
      return res.status(404).json({ error: "Could not determine next Tehillim" });
      
    } catch (error) {
      console.error("Error getting next Tehillim part:", error);
      return res.status(500).json({ message: "Failed to get next Tehillim part" });
    }
  });

  app.get("/api/tehillim/preview/:perek", async (req: Request, res: Response) => {
    try {
      const perek = parseInt(req.params.perek);
      const language = req.query.language as string || 'hebrew';
      
      if (isNaN(perek) || perek < 1 || perek > 171) {
        return res.status(400).json({ error: 'Perek must be between 1 and 171' });
      }
      
      const tehillimText = await storage.getSefariaTehillim(perek, language);
      const firstLine = tehillimText.text.split('\n')[0] || tehillimText.text.substring(0, 100) + '...';
      
      return res.json({
        preview: firstLine,
        perek: tehillimText.perek,
        language: tehillimText.language
      });
    } catch (error) {
      console.error('Error fetching Tehillim preview:', error);
      return res.status(500).json({ error: 'Failed to fetch Tehillim preview' });
    }
  });

  app.post("/api/tehillim/names", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTehillimNameSchema.parse(req.body);
      const name = await storage.createTehillimName(validatedData);
      return res.json(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid name data", errors: error.errors });
      } else {
        return res.status(500).json({ message: "Failed to create Tehillim name" });
      }
    }
  });

  app.get("/api/tehillim/:tehillimId", async (req: Request, res: Response) => {
    try {
      const tehillimId = parseInt(req.params.tehillimId);
      
      if (isNaN(tehillimId) || tehillimId < 1 || tehillimId > 171) {
        return res.status(400).json({ error: "Tehillim ID must be between 1 and 171" });
      }
      
      const tehillimRow = await storage.getSupabaseTehillimById(tehillimId);
      
      if (!tehillimRow) {
        return res.status(404).json({ error: "Tehillim not found" });
      }
      
      let displayTitle = `Tehillim ${tehillimRow.englishNumber}`;
      if (tehillimRow.englishNumber === 119 && tehillimRow.partNumber > 1) {
        displayTitle = `Tehillim 119 (Part ${tehillimRow.partNumber})`;
      } else if (tehillimRow.englishNumber === 119 && tehillimRow.partNumber === 1) {
        displayTitle = `Tehillim 119 (Part 1)`;
      }
      
      return res.json({
        tehillimId,
        psalmNumber: tehillimRow.englishNumber,
        partNumber: tehillimRow.partNumber,
        displayTitle,
        hebrewNumber: tehillimRow.hebrewNumber,
        hebrewText: tehillimRow.hebrewText || '',
        englishText: tehillimRow.englishText || ''
      });
    } catch (error) {
      console.error('Error fetching Tehillim:', error);
      return res.status(500).json({ error: "Failed to fetch Tehillim" });
    }
  });

  app.post("/api/tehillim-chains", async (req: Request, res: Response) => {
    try {
      const { name, reason, deviceId } = req.body;
      
      if (!name || !reason) {
        return res.status(400).json({ error: "Name and reason are required" });
      }

      let slug = generateSlug(name);
      
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

      return res.json(chain);
    } catch (error) {
      console.error("Error creating Tehillim chain:", error);
      return res.status(500).json({ error: "Failed to create Tehillim chain" });
    }
  });

  app.get("/api/tehillim-chains/search", async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || '';
      const chains = await storage.searchTehillimChains(query);
      return res.json(chains);
    } catch (error) {
      console.error("Error searching Tehillim chains (returning empty):", error);
      return res.json([]);
    }
  });

  app.get("/api/tehillim-chains/stats/total", async (_req: Request, res: Response) => {
    try {
      const total = await storage.getTotalChainTehillimCompleted();
      return res.json({ total });
    } catch (error) {
      console.error("Error fetching total chains tehillim (returning 0):", error);
      return res.json({ total: 0 });
    }
  });

  app.get("/api/tehillim-chains/stats/global", async (_req: Request, res: Response) => {
    try {
      if (globalStatsCache && Date.now() - globalStatsCache.timestamp < GLOBAL_STATS_CACHE_TTL) {
        return res.json(globalStatsCache.data);
      }
      
      const stats = await storage.getTehillimGlobalStats();
      globalStatsCache = { data: stats, timestamp: Date.now() };
      
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching global tehillim stats:", error);
      return res.json({ totalRead: 0, booksCompleted: 0, uniqueReaders: 0 });
    }
  });

  app.get("/api/tehillim-chains/stats/active-count", async (_req: Request, res: Response) => {
    try {
      const count = await storage.getActiveTehillimChainCount();
      return res.json({ count });
    } catch (error) {
      console.error("Error fetching active chain count:", error);
      return res.json({ count: 0 });
    }
  });

  app.get("/api/tehillim-chains/random", async (_req: Request, res: Response) => {
    try {
      const randomChain = await storage.getRandomTehillimChain();
      if (!randomChain) {
        return res.status(404).json({ error: "No chains found" });
      }
      return res.json(randomChain);
    } catch (error) {
      console.error("Error getting random chain:", error);
      return res.status(500).json({ error: "Failed to get random chain" });
    }
  });

  app.get("/api/tehillim-chains/:slug/reminder.ics", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { time } = req.query;
      
      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }
      
      const reminderTime = (time as string) || '09:00';
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
      
      const formatLocalICSDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${h}${m}${s}`;
      };
      
      const chainUrl = `${req.protocol}://${req.get('host')}/c/${slug}`;
      const eventTitle = `Daven for ${chain.name}`;
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Ezras Nashim//Tehillim Chain//EN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${slug}-${Date.now()}@ezrasnashim.app`,
        `DTSTAMP:${formatLocalICSDate(new Date())}`,
        `DTSTART:${formatLocalICSDate(startDate)}`,
        `DTEND:${formatLocalICSDate(endDate)}`,
        'RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR',
        `SUMMARY:${eventTitle}`,
        `LOCATION:${chainUrl}`,
        `DESCRIPTION:Time to say Tehillim for ${chain.name}. Open your Tehillim chain: ${chainUrl}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="tehillim-reminder-${slug}.ics"`);
      return res.send(icsContent);
    } catch (error) {
      console.error("Error generating ICS file:", error);
      return res.status(500).json({ error: "Failed to generate calendar file" });
    }
  });

  app.get("/api/tehillim-chains/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { deviceId } = req.query;
      const chain = await storage.getTehillimChainBySlug(slug);
      
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      let activeReading: number | null = null;
      if (deviceId) {
        activeReading = await storage.getActiveChainReadingForDevice(chain.id, deviceId as string);
      }

      const [stats, nextAvailable] = await Promise.all([
        storage.getTehillimChainStats(chain.id),
        storage.getRandomAvailablePsalmForChain(chain.id, deviceId as string | undefined)
      ]);

      const nextPsalm = activeReading || nextAvailable;

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.json({
        ...chain,
        stats: {
          totalCompleted: stats.totalSaid,
          booksCompleted: stats.booksCompleted,
          currentlyReading: stats.currentlyReading,
          available: stats.available
        },
        nextPsalm: nextPsalm || null,
        hasActiveReading: !!activeReading
      });
    } catch (error) {
      console.error("Error fetching Tehillim chain:", error);
      return res.status(500).json({ error: "Failed to fetch Tehillim chain" });
    }
  });

  app.get("/api/tehillim-chains/:slug/stats", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const chain = await storage.getTehillimChainBySlug(slug);
      
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      const stats = await storage.getTehillimChainStats(chain.id);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.json({
        totalCompleted: stats.totalSaid,
        booksCompleted: stats.booksCompleted,
        currentlyReading: stats.currentlyReading,
        available: stats.available
      });
    } catch (error) {
      console.error("Error fetching chain stats:", error);
      return res.status(500).json({ error: "Failed to fetch chain stats" });
    }
  });

  app.post("/api/tehillim-chains/:slug/start-reading", async (req: Request, res: Response) => {
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

      let psalm = psalmNumber;
      if (!psalm) {
        psalm = await storage.getRandomAvailablePsalmForChain(chain.id);
        if (!psalm) {
          return res.status(404).json({ error: "No psalms available - all have been completed or are being read" });
        }
      }

      const reading = await storage.startChainReading(chain.id, psalm, deviceId);
      return res.json(reading);
    } catch (error) {
      console.error("Error starting chain reading:", error);
      return res.status(500).json({ error: "Failed to start reading" });
    }
  });

  app.post("/api/tehillim-chains/:slug/complete", async (req: Request, res: Response) => {
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
      
      globalStatsCache = null;
      
      const stats = await storage.getTehillimChainStats(chain.id);
      return res.json({ 
        reading, 
        stats: {
          totalCompleted: stats.totalSaid,
          booksCompleted: stats.booksCompleted,
          currentlyReading: stats.currentlyReading,
          available: stats.available,
        }
      });
    } catch (error) {
      console.error("Error completing chain reading:", error);
      return res.status(500).json({ error: "Failed to complete reading" });
    }
  });

  app.get("/api/tehillim-chains/:slug/next-available", async (req: Request, res: Response) => {
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

      return res.json({ psalmNumber: psalm });
    } catch (error) {
      console.error("Error getting next psalm:", error);
      return res.status(500).json({ error: "Failed to get next psalm" });
    }
  });

  app.get("/api/tehillim-chains/:slug/random-available", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { deviceId, excludePsalm } = req.query;

      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) {
        return res.status(404).json({ error: "Chain not found" });
      }

      let excludePsalmNum: number | undefined;
      if (excludePsalm) {
        const parsed = parseInt(excludePsalm as string, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 171) {
          excludePsalmNum = parsed;
        }
      }
      
      const psalm = await storage.getRandomAvailablePsalmForChain(chain.id, deviceId as string, excludePsalmNum);
      if (!psalm) {
        return res.status(404).json({ error: "No psalms available" });
      }

      return res.json({ psalmNumber: psalm });
    } catch (error) {
      console.error("Error getting random psalm:", error);
      return res.status(500).json({ error: "Failed to get random psalm" });
    }
  });
}
