import { pgTable, text, serial, integer, boolean, timestamp, date, index, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Weekly Torah content tables
export const dailyRecipes = pgTable("daily_recipes", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // The date this recipe should be displayed
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
  thankYouMessage: text("thank_you_message"), // Dynamic thank you message with support for clickable links
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
  thankYouMessage: text("thank_you_message"), // Dynamic thank you message with support for clickable links
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





export const communityImpact = pgTable("community_impact", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Start date for article availability
  untilDate: date("until_date").notNull(), // End date for article availability
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification tables
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Auth keys for encryption
  auth: text("auth").notNull(),
  sessionId: text("session_id"), // Track which session subscribed
  subscribed: boolean("subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon"),
  badge: text("badge"),
  url: text("url"), // URL to open when notification is clicked
  data: jsonb("data"), // Additional data
  sentAt: timestamp("sent_at").defaultNow(),
  sentCount: integer("sent_count").default(0), // How many users received it
  successCount: integer("success_count").default(0), // How many successfully delivered
  failureCount: integer("failure_count").default(0), // How many failed
  createdBy: text("created_by"), // Admin who sent it
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

export const morningPrayers = pgTable("morning_prayers", {
  id: serial("id").primaryKey(),
  prayerType: text("prayer_type").notNull(), // e.g., "modeh_ani", "netilat_yadayim", "birchot_hashachar", "pesukei_dzimra"
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

export const brochas = pgTable("brochas", {
  id: serial("id").primaryKey(),
  title: text("Title").notNull(),
  hebrewText: text("Hebrew Text"),
  englishText: text("English Text"),
  description: text("description"),
  specialOccasions: boolean("special_occasions").default(false),
  orderIndex: integer("order_index").default(0),
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

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(), // Amount in cents
  donationType: text("donation_type").default("General Donation").notNull(),
  sponsorName: text("sponsor_name"),
  dedication: text("dedication"),
  email: text("email"),
  status: text("status").notNull(), // 'succeeded', 'pending', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Existing fields from database
  fundraiseUpId: varchar("fundraise_up_id"),
  supporterId: varchar("supporter_id"),
  currency: varchar("currency").default("USD"),
  recurring: boolean("recurring").default(false),
  livemode: boolean("livemode").default(true),
  campaign: text("campaign"),
  rawData: jsonb("raw_data"),
  // New fields for comprehensive tracking
  userId: text("user_id"), // User who made the donation
  type: text("type"), // 'active_campaign', 'put_a_coin', 'sponsor_a_day', 'gave_elsewhere'
  inHonorOf: text("in_honor_of"), // For sponsor a day
  message: text("message"), // For sponsor a day
  campaignId: text("campaign_id"), // Reference to campaign
  stripeSessionId: text("stripe_session_id"), // Stripe checkout session ID
  metadata: jsonb("metadata"), // Additional metadata from Stripe
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
  content: text("content").notNull(),
  provider: text("provider"),
  footnotes: text("footnotes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pirkei Avot table for internal content management
export const pirkeiAvot = pgTable("pirkei_avot", {
  id: serial("id").primaryKey(),
  chapter: integer("chapter").notNull(), // Chapter number (1-6)
  perek: integer("perek").notNull(), // Verse number within chapter
  content: text("content").notNull(), // English content
  orderIndex: integer("order_index").notNull(), // For cycling through in order
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orderIdx: index("pirkei_avot_order_idx").on(table.orderIndex),
  chapterIdx: index("pirkei_avot_chapter_idx").on(table.chapter),
}));

// Pirkei Avot progression tracking
export const pirkeiAvotProgress = pgTable("pirkei_avot_progress", {
  id: serial("id").primaryKey(),
  currentOrderIndex: integer("current_order_index").notNull().default(0), // Track by orderIndex for cycling
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

// Acts table for tracking individual Tzedaka acts  
export const acts = pgTable("acts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // User who performed the act
  category: text("category").notNull(), // 'tzedaka', 'torah', 'tefilla'
  subtype: text("subtype"), // 'active_campaign', 'put_a_coin', 'sponsor_a_day', 'gave_elsewhere'
  amount: integer("amount").default(0), // Amount in cents, 0 for "gave elsewhere"
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID for idempotency
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  // Enhanced financial tracking
  tzedakaActs: integer("tzedaka_acts").default(0), // Total tzedaka acts count
  moneyRaised: integer("money_raised").default(0), // Total money raised in cents
  activeCampaignTotal: integer("active_campaign_total").default(0), // Active campaign donations
  putACoinTotal: integer("put_a_coin_total").default(0), // Put a coin donations  
  sponsorADayTotal: integer("sponsor_a_day_total").default(0), // Sponsor a day donations
  gaveElsewhereCount: integer("gave_elsewhere_count").default(0), // Count of "gave elsewhere" acts
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

export const insertMorningPrayerSchema = createInsertSchema(morningPrayers).omit({
  id: true,
});

export const insertBirkatHamazonPrayerSchema = createInsertSchema(birkatHamazonPrayers).omit({
  id: true,
});

export const insertAfterBrochasPrayerSchema = createInsertSchema(afterBrochasPrayers).omit({
  id: true,
  createdAt: true,
});

export const insertBrochasSchema = createInsertSchema(brochas).omit({
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

export const insertPirkeiAvotSchema = createInsertSchema(pirkeiAvot).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export const insertActSchema = createInsertSchema(acts).omit({
  id: true,
  createdAt: true,
});

// Types
export type AfterBrochasPrayer = typeof afterBrochasPrayers.$inferSelect;
export type InsertAfterBrochasPrayer = z.infer<typeof insertAfterBrochasPrayerSchema>;
export type Brocha = typeof brochas.$inferSelect;
export type InsertBrocha = z.infer<typeof insertBrochasSchema>;

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
}).refine(data => {
  // Data integrity: Only allow mediaType when corresponding mediaUrl exists
  const mediaFields = [1, 2, 3, 4, 5];
  for (const num of mediaFields) {
    const urlKey = `mediaUrl${num}` as keyof typeof data;
    const typeKey = `mediaType${num}` as keyof typeof data;
    
    if (!data[urlKey] && data[typeKey]) {
      return false; // mediaType set without mediaUrl
    }
  }
  return true;
}, {
  message: "mediaType can only be set when corresponding mediaUrl exists"
});

export const insertCommunityImpactSchema = createInsertSchema(communityImpact).omit({
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
export type MorningPrayer = typeof morningPrayers.$inferSelect;
export type InsertMorningPrayer = z.infer<typeof insertMorningPrayerSchema>;
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

export type CommunityImpact = typeof communityImpact.$inferSelect;
export type InsertCommunityImpact = z.infer<typeof insertCommunityImpactSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type InspirationalQuote = typeof inspirationalQuotes.$inferSelect;
export type InsertInspirationalQuote = z.infer<typeof insertInspirationalQuoteSchema>;

export type WomensPrayer = typeof womensPrayers.$inferSelect;
export type InsertWomensPrayer = z.infer<typeof insertWomensPrayerSchema>;

export type DiscountPromotion = typeof discountPromotions.$inferSelect;
export type InsertDiscountPromotion = z.infer<typeof insertDiscountPromotionSchema>;

export type PirkeiAvot = typeof pirkeiAvot.$inferSelect;
export type InsertPirkeiAvot = z.infer<typeof insertPirkeiAvotSchema>;

export type PirkeiAvotProgress = typeof pirkeiAvotProgress.$inferSelect;
export type InsertPirkeiAvotProgress = z.infer<typeof insertPirkeiAvotProgressSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type Act = typeof acts.$inferSelect;
export type InsertAct = z.infer<typeof insertActSchema>;

// Tehillim table
export const tehillim = pgTable("tehillim", {
  id: serial("id").primaryKey(),
  englishNumber: integer("english_number").notNull(),
  partNumber: integer("part_number").notNull(),
  hebrewNumber: text("hebrew_number").notNull(),
  englishText: text("english_text").notNull(),
  hebrewText: text("hebrew_text").notNull(),
});

export const insertTehillimSchema = createInsertSchema(tehillim);
export type Tehillim = typeof tehillim.$inferSelect;
export type InsertTehillim = z.infer<typeof insertTehillimSchema>;

// Messages table for daily messages to users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMessagesSchema = createInsertSchema(messages);
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessagesSchema>;

// Push notification schemas and types
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true, sentAt: true });
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;

// App version history table for tracking deployments and updates
export const appVersions = pgTable("app_versions", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 50 }).notNull(),
  buildNumber: integer("build_number").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  releaseNotes: text("release_notes"),
  environment: varchar("environment", { length: 20 }).notNull().default('production'), // 'production', 'staging', 'development'
  isActive: boolean("is_active").default(true).notNull(),
  deployedBy: text("deployed_by"),
  gitCommit: varchar("git_commit", { length: 40 }),
  changesSummary: text("changes_summary"),
  isCritical: boolean("is_critical").default(false), // Force update flag
  minClientVersion: varchar("min_client_version", { length: 50 }), // Minimum compatible client version
}, (table) => {
  return {
    versionIdx: index("version_idx").on(table.version),
    timestampIdx: index("timestamp_idx").on(table.timestamp),
    activeIdx: index("active_idx").on(table.isActive),
  };
});

export const insertAppVersionSchema = createInsertSchema(appVersions).omit({ id: true, deployedAt: true });
export type AppVersion = typeof appVersions.$inferSelect;
export type InsertAppVersion = z.infer<typeof insertAppVersionSchema>;
