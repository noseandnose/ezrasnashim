import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import { db, pool } from "../db";
import { eq } from "drizzle-orm";
import serverAxiosClient from "../axiosClient";
import {
  profiles, mitzvahCompletions, nishmasChallenges, userBadges, namePsukim,
} from "../../shared/schema";

export interface MobileRouteDeps {
  storage: IStorage;
  requireAdminAuth: (req: Request, res: Response, next: () => void) => void;
  optionalAuth: (req: Request, res: Response, next: () => void) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.floor(Math.abs(a - b) / 86400000);
}

export function registerMobileRoutes(app: Express, deps: MobileRouteDeps) {
  const { storage, requireAdminAuth, optionalAuth } = deps;

  // =========================================================
  // SECTION 1: ALIASES FOR EXISTING ROUTES
  // =========================================================

  // GET /api/supabase-config → alias for /api/auth/public-config
  app.get("/api/supabase-config", (_req: Request, res: Response) => {
    res.json({
      url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
      anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
    });
  });

  // GET /api/zmanim → alias with query params ?lat=&lng= or ?lat=&lon=
  app.get("/api/zmanim", async (req: Request, res: Response) => {
    const lat = req.query.lat as string;
    const lng = (req.query.lng || req.query.lon) as string;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params required" });
    }
    try {
      const r = await serverAxiosClient.get(`http://localhost:${process.env.PORT || 5000}/api/zmanim/${lat}/${lng}`);
      return res.json(r.data);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch zmanim" });
    }
  });

  // GET /api/shabbat → alias with query params ?lat=&lng=
  app.get("/api/shabbat", async (req: Request, res: Response) => {
    const lat = req.query.lat as string;
    const lng = (req.query.lng || req.query.lon) as string;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params required" });
    }
    try {
      const r = await serverAxiosClient.get(`http://localhost:${process.env.PORT || 5000}/api/shabbos/${lat}/${lng}`);
      return res.json(r.data);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch Shabbat times" });
    }
  });

  // GET /api/holidays → alias with query params ?lat=&lng=
  app.get("/api/holidays", async (req: Request, res: Response) => {
    const lat = req.query.lat as string;
    const lng = (req.query.lng || req.query.lon) as string;
    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng query params required" });
    }
    try {
      const r = await serverAxiosClient.get(`http://localhost:${process.env.PORT || 5000}/api/events/${lat}/${lng}`);
      return res.json(r.data);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch holidays" });
    }
  });

  // POST /api/notifications/send → alias for /api/push/send (admin-gated)
  app.post("/api/notifications/send", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const r = await serverAxiosClient.post(
        `http://localhost:${process.env.PORT || 5000}/api/push/send`,
        req.body,
        { headers: { Authorization: req.headers.authorization || "" } }
      );
      return res.json(r.data);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // POST /api/donations/checkout → alias for /api/create-session-checkout
  app.post("/api/donations/checkout", async (req: Request, res: Response) => {
    try {
      const r = await serverAxiosClient.post(
        `http://localhost:${process.env.PORT || 5000}/api/create-session-checkout`,
        req.body
      );
      return res.json(r.data);
    } catch (err: any) {
      return res.status(err.response?.status || 500).json(err.response?.data || { message: "Checkout failed" });
    }
  });

  // GET /api/donations/campaign → alias for /api/campaigns/active
  app.get("/api/donations/campaign", async (_req: Request, res: Response) => {
    try {
      const campaign = await storage.getActiveCampaign();
      return res.json(campaign || null);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // GET /api/donations/community-impact → alias for /api/analytics/community-impact
  app.get("/api/donations/community-impact", async (_req: Request, res: Response) => {
    try {
      const impact = await storage.getCommunityImpact("alltime");
      return res.json(impact);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch community impact" });
    }
  });

  // GET /api/sponsors/today → alias for /api/sponsors/daily/:date with today's date
  app.get("/api/sponsors/today", async (_req: Request, res: Response) => {
    try {
      const sponsor = await storage.getDailySponsor(today());
      return res.json(sponsor || null);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch today's sponsor" });
    }
  });

  // POST /api/tehillim-chains/:slug/complete-reading → alias for /:slug/complete
  app.post("/api/tehillim-chains/:slug/complete-reading", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { deviceId, psalmNumber } = req.body;
      if (!deviceId || !psalmNumber) {
        return res.status(400).json({ error: "Device ID and psalm number are required" });
      }
      const chain = await storage.getTehillimChainBySlug(slug);
      if (!chain) return res.status(404).json({ error: "Chain not found" });
      const reading = await storage.completeChainReading(chain.id, psalmNumber, deviceId);
      const stats = await storage.getTehillimChainStats(chain.id);
      return res.json({
        reading,
        stats: {
          totalCompleted: stats.totalSaid,
          booksCompleted: stats.booksCompleted,
          currentlyReading: stats.currentlyReading,
          available: stats.available,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to complete reading" });
    }
  });

  // GET /api/tehillim-chains-global-stats → alias for /api/tehillim-chains/stats/global
  app.get("/api/tehillim-chains-global-stats", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getTehillimGlobalStats();
      return res.json(stats);
    } catch (err) {
      return res.json({ totalRead: 0, booksCompleted: 0, uniqueReaders: 0 });
    }
  });

  // GET /api/todays-special → alias for /api/home/todays-special/:date with today
  app.get("/api/todays-special", async (_req: Request, res: Response) => {
    try {
      const special = await storage.getTodaysSpecialByDate(today());
      return res.json(special || null);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch today's special" });
    }
  });

  // POST /api/todays-special/complete → alias for /api/challenge/:id/complete
  app.post("/api/todays-special/complete", async (req: Request, res: Response) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "id required" });
    try {
      const r = await serverAxiosClient.post(
        `http://localhost:${process.env.PORT || 5000}/api/challenge/${id}/complete`,
        req.body
      );
      return res.json(r.data);
    } catch (err: any) {
      return res.status(err.response?.status || 500).json(err.response?.data || { message: "Failed to complete challenge" });
    }
  });

  // =========================================================
  // SECTION 2: NEW CALENDAR ROUTES
  // =========================================================

  // GET /api/hebrew-date — current Hebrew date from Hebcal
  app.get("/api/hebrew-date", async (_req: Request, res: Response) => {
    try {
      const t = today();
      const r = await serverAxiosClient.get(
        `http://localhost:${process.env.PORT || 5000}/api/hebrew-date/${t}`
      );
      return res.json({ ...r.data, gregorianDate: t });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch Hebrew date" });
    }
  });

  // GET /api/gregorian-to-hebrew?date=YYYY-MM-DD — Gregorian to Hebrew conversion
  app.get("/api/gregorian-to-hebrew", async (req: Request, res: Response) => {
    const dateParam = req.query.date as string;
    if (!dateParam) {
      return res.status(400).json({ message: "date query param required (YYYY-MM-DD)" });
    }
    try {
      const r = await serverAxiosClient.get(
        `http://localhost:${process.env.PORT || 5000}/api/hebrew-date/${dateParam}`
      );
      return res.json({ ...r.data, gregorianDate: dateParam });
    } catch (err) {
      return res.status(500).json({ message: "Failed to convert date" });
    }
  });

  // GET /api/hebrew-next-occurrences?hm=Nissan&hd=15&years=3 — next Gregorian dates for a Hebrew date
  app.get("/api/hebrew-next-occurrences", async (req: Request, res: Response) => {
    const hm = req.query.hm as string;
    const hd = req.query.hd as string;
    const years = parseInt((req.query.years as string) || "3");
    if (!hm || !hd) {
      return res.status(400).json({ message: "hm (Hebrew month) and hd (Hebrew day) query params required" });
    }
    try {
      const results: any[] = [];
      const currentYear = new Date().getFullYear();
      for (let i = 0; i < years; i++) {
        const hy = currentYear + 3760 + i;
        try {
          const r = await serverAxiosClient.get(
            `https://www.hebcal.com/converter?cfg=json&hy=${hy}&hm=${encodeURIComponent(hm)}&hd=${hd}&h2g=1`
          );
          if (r.data?.gy) {
            results.push({
              hebrewYear: hy,
              hebrewMonth: hm,
              hebrewDay: parseInt(hd),
              gregorianDate: `${r.data.gy}-${String(r.data.gm).padStart(2, "0")}-${String(r.data.gd).padStart(2, "0")}`,
            });
          }
        } catch {
          // skip years where conversion fails
        }
      }
      return res.json({ occurrences: results });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch next occurrences" });
    }
  });

  // =========================================================
  // SECTION 3: AUTH / PROFILE ROUTES
  // =========================================================

  // POST /api/auth/profile — create or update user profile
  app.post("/api/auth/profile", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const { firstName, lastName, email, hebrewName, birthday, profileImageUrl } = req.body;
      const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId));
      if (existing) {
        const [updated] = await db
          .update(profiles)
          .set({ firstName, lastName, email, hebrewName, birthday, profileImageUrl, updatedAt: new Date() })
          .where(eq(profiles.id, userId))
          .returning();
        return res.json(updated);
      } else {
        const [created] = await db
          .insert(profiles)
          .values({ id: userId, firstName, lastName, email, hebrewName, birthday, profileImageUrl })
          .returning();
        return res.json(created);
      }
    } catch (err) {
      console.error("Error upserting profile:", err);
      return res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // GET /api/auth/profile/:userId — get a user profile
  app.get("/api/auth/profile/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      return res.json(profile);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // PATCH /api/auth/profile/:userId — update profile fields
  app.patch("/api/auth/profile/:userId", optionalAuth, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const requestingUser = (req as any).supabaseUser?.id;
      if (requestingUser && requestingUser !== userId) {
        return res.status(403).json({ message: "Cannot update another user's profile" });
      }
      const { firstName, lastName, email, hebrewName, birthday, profileImageUrl } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (hebrewName !== undefined) updateData.hebrewName = hebrewName;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      const [updated] = await db.update(profiles).set(updateData).where(eq(profiles.id, userId)).returning();
      if (!updated) return res.status(404).json({ message: "Profile not found" });
      return res.json(updated);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // POST /api/auth/delete-account — delete account data
  app.post("/api/auth/delete-account", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      await db.delete(profiles).where(eq(profiles.id, userId));
      await db.delete(nishmasChallenges).where(eq(nishmasChallenges.userId, userId));
      await db.delete(userBadges).where(eq(userBadges.userId, userId));
      await db.delete(mitzvahCompletions).where(eq(mitzvahCompletions.userId, userId));
      return res.json({ success: true, message: "Account data deleted" });
    } catch (err) {
      console.error("Error deleting account:", err);
      return res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // =========================================================
  // SECTION 4: CONTENT VERSIONS
  // =========================================================

  // GET /api/content-versions — row counts for content tables (for cache-busting)
  app.get("/api/content-versions", async (_req: Request, res: Response) => {
    try {
      const tables = [
        "daily_halacha", "daily_emuna", "daily_chizuk", "daily_recipes",
        "marriage_insights", "table_inspirations", "parsha_vorts",
        "torah_classes", "life_classes", "shmiras_halashon", "shalom_content",
        "gems_of_gratitude", "todays_special", "mincha_prayers", "maariv_prayers",
        "morning_prayers", "brochas", "womens_prayers",
      ];
      const counts: Record<string, number> = {};
      await Promise.all(
        tables.map(async (table) => {
          try {
            const result = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
            counts[table] = result.rows[0]?.count ?? 0;
          } catch {
            counts[table] = 0;
          }
        })
      );
      return res.json({ versions: counts, generatedAt: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch content versions" });
    }
  });

  // =========================================================
  // SECTION 5: MITZVAH TRACKING
  // =========================================================

  // POST /api/mitzvah/track — record a mitzvah completion
  app.post("/api/mitzvah/track", async (req: Request, res: Response) => {
    try {
      const { userId, deviceId, category, subtype, date: dateParam } = req.body;
      if (!category) return res.status(400).json({ message: "category required" });
      const [record] = await db
        .insert(mitzvahCompletions)
        .values({ userId: userId || null, deviceId: deviceId || null, category, subtype: subtype || null, date: dateParam || today() })
        .returning();
      return res.json({ success: true, record });
    } catch (err) {
      return res.status(500).json({ message: "Failed to track mitzvah" });
    }
  });

  // GET /api/mitzvah/analytics — aggregated stats
  app.get("/api/mitzvah/analytics", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || "week";
      const days = period === "month" ? 30 : period === "alltime" ? 3650 : 7;
      const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

      const [torahRes, tefillaRes, tzedakaRes, totalRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'torah' AND date >= $1`, [since]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'tefilla' AND date >= $1`, [since]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'tzedaka' AND date >= $1`, [since]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE date >= $1`, [since]),
      ]);

      return res.json({
        period,
        torah: torahRes.rows[0]?.count ?? 0,
        tefilla: tefillaRes.rows[0]?.count ?? 0,
        tzedaka: tzedakaRes.rows[0]?.count ?? 0,
        total: totalRes.rows[0]?.count ?? 0,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // GET /api/mitzvah/personal-analytics — per-user analytics
  app.get("/api/mitzvah/personal-analytics", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || (req.query.userId as string);
      const deviceId = req.query.deviceId as string;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      const [torahRes, tefillaRes, tzedakaRes, totalRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'torah' AND ${col} = $1`, [val]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'tefilla' AND ${col} = $1`, [val]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE category = 'tzedaka' AND ${col} = $1`, [val]),
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions WHERE ${col} = $1`, [val]),
      ]);

      return res.json({
        torah: torahRes.rows[0]?.count ?? 0,
        tefilla: tefillaRes.rows[0]?.count ?? 0,
        tzedaka: tzedakaRes.rows[0]?.count ?? 0,
        total: totalRes.rows[0]?.count ?? 0,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch personal analytics" });
    }
  });

  // GET /api/mitzvah/global-total — total count across all users
  app.get("/api/mitzvah/global-total", async (_req: Request, res: Response) => {
    try {
      const [mitzvahRes, actsRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM mitzvah_completions`),
        pool.query(`SELECT COUNT(*)::int AS count FROM acts`),
      ]);
      const total = (mitzvahRes.rows[0]?.count ?? 0) + (actsRes.rows[0]?.count ?? 0);
      return res.json({ total, updatedAt: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch global total" });
    }
  });

  // GET /api/mitzvah/completed-tehillim — which Tehillim chapters a device/user has completed
  app.get("/api/mitzvah/completed-tehillim", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || (req.query.userId as string);
      const deviceId = req.query.deviceId as string;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      const result = await pool.query(
        `SELECT subtype FROM mitzvah_completions WHERE category = 'tehillim' AND ${col} = $1 ORDER BY completed_at DESC`,
        [val]
      );
      const chapters = result.rows.map((r: any) => r.subtype).filter(Boolean);
      return res.json({ chapters, count: chapters.length });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch completed Tehillim" });
    }
  });

  // POST /api/mitzvah/link-user — link device-based completions to a user account
  app.post("/api/mitzvah/link-user", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId;
      const { deviceId } = req.body;
      if (!userId || !deviceId) return res.status(400).json({ message: "userId and deviceId required" });
      await Promise.all([
        pool.query(`UPDATE mitzvah_completions SET user_id = $1 WHERE device_id = $2 AND user_id IS NULL`, [userId, deviceId]),
        pool.query(`UPDATE nishmas_challenges SET user_id = $1 WHERE device_id = $2 AND user_id IS NULL`, [userId, deviceId]),
        pool.query(`UPDATE user_badges SET user_id = $1 WHERE device_id = $2 AND user_id IS NULL`, [userId, deviceId]),
      ]);
      return res.json({ success: true, message: "Device completions linked to user account" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to link user" });
    }
  });

  // =========================================================
  // SECTION 6: DONATIONS
  // =========================================================

  // GET /api/donations/cancel — Stripe cancel callback
  app.get("/api/donations/cancel", (_req: Request, res: Response) => {
    return res.json({ status: "cancelled", message: "Donation cancelled" });
  });

  // GET /api/donations/total-raised — total tzedaka raised
  app.get("/api/donations/total-raised", async (_req: Request, res: Response) => {
    try {
      const impact = await storage.getCommunityImpact("alltime");
      return res.json({
        totalRaised: impact.totalRaised,
        currency: "USD",
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch total raised" });
    }
  });

  // GET /api/donations/community-impact-content — content entry for community impact display
  app.get("/api/donations/community-impact-content", async (req: Request, res: Response) => {
    try {
      const date = (req.query.date as string) || today();
      const impact = await storage.getCommunityImpactByDate(date);
      return res.json(impact || null);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch community impact content" });
    }
  });

  // POST /api/donations/fix-pending — admin: check for pending donations and fix them
  app.post("/api/donations/fix-pending", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, stripe_session_id, stripe_payment_intent_id FROM donations WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days'`
      );
      return res.json({
        pending: result.rows.length,
        message: `Found ${result.rows.length} pending donations. Use Stripe dashboard to verify and update status via /api/donations/update-status.`,
        donations: result.rows,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to check pending donations" });
    }
  });

  // POST /api/donations/fix-by-sessions — admin: fix donations by Stripe session IDs
  app.post("/api/donations/fix-by-sessions", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { sessionIds, status } = req.body;
      if (!sessionIds || !Array.isArray(sessionIds)) {
        return res.status(400).json({ message: "sessionIds array required" });
      }
      const targetStatus = status || "completed";
      const results = [];
      for (const sessionId of sessionIds) {
        try {
          const updated = await pool.query(
            `UPDATE donations SET status = $1, updated_at = NOW() WHERE stripe_session_id = $2 RETURNING id, status`,
            [targetStatus, sessionId]
          );
          results.push({ sessionId, updated: updated.rows.length > 0 });
        } catch (e) {
          results.push({ sessionId, error: "Failed to update" });
        }
      }
      return res.json({ results, updated: results.filter((r: any) => r.updated).length });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fix donations by sessions" });
    }
  });

  // =========================================================
  // SECTION 7: NISHMAS CHALLENGES
  // =========================================================

  // POST /api/challenges/nishmas/join — join 40-day Nishmas challenge
  app.post("/api/challenges/nishmas/join", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId || null;
      const { deviceId } = req.body;
      if (!deviceId && !userId) return res.status(400).json({ message: "deviceId or userId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;
      const existing = await pool.query(
        `SELECT id FROM nishmas_challenges WHERE ${col} = $1 AND status = 'active' LIMIT 1`,
        [val]
      );
      if (existing.rows.length > 0) return res.status(409).json({ message: "Already in an active challenge" });

      const [challenge] = await db
        .insert(nishmasChallenges)
        .values({ userId, deviceId: deviceId || null, startDate: today(), daysCompleted: 0, status: "active" })
        .returning();
      return res.status(201).json(challenge);
    } catch (err) {
      return res.status(500).json({ message: "Failed to join challenge" });
    }
  });

  // GET /api/challenges/nishmas/status — get challenge status with auto-fail logic
  app.get("/api/challenges/nishmas/status", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || (req.query.userId as string);
      const deviceId = req.query.deviceId as string;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      const challengeResult = await pool.query(
        `SELECT * FROM nishmas_challenges WHERE ${col} = $1 ORDER BY created_at DESC LIMIT 1`,
        [val]
      );
      const challenge = challengeResult.rows[0];

      if (!challenge) return res.json({ status: "none", challenge: null });

      if (challenge.status === "active" && challenge.last_completed_date) {
        const gap = daysBetween(challenge.last_completed_date, today());
        if (gap > 1) {
          await pool.query(`UPDATE nishmas_challenges SET status = 'failed', updated_at = NOW() WHERE id = $1`, [challenge.id]);
          challenge.status = "failed";
        }
      } else if (challenge.status === "active" && !challenge.last_completed_date) {
        const daysSinceStart = daysBetween(challenge.start_date, today());
        if (daysSinceStart > 1) {
          await pool.query(`UPDATE nishmas_challenges SET status = 'failed', updated_at = NOW() WHERE id = $1`, [challenge.id]);
          challenge.status = "failed";
        }
      }

      const todayDone = challenge.last_completed_date === today();
      return res.json({
        status: challenge.status,
        daysCompleted: challenge.days_completed,
        startDate: challenge.start_date,
        lastCompletedDate: challenge.last_completed_date,
        completedToday: todayDone,
        isComplete: challenge.days_completed >= 40,
        challenge,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch challenge status" });
    }
  });

  // POST /api/challenges/nishmas/complete-day — mark a day completed
  app.post("/api/challenges/nishmas/complete-day", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId;
      const { deviceId } = req.body;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      const challengeResult = await pool.query(
        `SELECT * FROM nishmas_challenges WHERE ${col} = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [val]
      );
      const challenge = challengeResult.rows[0];
      if (!challenge) return res.status(404).json({ message: "No active challenge found" });

      if (challenge.last_completed_date === today()) {
        return res.json({ message: "Already completed today", challenge });
      }

      const newDays = (challenge.days_completed || 0) + 1;
      const newStatus = newDays >= 40 ? "completed" : "active";

      const updatedResult = await pool.query(
        `UPDATE nishmas_challenges SET last_completed_date = $1, days_completed = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
        [today(), newDays, newStatus, challenge.id]
      );
      const updated = updatedResult.rows[0];

      if (newStatus === "completed") {
        const badgeUserId = userId || null;
        const badgeDeviceId = deviceId || null;
        const existingBadge = await pool.query(
          `SELECT id FROM user_badges WHERE badge = '40_day_nishmas' AND (user_id = $1 OR device_id = $2) LIMIT 1`,
          [badgeUserId, badgeDeviceId]
        );
        if (existingBadge.rows.length === 0) {
          await db.insert(userBadges).values({ userId: badgeUserId, deviceId: badgeDeviceId, badge: "40_day_nishmas" });
        }
      }

      return res.json({ success: true, daysCompleted: newDays, status: newStatus, challenge: updated });
    } catch (err) {
      return res.status(500).json({ message: "Failed to complete day" });
    }
  });

  // POST /api/challenges/nishmas/restart — restart challenge
  app.post("/api/challenges/nishmas/restart", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || req.body.userId;
      const { deviceId } = req.body;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      await pool.query(`UPDATE nishmas_challenges SET status = 'superseded' WHERE ${col} = $1 AND status IN ('active', 'failed')`, [val]);

      const [challenge] = await db
        .insert(nishmasChallenges)
        .values({ userId: userId || null, deviceId: deviceId || null, startDate: today(), daysCompleted: 0, status: "active" })
        .returning();

      return res.json({ success: true, challenge });
    } catch (err) {
      return res.status(500).json({ message: "Failed to restart challenge" });
    }
  });

  // =========================================================
  // SECTION 8: BADGES
  // =========================================================

  // GET /api/badges — get earned badges for a user or device
  app.get("/api/badges", optionalAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).supabaseUser?.id || (req.query.userId as string);
      const deviceId = req.query.deviceId as string;
      if (!userId && !deviceId) return res.status(400).json({ message: "userId or deviceId required" });

      const col = userId ? "user_id" : "device_id";
      const val = userId || deviceId;

      const badgesResult = await pool.query(
        `SELECT badge, earned_at FROM user_badges WHERE ${col} = $1 ORDER BY earned_at DESC`,
        [val]
      );
      return res.json({ badges: badgesResult.rows });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  // =========================================================
  // SECTION 9: PSUKIM
  // =========================================================

  // GET /api/psukim/for-name?startLetter=א&endLetter=ה — pasuk by first/last Hebrew letter
  app.get("/api/psukim/for-name", async (req: Request, res: Response) => {
    try {
      const startLetter = req.query.startLetter as string;
      const endLetter = req.query.endLetter as string;
      if (!startLetter) return res.status(400).json({ message: "startLetter required" });

      let result;
      if (endLetter) {
        result = await pool.query(
          `SELECT * FROM name_psukim WHERE first_letter = $1 AND last_letter = $2 LIMIT 5`,
          [startLetter, endLetter]
        );
      } else {
        result = await pool.query(
          `SELECT * FROM name_psukim WHERE first_letter = $1 LIMIT 5`,
          [startLetter]
        );
      }
      return res.json({ psukim: result.rows, count: result.rows.length });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch psukim" });
    }
  });

  // GET /api/psukim/for-full-name?name=[{"start":"א","end":"ה"},{"start":"ש","end":"ל"}]
  // Accepts JSON array of {start, end} letter pairs
  app.get("/api/psukim/for-full-name", async (req: Request, res: Response) => {
    try {
      const nameParam = req.query.name as string;
      if (!nameParam) return res.status(400).json({ message: "name query param required (JSON array of letter pairs)" });

      let pairs: Array<{ start: string; end: string }>;
      try {
        pairs = JSON.parse(nameParam);
      } catch {
        return res.status(400).json({ message: "name must be valid JSON array of {start, end} objects" });
      }

      const results = await Promise.all(
        pairs.map(async ({ start, end }) => {
          const r = await pool.query(
            `SELECT * FROM name_psukim WHERE first_letter = $1 AND last_letter = $2 LIMIT 3`,
            [start, end]
          );
          return { startLetter: start, endLetter: end, psukim: r.rows };
        })
      );

      return res.json({ results });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch psukim for full name" });
    }
  });

  // POST /api/psukim/seed — admin: seed the name_psukim table
  app.post("/api/psukim/seed", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { psukim } = req.body;
      if (!Array.isArray(psukim) || psukim.length === 0) {
        return res.status(400).json({ message: "psukim array required" });
      }
      await db.insert(namePsukim).values(psukim).onConflictDoNothing();
      return res.json({ success: true, inserted: psukim.length });
    } catch (err) {
      return res.status(500).json({ message: "Failed to seed psukim" });
    }
  });

  // POST /api/admin/seed-challenge — admin: seed a community challenge
  app.post("/api/admin/seed-challenge", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const challenge = await storage.createTodaysSpecial(req.body);
      return res.json(challenge);
    } catch (err) {
      return res.status(500).json({ message: "Failed to seed challenge" });
    }
  });
}
