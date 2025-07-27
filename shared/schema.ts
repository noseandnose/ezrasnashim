import { pgTable, text, serial, integer, boolean, timestamp, date, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Weekly Torah content tables
export const dailyRecipes = pgTable("daily_recipes", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Start date for recipe availability
  untilDate: date("until_date").notNull(), // End date for recipe availability (same as fromDate if daily)
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
  fromDate: date("from_date").notNull(), // Week start date
  untilDate: date("until_date").notNull(), // Week end date
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tableInspirations = pgTable("table_inspirations", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Week start date
  untilDate: date("until_date").notNull(), // Week end date
  title: text("title").notNull(),
  content: text("content").notNull(), // Main paragraph text
  mediaUrl1: text("media_url_1"),
  mediaType1: text("media_type_1"), // 'image', 'audio', 'video'
  mediaUrl2: text("media_url_2"),
  mediaType2: text("media_type_2"), // 'image', 'audio', 'video'
  mediaUrl3: text("media_url_3"),
  mediaType3: text("media_type_3"), // 'image', 'audio', 'video'
  mediaUrl4: text("media_url_4"),
  mediaType4: text("media_type_4"), // 'image', 'audio', 'video'
  mediaUrl5: text("media_url_5"),
  mediaType5: text("media_type_5"), // 'image', 'audio', 'video'
  createdAt: timestamp("created_at").defaultNow(),
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

export const maarivPrayers = pgTable("maariv_prayers", {
  id: serial("id").primaryKey(),
  prayerType: text("prayer_type").notNull(), // e.g., "main_prayer", "shema", "shemoneh_esrei", "aleinu"
  hebrewText: text("hebrew_text").notNull(),
  englishTranslation: text("english_translation").notNull(),
  orderIndex: integer("order_index").default(0),
});

export const birkatHamazonPrayers = pgTable("birkat_hamazon_prayers", {
  id: serial("id").primaryKey(),
  prayerType: text("prayer_type").notNull(), // e.g., "main_blessing", "shir_hamaalot", "nodeh_lecha", "harachaman"
  hebrewText: text("hebrew_text").notNull(),
  englishTranslation: text("english_translation").notNull(),
  orderIndex: integer("order_index").default(0),
});

export const afterBrochasPrayers = pgTable("after_brochas_prayers", {
  id: serial("id").primaryKey(),
  prayerName: text("prayer_name").notNull(), // "Al Hamichiya" or "Birkat Hamazon"
  hebrewText: text("hebrew_text").notNull(),
  englishTranslation: text("english_translation").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hebrewName: text("hebrew_name"),
  sponsorshipDate: text("sponsorship_date").notNull(), // Store as YYYY-MM-DD string
  inHonorMemoryOf: text("in_honor_memory_of"), // Single line dedication text
  message: text("message"), // Short message about the person
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nishmasText = pgTable("nishmas_text", {
  id: serial("id").primaryKey(),
  language: text("language").notNull(), // 'hebrew' or 'english'
  fullText: text("full_text").notNull(),
  source: text("source").default("Nishmas.net"),
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
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountPromotions = pgTable("discount_promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  logoUrl: text("logo_url").notNull(),
  linkUrl: text("link_url").notNull(),
  targetLocation: text("target_location").default("worldwide").notNull(), // 'israel', 'worldwide'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily Torah content tables
export const dailyHalacha = pgTable("daily_halacha", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(), // Main halacha text content
  footnotes: text("footnotes"), // Optional footnotes section
  thankYouMessage: text("thank_you_message"), // Thank you attribution message
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyEmuna = pgTable("daily_emuna", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChizuk = pgTable("daily_chizuk", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const featuredContent = pgTable("featured_content", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  speaker: text("speaker"),
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

// Analytics tracking tables - Only essential completion events
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // Only: 'modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete'
  eventData: jsonb("event_data"), // Additional context data
  sessionId: text("session_id"),
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
  booksCompleted: integer("books_completed").default(0), // Track complete Tehillim book finishes
  totalActs: integer("total_acts").default(0), // New field for total acts (Torah + Tefilla + Tzedaka)
  modalCompletions: jsonb("modal_completions").default({}), // { "torah": 10, "tefilla": 20, etc }
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas - defined after all tables


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

export const insertMaarivPrayerSchema = createInsertSchema(maarivPrayers).omit({
  id: true,
});

export const insertBirkatHamazonPrayerSchema = createInsertSchema(birkatHamazonPrayers).omit({
  id: true,
});

export const insertAfterBrochasPrayerSchema = createInsertSchema(afterBrochasPrayers).omit({
  id: true,
  createdAt: true,
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

// Types
export type AfterBrochasPrayer = typeof afterBrochasPrayers.$inferSelect;
export type InsertAfterBrochasPrayer = z.infer<typeof insertAfterBrochasPrayerSchema>;

// Weekly Torah content schemas
export const insertDailyRecipeSchema = createInsertSchema(dailyRecipes).omit({
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
export type MaarivPrayer = typeof maarivPrayers.$inferSelect;
export type InsertMaarivPrayer = z.infer<typeof insertMaarivPrayerSchema>;
export type BirkatHamazonPrayer = typeof birkatHamazonPrayers.$inferSelect;
export type InsertBirkatHamazonPrayer = z.infer<typeof insertBirkatHamazonPrayerSchema>;
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
export type DailyRecipe = typeof dailyRecipes.$inferSelect;
export type InsertDailyRecipe = z.infer<typeof insertDailyRecipeSchema>;
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
