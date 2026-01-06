import { pgTable, text, serial, integer, boolean, timestamp, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core tables only - remove unused functionality

// Pirkei Avot progression tracking
export const pirkeiAvotProgress = pgTable("pirkei_avot_progress", {
  id: serial("id").primaryKey(),
  currentChapter: integer("current_chapter").notNull().default(1),
  currentVerse: integer("current_verse").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Tzedaka campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalAmount: integer("goal_amount").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("campaigns_active_idx").on(table.isActive),
}));

// Tehillim global progress
export const globalTehillimProgress = pgTable("global_tehillim_progress", {
  id: serial("id").primaryKey(),
  currentPerek: integer("current_perek").default(1).notNull(),
  currentNameId: integer("current_name_id"),
  currentLanguage: text("current_language").default('english').notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  completedBy: text("completed_by"),
});

// Tehillim names for dedications
export const tehillimNames = pgTable("tehillim_names", {
  id: serial("id").primaryKey(),
  hebrewName: text("hebrew_name").notNull(),
  reason: text("reason").notNull(),
  reasonEnglish: text("reason_english"),
  dateAdded: timestamp("date_added").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // 18 days from dateAdded
}, (table) => ({
  expiresIdx: index("tehillim_names_expires_idx").on(table.expiresAt),
  activeIdx: index("tehillim_names_active_idx").on(table.expiresAt),
}));

// Daily sponsors
export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hebrewName: text("hebrew_name"),
  sponsorshipDate: date("sponsorship_date").notNull(),
  message: text("message"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateIdx: index("sponsors_date_idx").on(table.sponsorshipDate),
  activeIdx: index("sponsors_active_idx").on(table.isActive, table.sponsorshipDate),
}));

// Discount promotions
export const discountPromotions = pgTable("discount_promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  logoUrl: text("logo_url").notNull(),
  linkUrl: text("link_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  targetLocation: text("target_location").notNull().default("worldwide"), // "israel" or "worldwide"
  type: text("type").default("deal").notNull(), // 'deal' or 'resource'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("discount_promotions_active_idx").on(table.isActive),
  locationIdx: index("discount_promotions_location_idx").on(table.targetLocation),
}));

// Zod schemas for validation
export const insertPirkeiAvotProgressSchema = createInsertSchema(pirkeiAvotProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalTehillimProgressSchema = createInsertSchema(globalTehillimProgress).omit({
  id: true,
  lastUpdated: true,
});

export const insertTehillimNameSchema = createInsertSchema(tehillimNames).omit({
  id: true,
  dateAdded: true,
  expiresAt: true,
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

export const insertDiscountPromotionSchema = createInsertSchema(discountPromotions).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type PirkeiAvotProgress = typeof pirkeiAvotProgress.$inferSelect;
export type InsertPirkeiAvotProgress = z.infer<typeof insertPirkeiAvotProgressSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type GlobalTehillimProgress = typeof globalTehillimProgress.$inferSelect;
export type InsertGlobalTehillimProgress = z.infer<typeof insertGlobalTehillimProgressSchema>;

export type TehillimName = typeof tehillimNames.$inferSelect;
export type InsertTehillimName = z.infer<typeof insertTehillimNameSchema>;

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

export type DiscountPromotion = typeof discountPromotions.$inferSelect;
export type InsertDiscountPromotion = z.infer<typeof insertDiscountPromotionSchema>;