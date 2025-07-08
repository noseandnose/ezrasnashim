import { pgTable, text, serial, integer, boolean, timestamp, date, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  speaker: text("speaker").notNull(),
  source: text("source"), // Sefer/reference
  summary: text("summary"), // Brief description
  createdAt: timestamp("created_at").defaultNow(),
});

export const tableInspirations = pgTable("table_inspirations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // Daily inspiration
  title: text("title").notNull(),
  content: text("content").notNull(), // Main paragraph text
  imageUrl1: text("image_url_1"),
  imageUrl2: text("image_url_2"),
  imageUrl3: text("image_url_3"),
  imageUrl4: text("image_url_4"),
  imageUrl5: text("image_url_5"),
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
  expiresAt: timestamp("expires_at"), // 18 days from dateAdded
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
  currentNameId: integer("current_name_id"), // Reference to assigned name for current perek
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

export const womensPrayers = pgTable("womens_prayers", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'refuah', 'family', 'life'
  prayerName: text("prayer_name").notNull(),
  hebrewText: text("hebrew_text"),
  englishTranslation: text("english_translation"),
  transliteration: text("transliteration"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountPromotions = pgTable("discount_promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  logoUrl: text("logo_url").notNull(),
  linkUrl: text("link_url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily Torah content tables
export const dailyHalacha = pgTable("daily_halacha", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // The date for this content
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"), // Rabbi or book source
  audioUrl: text("audio_url"), // Optional audio content
  speaker: text("speaker"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyEmuna = pgTable("daily_emuna", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  audioUrl: text("audio_url"),
  speaker: text("speaker"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChizuk = pgTable("daily_chizuk", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  audioUrl: text("audio_url"),
  speaker: text("speaker"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const featuredContent = pgTable("featured_content", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  halachicSource: text("halachic_source"),
  practicalTip: text("practical_tip"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pirkei Avot progression tracking
export const pirkeiAvotProgress = pgTable("pirkei_avot_progress", {
  id: serial("id").primaryKey(),
  currentChapter: integer("current_chapter").notNull().default(1),
  currentVerse: integer("current_verse").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Analytics tracking tables
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // 'page_view', 'modal_open', 'modal_complete', 'tehillim_complete', 'name_prayed'
  eventData: jsonb("event_data"), // Additional context data
  sessionId: text("session_id"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventTypeIdx: index("analytics_events_type_idx").on(table.eventType),
  createdAtIdx: index("analytics_events_created_idx").on(table.createdAt),
}));

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  uniqueUsers: integer("unique_users").default(0),
  pageViews: integer("page_views").default(0),
  tehillimCompleted: integer("tehillim_completed").default(0),
  namesProcessed: integer("names_processed").default(0),
  modalCompletions: jsonb("modal_completions").default({}), // { "torah": 10, "tefilla": 20, etc }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas - defined after all tables
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
}).extend({
  hebrewDate: z.string().optional(),
});

export const insertDailyEmunaSchema = createInsertSchema(dailyEmuna).omit({
  id: true,
  createdAt: true,
}).extend({
  hebrewDate: z.string().optional(),
});

export const insertDailyChizukSchema = createInsertSchema(dailyChizuk).omit({
  id: true,
  createdAt: true,
}).extend({
  hebrewDate: z.string().optional(),
});

export const insertFeaturedContentSchema = createInsertSchema(featuredContent).omit({
  id: true,
  createdAt: true,
}).extend({
  hebrewDate: z.string().optional(),
});

export const insertPirkeiAvotProgressSchema = createInsertSchema(pirkeiAvotProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertTableInspirationSchema = createInsertSchema(tableInspirations).omit({
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

export const insertWomensPrayerSchema = createInsertSchema(womensPrayers).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountPromotionSchema = createInsertSchema(discountPromotions).omit({
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
export type DailyEmuna = typeof dailyEmuna.$inferSelect;
export type InsertDailyEmuna = z.infer<typeof insertDailyEmunaSchema>;
export type DailyChizuk = typeof dailyChizuk.$inferSelect;
export type InsertDailyChizuk = z.infer<typeof insertDailyChizukSchema>;
export type FeaturedContent = typeof featuredContent.$inferSelect;
export type InsertFeaturedContent = z.infer<typeof insertFeaturedContentSchema>;

// Weekly Torah content types
export type ShabbatRecipe = typeof shabbatRecipes.$inferSelect;
export type InsertShabbatRecipe = z.infer<typeof insertShabbatRecipeSchema>;
export type ParshaVort = typeof parshaVorts.$inferSelect;
export type InsertParshaVort = z.infer<typeof insertParshaVortSchema>;
export type TableInspiration = typeof tableInspirations.$inferSelect;
export type InsertTableInspiration = z.infer<typeof insertTableInspirationSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type InspirationalQuote = typeof inspirationalQuotes.$inferSelect;
export type InsertInspirationalQuote = z.infer<typeof insertInspirationalQuoteSchema>;

export type WomensPrayer = typeof womensPrayers.$inferSelect;
export type InsertWomensPrayer = z.infer<typeof insertWomensPrayerSchema>;

export type DiscountPromotion = typeof discountPromotions.$inferSelect;
export type InsertDiscountPromotion = z.infer<typeof insertDiscountPromotionSchema>;

export type PirkeiAvotProgress = typeof pirkeiAvotProgress.$inferSelect;
export type InsertPirkeiAvotProgress = z.infer<typeof insertPirkeiAvotProgressSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;
