import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { getAppCompletionsForPeriod, mergeAppCompletions } from "./app-completions";

export interface AnalyticsRouteDeps {
  requireAdminAuth: (req: any, res: any, next: any) => void;
  storage: IStorage;
}

const ALLOWED_EVENTS = ['modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete', 'tzedaka_completion', 'meditation_complete', 'feature_usage'];

export function registerAnalyticsRoutes(app: Express, deps: AnalyticsRouteDeps) {
  const { requireAdminAuth, storage } = deps;

  app.post("/api/analytics/track", async (req: Request, res: Response) => {
    try {
      const { eventType, eventData, sessionId, idempotencyKey, date } = req.body;
      
      if (!ALLOWED_EVENTS.includes(eventType)) {
        return res.status(400).json({ message: "Event type not tracked" });
      }
      
      const event = await storage.trackEvent({
        eventType,
        eventData,
        sessionId,
        idempotencyKey,
        analyticsDate: date
      });
      
      return res.json(event);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      return res.status(500).json({ message: "Failed to track event" });
    }
  });
  
  app.post("/api/analytics/sync", async (req: Request, res: Response) => {
    try {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events)) {
        return res.status(400).json({ message: "Events array required" });
      }
      
      const validEvents = events.filter((e: any) => ALLOWED_EVENTS.includes(e.eventType));
      const result = await storage.syncAnalyticsEvents(validEvents);
      
      return res.json(result);
    } catch (error) {
      console.error('Error syncing analytics events:', error);
      return res.status(500).json({ message: "Failed to sync events" });
    }
  });

  app.post("/api/feature-usage", async (req: Request, res: Response) => {
    try {
      const { featureName, category } = req.body;
      
      if (!featureName) {
        return res.status(400).json({ message: "Feature name required" });
      }
      
      const event = await storage.trackEvent({
        eventType: 'feature_usage',
        eventData: {
          feature: featureName,
          category: category || 'general'
        },
        sessionId: null
      });
      
      return res.json({ success: true, event });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      return res.status(500).json({ message: "Failed to track feature usage" });
    }
  });

  app.post("/api/analytics/session", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID required" });
      }
      
      await storage.recordActiveSession(sessionId);
      return res.json({ success: true });
    } catch (error) {
      console.error('Error recording session:', error);
      return res.status(500).json({ message: "Failed to record session" });
    }
  });

  app.post("/api/analytics/cleanup", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      await storage.cleanupOldAnalytics();
      return res.json({ success: true, message: "Old analytics data cleaned up" });
    } catch (error) {
      console.error('Error cleaning up analytics:', error);
      return res.status(500).json({ message: "Failed to cleanup analytics" });
    }
  });

  app.get("/api/analytics/stats/today", async (req: Request, res: Response) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      let today: string;
      if (req.query.date && typeof req.query.date === 'string') {
        today = req.query.date;
      } else {
        const now = new Date();
        const hours = now.getHours();
        if (hours < 2) {
          now.setDate(now.getDate() - 1);
        }
        today = now.toISOString().split('T')[0];
      }
      
      let stats = await storage.getDailyStats(today);
      if (!stats) {
        stats = await storage.recalculateDailyStats(today);
      }
      
      const result = stats || {
        date: today,
        uniqueUsers: 0,
        pageViews: 0,
        tehillimCompleted: 0,
        namesProcessed: 0,
        modalCompletions: {}
      };

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const appStats = await getAppCompletionsForPeriod(today, tomorrow.toISOString().split('T')[0]);
      mergeAppCompletions(result as any, appStats);
      
      return res.json(result);
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return res.status(500).json({ message: "Failed to fetch today's stats" });
    }
  });

  app.get("/api/analytics/stats/week", async (req: Request, res: Response) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      let weekStart: string;
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        weekStart = req.query.startDate;
      } else {
        const now = new Date();
        const hours = now.getHours();
        const currentDate = new Date(now);
        
        if (hours < 2) {
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        const dayOfWeek = currentDate.getDay();
        const daysToSubtract = dayOfWeek;
        currentDate.setDate(currentDate.getDate() - daysToSubtract);
        
        weekStart = currentDate.toISOString().split('T')[0];
      }
      
      const weeklyStats = await storage.getWeeklyStats(weekStart);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const appStats = await getAppCompletionsForPeriod(weekStart, weekEnd.toISOString().split('T')[0]);
      mergeAppCompletions(weeklyStats as any, appStats);
      
      return res.json(weeklyStats);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      return res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.get("/api/analytics/stats/month", async (req: Request, res: Response) => {
    try {
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
      
      const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
      const nextMonth = new Date(year, month, 1);
      const monthEnd = nextMonth.toISOString().split('T')[0];
      const appStats = await getAppCompletionsForPeriod(monthStart, monthEnd);
      mergeAppCompletions(monthlyStats as any, appStats);
      
      return res.json(monthlyStats);
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  app.get("/api/analytics/stats/total", async (_req: Request, res: Response) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      
      const totals = await storage.getTotalStats();
      
      const appStats = await getAppCompletionsForPeriod('2020-01-01');
      mergeAppCompletions(totals as any, appStats);
      
      return res.json(totals);
    } catch (error) {
      console.error('Error fetching total stats:', error);
      return res.status(500).json({ message: "Failed to fetch total stats" });
    }
  });

  app.post("/api/analytics/recalculate-all", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      console.log('Starting recalculation of all historical analytics...');
      const result = await storage.recalculateAllHistoricalStats();
      console.log(`Completed: Updated ${result.updated} dates`);
      
      return res.json({ 
        success: true, 
        message: `Successfully recalculated analytics for ${result.updated} dates`,
        datesUpdated: result.updated,
        dates: result.dates
      });
    } catch (error) {
      console.error('Error recalculating all analytics:', error);
      return res.status(500).json({ message: "Failed to recalculate all analytics" });
    }
  });

  app.get("/api/analytics/stats/daily", async (_req: Request, res: Response) => {
    try {
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
      
      return res.json(dailyStats);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/stats/range", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }

      const rangeStats = await storage.getDateRangeStats(startDate, endDate);
      return res.json(rangeStats);
    } catch (error) {
      console.error('Error fetching date range stats:', error);
      return res.status(500).json({ message: "Failed to fetch date range stats" });
    }
  });

  app.get("/api/analytics/stats/compare", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });

      const period = req.query.period as 'week' | 'month';

      if (!period || (period !== 'week' && period !== 'month')) {
        return res.status(400).json({ message: "period must be 'week' or 'month'" });
      }

      const comparisonStats = await storage.getComparisonStats(period);
      return res.json(comparisonStats);
    } catch (error) {
      console.error('Error fetching comparison stats:', error);
      return res.status(500).json({ message: "Failed to fetch comparison stats" });
    }
  });

  app.get("/api/analytics/community-impact", async (req: Request, res: Response) => {
    try {
      const period = req.query.period as string || 'alltime';
      const impact = await storage.getCommunityImpact(period);
      return res.json(impact);
    } catch (error) {
      console.error('Error fetching community impact:', error);
      return res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });
}
