import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// No user authentication needed - app works for everyone without profiles

// Daily Torah content - each type gets its own table for better performance and organization
export const dailyHalacha = pgTable("daily_halacha", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // SQL date for efficient querying
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // Reference/citation
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyMussar = pgTable("daily_mussar", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  author: text("author"), // Who wrote/said this
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChizuk = pgTable("daily_chizuk", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(), // Chizuk is primarily audio
  duration: text("duration"), // Audio length
  speaker: text("speaker"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loshonHorah = pgTable("loshon_horah", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  halachicSource: text("halachic_source"), // Which sefer/posek
  practicalTip: text("practical_tip"), // Daily practical application
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Torah content tables
export const shabbatRecipes = pgTable("shabbat_recipes", {
  id: serial("id").primaryKey(),
  week: date("week").notNull(), // Start date of the week
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ingredients: text("ingredients").notNull(), // JSON array as text
  instructions: text("instructions").notNull(),
  servings: text("servings"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  imageUrl: text("image_url"),
  tags: text("tags"), // JSON array: kosher, pareve, dairy, meat
  createdAt: timestamp("created_at").defaultNow(),
});

export const parshaVorts = pgTable("parsha_vorts", {
  id: serial("id").primaryKey(),
  week: date("week").notNull(), // Start date of the week
  parsha: text("parsha").notNull(), // Parsha name
  hebrewParsha: text("hebrew_parsha").notNull(),
  title: text("title").notNull(),
  content: text("content"), // Written vort content
  audioUrl: text("audio_url").notNull(), // Audio is primary
  duration: text("duration"),
  speaker: text("speaker").notNull(),
  source: text("source"), // Sefer/reference
  summary: text("summary"), // Brief description
  createdAt: timestamp("created_at").defaultNow(),
});



export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  gregorianDate: text("gregorian_date").notNull(),
  recurring: boolean("recurring").default(true),
  years: integer("years").default(20), // how many years to add
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  title: text("title").notNull(), // e.g., "20% off at Danielle Faye"
  description: text("description").notNull(),
  couponCode: text("coupon_code"),
  backgroundImageUrl: text("background_image_url").notNull(),
  externalUrl: text("external_url"),
  isActive: boolean("is_active").default(true),
});

export const tehillimNames = pgTable("tehillim_names", {
  id: serial("id").primaryKey(),
  hebrewName: text("hebrew_name").notNull(),
  reason: text("reason").notNull(),
  reasonEnglish: text("reason_english"),
  dateAdded: timestamp("date_added").defaultNow(),
  expiresAt: timestamp("expires_at"), // 7 days from dateAdded
  userId: integer("user_id"), // Future: link to user accounts
});

export const tehillimProgress = pgTable("tehillim_progress", {
  id: serial("id").primaryKey(),
  currentPerek: integer("current_perek").default(1),
  currentNameId: integer("current_name_id"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  userId: integer("user_id"), // Future: link to user accounts
});

// Global progress table - single row for all users
export const globalTehillimProgress = pgTable("global_tehillim_progress", {
  id: serial("id").primaryKey(),
  currentPerek: integer("current_perek").default(1).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  completedBy: text("completed_by"), // Track who completed it
});

export const perakimTexts = pgTable("perakim_texts", {
  id: serial("id").primaryKey(),
  perekNumber: integer("perek_number").notNull().unique(),
  hebrewText: text("hebrew_text"),
  englishTranslation: text("english_translation"),
  transliteration: text("transliteration"),
});

export const minchaPrayers = pgTable("mincha_prayers", {
  id: serial("id").primaryKey(),
  prayerType: text("prayer_type").notNull(), // e.g., "main_prayer", "ashrei", "shemoneh_esrei"
  hebrewText: text("hebrew_text").notNull(),
  englishTranslation: text("english_translation").notNull(),
  transliteration: text("transliteration"),
  orderIndex: integer("order_index").default(0),
});

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hebrewName: text("hebrew_name"),
  sponsorshipDate: text("sponsorship_date").notNull(), // Store as YYYY-MM-DD string
  message: text("message"), // Optional custom message
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nishmasText = pgTable("nishmas_text", {
  id: serial("id").primaryKey(),
  language: text("language").notNull(), // 'hebrew' or 'english'
  fullText: text("full_text").notNull(),
  transliteration: text("transliteration"), // For Hebrew text
  source: text("source").default("Nishmas.net"),
  version: text("version").default("1.0"), // For tracking text updates
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalAmount: integer("goal_amount").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inspirationalQuotes = pgTable("inspirational_quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  source: text("source").notNull(),
  date: date("date").notNull(), // The date when this quote should appear
  createdAt: timestamp("created_at").defaultNow(),
});



export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({
  id: true,
});

export const insertTehillimNameSchema = createInsertSchema(tehillimNames).omit({
  id: true,
  dateAdded: true,
  expiresAt: true,
});

export const insertTehillimProgressSchema = createInsertSchema(tehillimProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertPerekTextSchema = createInsertSchema(perakimTexts).omit({
  id: true,
});

export const insertGlobalTehillimProgressSchema = createInsertSchema(globalTehillimProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertMinchaPrayerSchema = createInsertSchema(minchaPrayers).omit({
  id: true,
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

export const insertNishmasTextSchema = createInsertSchema(nishmasText).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Daily Torah content schemas
export const insertDailyHalachaSchema = createInsertSchema(dailyHalacha).omit({
  id: true,
  createdAt: true,
});

export const insertDailyMussarSchema = createInsertSchema(dailyMussar).omit({
  id: true,
  createdAt: true,
});

export const insertDailyChizukSchema = createInsertSchema(dailyChizuk).omit({
  id: true,
  createdAt: true,
});

export const insertLoshonHorahSchema = createInsertSchema(loshonHorah).omit({
  id: true,
  createdAt: true,
});

// Weekly Torah content schemas
export const insertShabbatRecipeSchema = createInsertSchema(shabbatRecipes).omit({
  id: true,
  createdAt: true,
});

export const insertParshaVortSchema = createInsertSchema(parshaVorts).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInspirationalQuoteSchema = createInsertSchema(inspirationalQuotes).omit({
  id: true,
  createdAt: true,
});

// No user types needed - app works without authentication
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;
export type TehillimName = typeof tehillimNames.$inferSelect;
export type InsertTehillimName = z.infer<typeof insertTehillimNameSchema>;
export type TehillimProgress = typeof tehillimProgress.$inferSelect;
export type InsertTehillimProgress = z.infer<typeof insertTehillimProgressSchema>;
export type PerekText = typeof perakimTexts.$inferSelect;
export type InsertPerekText = z.infer<typeof insertPerekTextSchema>;
export type GlobalTehillimProgress = typeof globalTehillimProgress.$inferSelect;
export type InsertGlobalTehillimProgress = z.infer<typeof insertGlobalTehillimProgressSchema>;
export type MinchaPrayer = typeof minchaPrayers.$inferSelect;
export type InsertMinchaPrayer = z.infer<typeof insertMinchaPrayerSchema>;
export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

export type NishmasText = typeof nishmasText.$inferSelect;
export type InsertNishmasText = z.infer<typeof insertNishmasTextSchema>;

// Daily Torah content types
export type DailyHalacha = typeof dailyHalacha.$inferSelect;
export type InsertDailyHalacha = z.infer<typeof insertDailyHalachaSchema>;
export type DailyMussar = typeof dailyMussar.$inferSelect;
export type InsertDailyMussar = z.infer<typeof insertDailyMussarSchema>;
export type DailyChizuk = typeof dailyChizuk.$inferSelect;
export type InsertDailyChizuk = z.infer<typeof insertDailyChizukSchema>;
export type LoshonHorah = typeof loshonHorah.$inferSelect;
export type InsertLoshonHorah = z.infer<typeof insertLoshonHorahSchema>;

// Weekly Torah content types
export type ShabbatRecipe = typeof shabbatRecipes.$inferSelect;
export type InsertShabbatRecipe = z.infer<typeof insertShabbatRecipeSchema>;
export type ParshaVort = typeof parshaVorts.$inferSelect;
export type InsertParshaVort = z.infer<typeof insertParshaVortSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type InspirationalQuote = typeof inspirationalQuotes.$inferSelect;
export type InsertInspirationalQuote = z.infer<typeof insertInspirationalQuoteSchema>;
