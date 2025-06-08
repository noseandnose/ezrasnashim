import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'halacha', 'mussar', 'chizuk', 'loshon', 'recipe', etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audio_url"),
  date: text("date").notNull(), // Hebrew date
  category: text("category"),
});

export const jewishTimes = pgTable("jewish_times", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // ISO date string
  location: text("location").notNull().default("New York, NY"),
  sunrise: text("sunrise").notNull(),
  sunset: text("sunset").notNull(),
  candleLighting: text("candle_lighting"),
  havdalah: text("havdalah"),
  hebrewDate: text("hebrew_date").notNull(),
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
  name: text("name").notNull(),
  category: text("category").notNull(), // 'judaica', 'books', 'kitchen', 'jewelry'
  description: text("description"),
  price: text("price"),
  imageUrl: text("image_url"),
  externalUrl: text("external_url"),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
});

export const insertJewishTimesSchema = createInsertSchema(jewishTimes).omit({
  id: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type JewishTimes = typeof jewishTimes.$inferSelect;
export type InsertJewishTimes = z.infer<typeof insertJewishTimesSchema>;
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
