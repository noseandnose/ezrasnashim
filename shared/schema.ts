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
  totalTime: text("total_time"),
  prepTime: text("prep_time"), // Legacy - kept for backward compatibility
  cookTime: text("cook_time"), // Legacy - kept for backward compatibility
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  imageUrl: text("image_url"),
  tags: text("tags"), // JSON array: kosher, pareve, dairy, meat
  thankYouMessage: text("thank_you_message"), // Dynamic thank you message with support for clickable links
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("daily_recipes_date_idx").on(table.date),
}));

export const parshaVorts = pgTable("parsha_vorts", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Week start date
  untilDate: date("until_date").notNull(), // Week end date
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"), // Optional: audio content URL
  videoUrl: text("video_url"), // Optional: video content URL
  imageUrl: text("image_url"), // Optional: image URL (e.g., source sheet)
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  thankYouMessage: text("thank_you_message"), // Dynamic thank you message with support for clickable links
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("parsha_vorts_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const torahClasses = pgTable("torah_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"), // Subtitle for the bar display
  content: text("content"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"), // Graphic for the bar
  speaker: text("speaker").notNull(), // Required for library grouping
  speakerWebsite: text("speaker_website"),
  thankYouMessage: text("thank_you_message"),
  attributionLogoUrl: text("attribution_logo_url"),
  attributionAboutText: text("attribution_about_text"),
  displayOrder: integer("display_order"), // Custom order per speaker (null = alphabetical)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  speakerIdx: index("torah_classes_speaker_idx").on(table.speaker),
}));

export const lifeClasses = pgTable("life_classes", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Start date for display
  untilDate: date("until_date").notNull(), // End date for display
  title: text("title").notNull(),
  subtitle: text("subtitle"), // Subtitle for the bar display
  content: text("content"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"), // Graphic for the bar
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  thankYouMessage: text("thank_you_message"),
  attributionLogoUrl: text("attribution_logo_url"),
  attributionAboutText: text("attribution_about_text"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("life_classes_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const gemsOfGratitude = pgTable("gems_of_gratitude", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Start date for display
  untilDate: date("until_date").notNull(), // End date for display
  title: text("title").notNull(),
  subtitle: text("subtitle"), // Subtitle for the bar display
  content: text("content"), // Main content/inspiring thought
  imageUrl: text("image_url"), // Optional image
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  websiteUrl: text("website_url"), // Website URL for "Visit Website" button
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("gems_of_gratitude_date_range_idx").on(table.fromDate, table.untilDate),
}));

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
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("table_inspirations_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const marriageInsights = pgTable("marriage_insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sectionNumber: integer("section_number").notNull(),
  content: text("content").notNull(),
  date: date("date").notNull(),
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("idx_marriage_insights_date").on(table.date),
}));




export const communityImpact = pgTable("community_impact", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(), // Start date for article availability
  untilDate: date("until_date").notNull(), // End date for article availability
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"), // Optional: video content URL
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("community_impact_date_range_idx").on(table.fromDate, table.untilDate),
}));

// Push notification tables
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // Auth keys for encryption
  auth: text("auth").notNull(),
  sessionId: text("session_id"), // Track which session subscribed
  subscribed: boolean("subscribed").default(true),
  lastValidatedAt: timestamp("last_validated_at"), // Last successful validation
  validationFailures: integer("validation_failures").default(0), // Consecutive failures
  lastErrorCode: integer("last_error_code"), // Last error code for debugging
  lastErrorMessage: text("last_error_message"), // Last error message
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

// Global progress table - single row for all users
export const globalTehillimProgress = pgTable("global_tehillim_progress", {
  id: serial("id").primaryKey(),
  currentPerek: integer("current_perek").default(1).notNull(),
  currentNameId: integer("current_name_id"), // Reference to assigned name for current perek
  lastUpdated: timestamp("last_updated").defaultNow(),
  completedBy: text("completed_by"), // Track who completed it
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

export const brochas = pgTable("brochas", {
  id: serial("id").primaryKey(),
  title: text("Title").notNull(),
  hebrewText: text("Hebrew Text"),
  englishText: text("English Text"),
  description: text("description"),
  specialOccasions: boolean("special_occasions").default(false),
  orderIndex: integer("order_index").default(0),
}, (table) => ({
  specialOccasionsIdx: index("brochas_special_occasions_idx").on(table.specialOccasions),
}));

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"), // Donor email for receipts and prize contact
  hebrewName: text("hebrew_name"),
  sponsorshipDate: text("sponsorship_date").notNull(), // Store as YYYY-MM-DD string
  inHonorMemoryOf: text("in_honor_memory_of"), // Single line dedication text
  message: text("message"), // Short message about the person
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("sponsors_date_idx").on(table.sponsorshipDate),
}));

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
}, (table) => ({
  createdAtIdx: index("donations_created_at_idx").on(table.createdAt),
}));

export const womensPrayers = pgTable("womens_prayers", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'refuah', 'family', 'life'
  prayerName: text("prayer_name").notNull(),
  hebrewText: text("hebrew_text"),
  englishTranslation: text("english_translation"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("womens_prayers_category_idx").on(table.category),
}));

export const meditations = pgTable("meditations", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // Main category name
  subtitle: text("subtitle").notNull(), // Category subtitle
  name: text("name").notNull(), // Meditation title
  link: text("link").notNull(), // Streaming URL
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountPromotions = pgTable("discount_promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  logoUrl: text("logo_url").notNull(),
  linkUrl: text("link_url").notNull(),
  targetLocation: text("target_location").default("worldwide").notNull(), // 'israel', 'worldwide'
  type: text("type").default("deal").notNull(), // 'deal' or 'resource'
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
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("daily_halacha_date_idx").on(table.date),
}));

export const dailyEmuna = pgTable("daily_emuna", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // unique constraint creates implicit index
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChizuk = pgTable("daily_chizuk", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // unique constraint creates implicit index
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  attributionLabel: text("attribution_label"), // Short label for collapsed attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
});

export const featuredContent = pgTable("featured_content", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(),
  untilDate: date("until_date").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"), // Optional: audio content URL
  videoUrl: text("video_url"), // Optional: video content URL
  imageUrl: text("image_url"), // Optional: image content URL
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  footnotes: text("footnotes"),
  thankYouMessage: text("thank_you_message"), // Thank you message for attribution
  attributionLogoUrl: text("attribution_logo_url"), // Logo image for attribution section
  attributionAboutText: text("attribution_about_text"), // About text for attribution section
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("featured_content_date_range_idx").on(table.fromDate, table.untilDate),
}));

// Today's Special / Community Challenge - fullscreen content with community counter
export const todaysSpecial = pgTable("todays_special", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(),
  untilDate: date("until_date").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  contentEnglish: text("content_english"),
  contentHebrew: text("content_hebrew"),
  linkTitle: text("link_title"),
  url: text("url"),
  // Community Challenge fields
  challengeType: text("challenge_type"), // e.g., 'tehillim', 'nishmas', 'halacha', 'custom' - determines what content to render
  challengeContentId: integer("challenge_content_id"), // e.g., psalm number for tehillim, or reference ID for other content
  targetCount: integer("target_count"), // e.g., 100 for "Say Tehillim 100 times together"
  currentCount: integer("current_count").default(0), // Tracks community completions
  pillarType: text("pillar_type"), // 'torah' or 'tefilla' - for mitzvah tracking
  modalName: text("modal_name"), // e.g., 'tehillim', 'nishmas', 'halacha' - for usage tracking
  challengeMessage: text("challenge_message"), // Optional message to display between progress and content
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("todays_special_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const insertTodaysSpecialSchema = createInsertSchema(todaysSpecial).omit({ id: true, createdAt: true });
export type InsertTodaysSpecial = z.infer<typeof insertTodaysSpecialSchema>;
export type TodaysSpecial = typeof todaysSpecial.$inferSelect;

// Gift of Chatzos - day-of-week based content for life page
export const giftOfChatzos = pgTable("gift_of_chatzos", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  contentEnglish: text("content_english"),
  contentHebrew: text("content_hebrew"),
  linkTitle: text("link_title"),
  url: text("url"),
  thankYouMessage: text("thank_you_message"), // Appears under content, linked to URL
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dayOfWeekIdx: index("gift_of_chatzos_day_of_week_idx").on(table.dayOfWeek),
}));

export const insertGiftOfChatzosSchema = createInsertSchema(giftOfChatzos).omit({ id: true, createdAt: true });
export type InsertGiftOfChatzos = z.infer<typeof insertGiftOfChatzosSchema>;
export type GiftOfChatzos = typeof giftOfChatzos.$inferSelect;

// Torah Challenge - date-specific content for Torah page with completion tracking
export const torahChallenges = pgTable("torah_challenges", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // Specific date for this challenge
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  contentEnglish: text("content_english"),
  contentHebrew: text("content_hebrew"),
  linkTitle: text("link_title"),
  url: text("url"),
  thankYouMessage: text("thank_you_message"),
  attributionLogoUrl: text("attribution_logo_url"),
  attributionAboutText: text("attribution_about_text"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("torah_challenges_date_idx").on(table.date),
}));

export const insertTorahChallengeSchema = createInsertSchema(torahChallenges).omit({ id: true, createdAt: true });
export type InsertTorahChallenge = z.infer<typeof insertTorahChallengeSchema>;
export type TorahChallenge = typeof torahChallenges.$inferSelect;

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
  idempotencyKey: text("idempotency_key"), // For offline sync deduplication
  analyticsDate: text("analytics_date"), // Client-provided date (YYYY-MM-DD) for accurate timezone-aware aggregation
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  eventTypeIdx: index("analytics_events_type_idx").on(table.eventType),
  createdAtIdx: index("analytics_events_created_idx").on(table.createdAt),
  idempotencyKeyIdx: index("analytics_events_idempotency_idx").on(table.idempotencyKey),
  analyticsDateIdx: index("analytics_events_date_idx").on(table.analyticsDate),
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
  meditationsCompleted: integer("meditations_completed").default(0), // Track meditation completions
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

// Shmiras Halashon - CCHF content for Torah page
export const shmirasHalashon = pgTable("shmiras_halashon", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(),
  untilDate: date("until_date").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  footnotes: text("footnotes"),
  thankYouMessage: text("thank_you_message"),
  attributionLogoUrl: text("attribution_logo_url"),
  attributionAboutText: text("attribution_about_text"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("shmiras_halashon_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const insertShmirasHalashonSchema = createInsertSchema(shmirasHalashon).omit({
  id: true,
  createdAt: true,
}).extend({
  hebrewDate: z.string().optional(),
});

// Shalom - CCHF content for Torah page
export const shalomContent = pgTable("shalom_content", {
  id: serial("id").primaryKey(),
  fromDate: date("from_date").notNull(),
  untilDate: date("until_date").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  speaker: text("speaker"),
  speakerWebsite: text("speaker_website"),
  footnotes: text("footnotes"),
  thankYouMessage: text("thank_you_message"),
  attributionLogoUrl: text("attribution_logo_url"),
  attributionAboutText: text("attribution_about_text"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateRangeIdx: index("shalom_content_date_range_idx").on(table.fromDate, table.untilDate),
}));

export const insertShalomContentSchema = createInsertSchema(shalomContent).omit({
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
export type Brocha = typeof brochas.$inferSelect;
export type InsertBrocha = z.infer<typeof insertBrochasSchema>;

// Weekly Torah content schemas
export const insertDailyRecipeSchema = createInsertSchema(dailyRecipes).omit({
  id: true,
  createdAt: true,
});

// Base schema without refinement - used for partial updates
export const baseParshaVortSchema = createInsertSchema(parshaVorts).omit({
  id: true,
  createdAt: true,
});

// Insert schema - allows text-only, audio-only, video-only, or any combination
export const insertParshaVortSchema = baseParshaVortSchema;

export const insertTorahClassSchema = createInsertSchema(torahClasses).omit({
  id: true,
  createdAt: true,
});

export const insertLifeClassSchema = createInsertSchema(lifeClasses).omit({
  id: true,
  createdAt: true,
});

export const insertGemsOfGratitudeSchema = createInsertSchema(gemsOfGratitude).omit({
  id: true,
  createdAt: true,
});

export const insertMarriageInsightSchema = createInsertSchema(marriageInsights).omit({
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

export const insertWomensPrayerSchema = createInsertSchema(womensPrayers).omit({
  id: true,
  createdAt: true,
});

export const insertMeditationSchema = createInsertSchema(meditations).omit({
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
export type GlobalTehillimProgress = typeof globalTehillimProgress.$inferSelect;
export type InsertGlobalTehillimProgress = z.infer<typeof insertGlobalTehillimProgressSchema>;
export type MinchaPrayer = typeof minchaPrayers.$inferSelect;
export type InsertMinchaPrayer = z.infer<typeof insertMinchaPrayerSchema>;
export type MaarivPrayer = typeof maarivPrayers.$inferSelect;
export type InsertMaarivPrayer = z.infer<typeof insertMaarivPrayerSchema>;
export type MorningPrayer = typeof morningPrayers.$inferSelect;
export type InsertMorningPrayer = z.infer<typeof insertMorningPrayerSchema>;
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

export type ShmirasHalashon = typeof shmirasHalashon.$inferSelect;
export type InsertShmirasHalashon = z.infer<typeof insertShmirasHalashonSchema>;

export type ShalomContent = typeof shalomContent.$inferSelect;
export type InsertShalomContent = z.infer<typeof insertShalomContentSchema>;

// Weekly Torah content types
export type DailyRecipe = typeof dailyRecipes.$inferSelect;
export type InsertDailyRecipe = z.infer<typeof insertDailyRecipeSchema>;
export type ParshaVort = typeof parshaVorts.$inferSelect;
export type InsertParshaVort = z.infer<typeof insertParshaVortSchema>;
export type TorahClass = typeof torahClasses.$inferSelect;
export type InsertTorahClass = z.infer<typeof insertTorahClassSchema>;
export type LifeClass = typeof lifeClasses.$inferSelect;
export type InsertLifeClass = z.infer<typeof insertLifeClassSchema>;
export type GemsOfGratitude = typeof gemsOfGratitude.$inferSelect;
export type InsertGemsOfGratitude = z.infer<typeof insertGemsOfGratitudeSchema>;
export type TableInspiration = typeof tableInspirations.$inferSelect;
export type InsertTableInspiration = z.infer<typeof insertTableInspirationSchema>;

export type MarriageInsight = typeof marriageInsights.$inferSelect;
export type InsertMarriageInsight = z.infer<typeof insertMarriageInsightSchema>;

export type CommunityImpact = typeof communityImpact.$inferSelect;
export type InsertCommunityImpact = z.infer<typeof insertCommunityImpactSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type WomensPrayer = typeof womensPrayers.$inferSelect;
export type InsertWomensPrayer = z.infer<typeof insertWomensPrayerSchema>;

export type Meditation = typeof meditations.$inferSelect;
export type InsertMeditation = z.infer<typeof insertMeditationSchema>;

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

// Personal Tehillim Chains - users can create chains for specific people
export const tehillimChains = pgTable("tehillim_chains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Person's name (Hebrew or English)
  reason: text("reason").notNull(), // Reason for the chain (refuah, shidduch, etc.)
  description: text("description"), // Optional description for the chain
  slug: text("slug").notNull().unique(), // URL-friendly identifier (auto-generated)
  createdAt: timestamp("created_at").defaultNow(),
  creatorDeviceId: text("creator_device_id"), // Track who created it
  isActive: boolean("is_active").default(true),
}, (table) => ({
  slugIdx: index("idx_tehillim_chains_slug").on(table.slug),
  nameIdx: index("idx_tehillim_chains_name").on(table.name),
}));

// Tehillim Chain Readings - tracks which psalms are being read/completed on each chain
export const tehillimChainReadings = pgTable("tehillim_chain_readings", {
  id: serial("id").primaryKey(),
  chainId: integer("chain_id").notNull().references(() => tehillimChains.id),
  psalmNumber: integer("psalm_number").notNull(), // 1-150
  deviceId: text("device_id").notNull(), // Track which device is reading
  status: text("status").notNull().default("reading"), // 'reading' or 'completed'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  chainIdIdx: index("idx_chain_readings_chain_id").on(table.chainId),
  statusIdx: index("idx_chain_readings_status").on(table.status),
}));

export const insertTehillimChainSchema = createInsertSchema(tehillimChains).omit({
  id: true,
  createdAt: true,
});
export type TehillimChain = typeof tehillimChains.$inferSelect;
export type InsertTehillimChain = z.infer<typeof insertTehillimChainSchema>;

export const insertTehillimChainReadingSchema = createInsertSchema(tehillimChainReadings).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});
export type TehillimChainReading = typeof tehillimChainReadings.$inferSelect;
export type InsertTehillimChainReading = z.infer<typeof insertTehillimChainReadingSchema>;

// Messages table for daily messages to users (Feed)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // unique constraint creates implicit index
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 20 }).notNull().default("message"), // 'message', 'feature', 'bugfix', 'poll'
  likes: integer("likes").notNull().default(0),
  dislikes: integer("dislikes").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMessagesSchema = createInsertSchema(messages).omit({ id: true, likes: true, dislikes: true, isPinned: true, createdAt: true, updatedAt: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessagesSchema>;
export type MessageCategory = 'message' | 'feature' | 'bugfix' | 'poll';

// Scheduled Notifications table for sending push notifications at specific times
export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  scheduledDate: date("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time", { length: 5 }).notNull(), // Format: HH:MM (24-hour)
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  scheduledDateIdx: index("scheduled_notifications_date_idx").on(table.scheduledDate),
  sentIdx: index("scheduled_notifications_sent_idx").on(table.sent),
}));

export const insertScheduledNotificationSchema = createInsertSchema(scheduledNotifications).omit({ id: true, sent: true, sentAt: true, createdAt: true, updatedAt: true });
export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = z.infer<typeof insertScheduledNotificationSchema>;

// Push notification schemas and types
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true, sentAt: true });
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;

// User Mitzvah Progress - stores completion data for authenticated users
// Syncs with localStorage format for seamless cross-device experience
export const userMitzvahProgress = pgTable("user_mitzvah_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Supabase auth user ID
  modalCompletions: jsonb("modal_completions").notNull().default('{}'), // Format: { "2025-01-01": { singles: ["mincha"], repeatables: { "tehillim-1": 2 } } }
  tzedakaCompletions: jsonb("tzedaka_completions").notNull().default('{}'), // Format: { "2025-01-01": { gave_elsewhere: 1, put_a_coin: 2 } }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(), // For optimistic concurrency control
}, (table) => ({
  userIdIdx: index("user_mitzvah_progress_user_id_idx").on(table.userId),
}));

export const insertUserMitzvahProgressSchema = createInsertSchema(userMitzvahProgress).omit({ id: true, updatedAt: true });
export type UserMitzvahProgress = typeof userMitzvahProgress.$inferSelect;
export type InsertUserMitzvahProgress = z.infer<typeof insertUserMitzvahProgressSchema>;

// Auth models (users, sessions) - required for Replit Auth
export * from "./models/auth";
