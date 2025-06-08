import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
