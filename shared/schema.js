"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDailyRecipeSchema = exports.insertDailyStatsSchema = exports.insertAnalyticsEventSchema = exports.insertPirkeiAvotProgressSchema = exports.insertPirkeiAvotSchema = exports.insertFeaturedContentSchema = exports.insertDailyChizukSchema = exports.insertDailyEmunaSchema = exports.insertDailyHalachaSchema = exports.insertNishmasTextSchema = exports.insertSponsorSchema = exports.insertAfterBrochasPrayerSchema = exports.insertBirkatHamazonPrayerSchema = exports.insertMorningPrayerSchema = exports.insertMaarivPrayerSchema = exports.insertMinchaPrayerSchema = exports.insertGlobalTehillimProgressSchema = exports.insertPerekTextSchema = exports.insertTehillimProgressSchema = exports.insertTehillimNameSchema = exports.insertShopItemSchema = exports.dailyStats = exports.analyticsEvents = exports.pirkeiAvotProgress = exports.pirkeiAvot = exports.featuredContent = exports.dailyChizuk = exports.dailyEmuna = exports.dailyHalacha = exports.discountPromotions = exports.womensPrayers = exports.inspirationalQuotes = exports.donations = exports.campaigns = exports.nishmasText = exports.sponsors = exports.afterBrochasPrayers = exports.birkatHamazonPrayers = exports.morningPrayers = exports.maarivPrayers = exports.minchaPrayers = exports.perakimTexts = exports.globalTehillimProgress = exports.tehillimProgress = exports.tehillimNames = exports.shopItems = exports.communityImpact = exports.tableInspirations = exports.parshaVorts = exports.dailyRecipes = void 0;
exports.insertTehillimSchema = exports.tehillim = exports.insertDiscountPromotionSchema = exports.insertWomensPrayerSchema = exports.insertInspirationalQuoteSchema = exports.insertCampaignSchema = exports.insertCommunityImpactSchema = exports.insertTableInspirationSchema = exports.insertParshaVortSchema = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// Weekly Torah content tables
exports.dailyRecipes = (0, pg_core_1.pgTable)("daily_recipes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    fromDate: (0, pg_core_1.date)("from_date").notNull(), // Start date for recipe availability
    untilDate: (0, pg_core_1.date)("until_date").notNull(), // End date for recipe availability (same as fromDate if daily)
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    ingredients: (0, pg_core_1.text)("ingredients").notNull(), // JSON array as text
    instructions: (0, pg_core_1.text)("instructions").notNull(),
    servings: (0, pg_core_1.text)("servings"),
    prepTime: (0, pg_core_1.text)("prep_time"),
    cookTime: (0, pg_core_1.text)("cook_time"),
    difficulty: (0, pg_core_1.text)("difficulty"), // 'easy', 'medium', 'hard'
    imageUrl: (0, pg_core_1.text)("image_url"),
    tags: (0, pg_core_1.text)("tags"), // JSON array: kosher, pareve, dairy, meat
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.parshaVorts = (0, pg_core_1.pgTable)("parsha_vorts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    fromDate: (0, pg_core_1.date)("from_date").notNull(), // Week start date
    untilDate: (0, pg_core_1.date)("until_date").notNull(), // Week end date
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content"),
    audioUrl: (0, pg_core_1.text)("audio_url").notNull(),
    speaker: (0, pg_core_1.text)("speaker"),
    speakerWebsite: (0, pg_core_1.text)("speaker_website"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.tableInspirations = (0, pg_core_1.pgTable)("table_inspirations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    fromDate: (0, pg_core_1.date)("from_date").notNull(), // Week start date
    untilDate: (0, pg_core_1.date)("until_date").notNull(), // Week end date
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(), // Main paragraph text
    mediaUrl1: (0, pg_core_1.text)("media_url_1"),
    mediaType1: (0, pg_core_1.text)("media_type_1"), // 'image', 'audio', 'video'
    mediaUrl2: (0, pg_core_1.text)("media_url_2"),
    mediaType2: (0, pg_core_1.text)("media_type_2"), // 'image', 'audio', 'video'
    mediaUrl3: (0, pg_core_1.text)("media_url_3"),
    mediaType3: (0, pg_core_1.text)("media_type_3"), // 'image', 'audio', 'video'
    mediaUrl4: (0, pg_core_1.text)("media_url_4"),
    mediaType4: (0, pg_core_1.text)("media_type_4"), // 'image', 'audio', 'video'
    mediaUrl5: (0, pg_core_1.text)("media_url_5"),
    mediaType5: (0, pg_core_1.text)("media_type_5"), // 'image', 'audio', 'video'
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.communityImpact = (0, pg_core_1.pgTable)("community_impact", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    fromDate: (0, pg_core_1.date)("from_date").notNull(), // Start date for article availability
    untilDate: (0, pg_core_1.date)("until_date").notNull(), // End date for article availability
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.shopItems = (0, pg_core_1.pgTable)("shop_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    storeName: (0, pg_core_1.text)("store_name").notNull(),
    title: (0, pg_core_1.text)("title").notNull(), // e.g., "20% off at Danielle Faye"
    description: (0, pg_core_1.text)("description").notNull(),
    couponCode: (0, pg_core_1.text)("coupon_code"),
    backgroundImageUrl: (0, pg_core_1.text)("background_image_url").notNull(),
    externalUrl: (0, pg_core_1.text)("external_url"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
exports.tehillimNames = (0, pg_core_1.pgTable)("tehillim_names", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    hebrewName: (0, pg_core_1.text)("hebrew_name").notNull(),
    reason: (0, pg_core_1.text)("reason").notNull(),
    reasonEnglish: (0, pg_core_1.text)("reason_english"),
    dateAdded: (0, pg_core_1.timestamp)("date_added").defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // 18 days from dateAdded
    userId: (0, pg_core_1.integer)("user_id"), // Future: link to user accounts
});
exports.tehillimProgress = (0, pg_core_1.pgTable)("tehillim_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    currentPerek: (0, pg_core_1.integer)("current_perek").default(1),
    currentNameId: (0, pg_core_1.integer)("current_name_id"),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
    userId: (0, pg_core_1.integer)("user_id"), // Future: link to user accounts
});
// Global progress table - single row for all users
exports.globalTehillimProgress = (0, pg_core_1.pgTable)("global_tehillim_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    currentPerek: (0, pg_core_1.integer)("current_perek").default(1).notNull(),
    currentNameId: (0, pg_core_1.integer)("current_name_id"), // Reference to assigned name for current perek
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
    completedBy: (0, pg_core_1.text)("completed_by"), // Track who completed it
});
exports.perakimTexts = (0, pg_core_1.pgTable)("perakim_texts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    perekNumber: (0, pg_core_1.integer)("perek_number").notNull().unique(),
    hebrewText: (0, pg_core_1.text)("hebrew_text"),
    englishTranslation: (0, pg_core_1.text)("english_translation"),
    transliteration: (0, pg_core_1.text)("transliteration"),
});
exports.minchaPrayers = (0, pg_core_1.pgTable)("mincha_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    prayerType: (0, pg_core_1.text)("prayer_type").notNull(), // e.g., "main_prayer", "ashrei", "shemoneh_esrei"
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
    englishTranslation: (0, pg_core_1.text)("english_translation").notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
});
exports.maarivPrayers = (0, pg_core_1.pgTable)("maariv_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    prayerType: (0, pg_core_1.text)("prayer_type").notNull(), // e.g., "main_prayer", "shema", "shemoneh_esrei", "aleinu"
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
    englishTranslation: (0, pg_core_1.text)("english_translation").notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
});
exports.morningPrayers = (0, pg_core_1.pgTable)("morning_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    prayerType: (0, pg_core_1.text)("prayer_type").notNull(), // e.g., "modeh_ani", "netilat_yadayim", "birchot_hashachar", "pesukei_dzimra"
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
    englishTranslation: (0, pg_core_1.text)("english_translation").notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
});
exports.birkatHamazonPrayers = (0, pg_core_1.pgTable)("birkat_hamazon_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    prayerType: (0, pg_core_1.text)("prayer_type").notNull(), // e.g., "main_blessing", "shir_hamaalot", "nodeh_lecha", "harachaman"
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
    englishTranslation: (0, pg_core_1.text)("english_translation").notNull(),
    orderIndex: (0, pg_core_1.integer)("order_index").default(0),
});
exports.afterBrochasPrayers = (0, pg_core_1.pgTable)("after_brochas_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    prayerName: (0, pg_core_1.text)("prayer_name").notNull(), // "Al Hamichiya" or "Birkat Hamazon"
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
    englishTranslation: (0, pg_core_1.text)("english_translation").notNull(),
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.sponsors = (0, pg_core_1.pgTable)("sponsors", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    hebrewName: (0, pg_core_1.text)("hebrew_name"),
    sponsorshipDate: (0, pg_core_1.text)("sponsorship_date").notNull(), // Store as YYYY-MM-DD string
    inHonorMemoryOf: (0, pg_core_1.text)("in_honor_memory_of"), // Single line dedication text
    message: (0, pg_core_1.text)("message"), // Short message about the person
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.nishmasText = (0, pg_core_1.pgTable)("nishmas_text", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    language: (0, pg_core_1.text)("language").notNull(), // 'hebrew' or 'english'
    fullText: (0, pg_core_1.text)("full_text").notNull(),
    source: (0, pg_core_1.text)("source").default("Nishmas.net"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.campaigns = (0, pg_core_1.pgTable)("campaigns", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    goalAmount: (0, pg_core_1.integer)("goal_amount").notNull(),
    currentAmount: (0, pg_core_1.integer)("current_amount").default(0).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.donations = (0, pg_core_1.pgTable)("donations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    stripePaymentIntentId: (0, pg_core_1.text)("stripe_payment_intent_id").unique(),
    amount: (0, pg_core_1.integer)("amount").notNull(), // Amount in cents
    donationType: (0, pg_core_1.text)("donation_type").default("General Donation").notNull(),
    sponsorName: (0, pg_core_1.text)("sponsor_name"),
    dedication: (0, pg_core_1.text)("dedication"),
    email: (0, pg_core_1.text)("email"),
    status: (0, pg_core_1.text)("status").notNull(), // 'succeeded', 'pending', 'failed'
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.inspirationalQuotes = (0, pg_core_1.pgTable)("inspirational_quotes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    text: (0, pg_core_1.text)("text").notNull(),
    source: (0, pg_core_1.text)("source").notNull(),
    date: (0, pg_core_1.date)("date").notNull(), // The date when this quote should appear
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.womensPrayers = (0, pg_core_1.pgTable)("womens_prayers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    category: (0, pg_core_1.text)("category").notNull(), // 'refuah', 'family', 'life'
    prayerName: (0, pg_core_1.text)("prayer_name").notNull(),
    hebrewText: (0, pg_core_1.text)("hebrew_text"),
    englishTranslation: (0, pg_core_1.text)("english_translation"),
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.discountPromotions = (0, pg_core_1.pgTable)("discount_promotions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.text)("title").notNull(),
    subtitle: (0, pg_core_1.text)("subtitle").notNull(),
    logoUrl: (0, pg_core_1.text)("logo_url").notNull(),
    linkUrl: (0, pg_core_1.text)("link_url").notNull(),
    targetLocation: (0, pg_core_1.text)("target_location").default("worldwide").notNull(), // 'israel', 'worldwide'
    startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Daily Torah content tables
exports.dailyHalacha = (0, pg_core_1.pgTable)("daily_halacha", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull().unique(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(), // Main halacha text content
    footnotes: (0, pg_core_1.text)("footnotes"), // Optional footnotes section
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.dailyEmuna = (0, pg_core_1.pgTable)("daily_emuna", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull().unique(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content"),
    audioUrl: (0, pg_core_1.text)("audio_url").notNull(),
    speaker: (0, pg_core_1.text)("speaker"),
    speakerWebsite: (0, pg_core_1.text)("speaker_website"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.dailyChizuk = (0, pg_core_1.pgTable)("daily_chizuk", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull().unique(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content"),
    audioUrl: (0, pg_core_1.text)("audio_url").notNull(),
    speaker: (0, pg_core_1.text)("speaker"),
    speakerWebsite: (0, pg_core_1.text)("speaker_website"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.featuredContent = (0, pg_core_1.pgTable)("featured_content", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull().unique(),
    title: (0, pg_core_1.text)("title").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    provider: (0, pg_core_1.text)("provider"),
    footnotes: (0, pg_core_1.text)("footnotes"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Pirkei Avot table for internal content management
exports.pirkeiAvot = (0, pg_core_1.pgTable)("pirkei_avot", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    chapter: (0, pg_core_1.integer)("chapter").notNull(), // Chapter number (1-6)
    perek: (0, pg_core_1.integer)("perek").notNull(), // Verse number within chapter
    content: (0, pg_core_1.text)("content").notNull(), // English content
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(), // For cycling through in order
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, function (table) { return ({
    orderIdx: (0, pg_core_1.index)("pirkei_avot_order_idx").on(table.orderIndex),
    chapterIdx: (0, pg_core_1.index)("pirkei_avot_chapter_idx").on(table.chapter),
}); });
// Pirkei Avot progression tracking
exports.pirkeiAvotProgress = (0, pg_core_1.pgTable)("pirkei_avot_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    currentOrderIndex: (0, pg_core_1.integer)("current_order_index").notNull().default(0), // Track by orderIndex for cycling
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
});
// Analytics tracking tables - Only essential completion events
exports.analyticsEvents = (0, pg_core_1.pgTable)("analytics_events", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    eventType: (0, pg_core_1.text)("event_type").notNull(), // Only: 'modal_complete', 'tehillim_complete', 'name_prayed', 'tehillim_book_complete'
    eventData: (0, pg_core_1.jsonb)("event_data"), // Additional context data
    sessionId: (0, pg_core_1.text)("session_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, function (table) { return ({
    eventTypeIdx: (0, pg_core_1.index)("analytics_events_type_idx").on(table.eventType),
    createdAtIdx: (0, pg_core_1.index)("analytics_events_created_idx").on(table.createdAt),
}); });
exports.dailyStats = (0, pg_core_1.pgTable)("daily_stats", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.date)("date").notNull().unique(),
    uniqueUsers: (0, pg_core_1.integer)("unique_users").default(0),
    pageViews: (0, pg_core_1.integer)("page_views").default(0),
    tehillimCompleted: (0, pg_core_1.integer)("tehillim_completed").default(0),
    namesProcessed: (0, pg_core_1.integer)("names_processed").default(0),
    booksCompleted: (0, pg_core_1.integer)("books_completed").default(0), // Track complete Tehillim book finishes
    totalActs: (0, pg_core_1.integer)("total_acts").default(0), // New field for total acts (Torah + Tefilla + Tzedaka)
    modalCompletions: (0, pg_core_1.jsonb)("modal_completions").default({}), // { "torah": 10, "tefilla": 20, etc }
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Insert schemas - defined after all tables
exports.insertShopItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.shopItems).omit({
    id: true,
});
exports.insertTehillimNameSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tehillimNames).omit({
    id: true,
    dateAdded: true,
    expiresAt: true,
});
exports.insertTehillimProgressSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tehillimProgress).omit({
    id: true,
    lastUpdated: true,
});
exports.insertPerekTextSchema = (0, drizzle_zod_1.createInsertSchema)(exports.perakimTexts).omit({
    id: true,
});
exports.insertGlobalTehillimProgressSchema = (0, drizzle_zod_1.createInsertSchema)(exports.globalTehillimProgress).omit({
    id: true,
    lastUpdated: true,
});
exports.insertMinchaPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.minchaPrayers).omit({
    id: true,
});
exports.insertMaarivPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.maarivPrayers).omit({
    id: true,
});
exports.insertMorningPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.morningPrayers).omit({
    id: true,
});
exports.insertBirkatHamazonPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.birkatHamazonPrayers).omit({
    id: true,
});
exports.insertAfterBrochasPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.afterBrochasPrayers).omit({
    id: true,
    createdAt: true,
});
exports.insertSponsorSchema = (0, drizzle_zod_1.createInsertSchema)(exports.sponsors).omit({
    id: true,
    createdAt: true,
});
exports.insertNishmasTextSchema = (0, drizzle_zod_1.createInsertSchema)(exports.nishmasText).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Daily Torah content schemas
exports.insertDailyHalachaSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyHalacha).omit({
    id: true,
    createdAt: true,
});
exports.insertDailyEmunaSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyEmuna).omit({
    id: true,
    createdAt: true,
}).extend({
    hebrewDate: zod_1.z.string().optional(),
});
exports.insertDailyChizukSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyChizuk).omit({
    id: true,
    createdAt: true,
}).extend({
    hebrewDate: zod_1.z.string().optional(),
});
exports.insertFeaturedContentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.featuredContent).omit({
    id: true,
    createdAt: true,
}).extend({
    hebrewDate: zod_1.z.string().optional(),
});
exports.insertPirkeiAvotSchema = (0, drizzle_zod_1.createInsertSchema)(exports.pirkeiAvot).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertPirkeiAvotProgressSchema = (0, drizzle_zod_1.createInsertSchema)(exports.pirkeiAvotProgress).omit({
    id: true,
    lastUpdated: true,
});
exports.insertAnalyticsEventSchema = (0, drizzle_zod_1.createInsertSchema)(exports.analyticsEvents).omit({
    id: true,
    createdAt: true,
});
exports.insertDailyStatsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyStats).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
// Weekly Torah content schemas
exports.insertDailyRecipeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.dailyRecipes).omit({
    id: true,
    createdAt: true,
});
exports.insertParshaVortSchema = (0, drizzle_zod_1.createInsertSchema)(exports.parshaVorts).omit({
    id: true,
    createdAt: true,
});
exports.insertTableInspirationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tableInspirations).omit({
    id: true,
    createdAt: true,
});
exports.insertCommunityImpactSchema = (0, drizzle_zod_1.createInsertSchema)(exports.communityImpact).omit({
    id: true,
    createdAt: true,
});
exports.insertCampaignSchema = (0, drizzle_zod_1.createInsertSchema)(exports.campaigns).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertInspirationalQuoteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.inspirationalQuotes).omit({
    id: true,
    createdAt: true,
});
exports.insertWomensPrayerSchema = (0, drizzle_zod_1.createInsertSchema)(exports.womensPrayers).omit({
    id: true,
    createdAt: true,
});
exports.insertDiscountPromotionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.discountPromotions).omit({
    id: true,
    createdAt: true,
});
// Tehillim table
exports.tehillim = (0, pg_core_1.pgTable)("tehillim", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    englishNumber: (0, pg_core_1.integer)("english_number").notNull(),
    hebrewNumber: (0, pg_core_1.text)("hebrew_number").notNull(),
    englishText: (0, pg_core_1.text)("english_text").notNull(),
    hebrewText: (0, pg_core_1.text)("hebrew_text").notNull(),
});
exports.insertTehillimSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tehillim);
