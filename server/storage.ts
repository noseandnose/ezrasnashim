import serverAxiosClient from "./axiosClient";
import { 
  calendarEvents, shopItems, 
  tehillimNames, globalTehillimProgress, minchaPrayers, sponsors, nishmasText,
  dailyHalacha, dailyEmuna, dailyChizuk, loshonHorah,
  shabbatRecipes, parshaVorts, tableInspirations, campaigns, womensPrayers, discountPromotions, pirkeiAvotProgress,
  type CalendarEvent, type InsertCalendarEvent,
  type ShopItem, type InsertShopItem, type TehillimName, type InsertTehillimName,
  type GlobalTehillimProgress, type MinchaPrayer, type InsertMinchaPrayer,
  type Sponsor, type InsertSponsor, type NishmasText, type InsertNishmasText,
  type DailyHalacha, type InsertDailyHalacha,
  type DailyEmuna, type InsertDailyEmuna,
  type DailyChizuk, type InsertDailyChizuk,
  type LoshonHorah, type InsertLoshonHorah,
  type ShabbatRecipe, type InsertShabbatRecipe,
  type ParshaVort, type InsertParshaVort,
  type TableInspiration, type InsertTableInspiration,
  type Campaign, type InsertCampaign,
  type WomensPrayer, type InsertWomensPrayer,
  type DiscountPromotion, type InsertDiscountPromotion,
  type PirkeiAvotProgress, type InsertPirkeiAvotProgress
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, gt, lt, and } from "drizzle-orm";

export interface IStorage {
  getCalendarEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  
  getAllShopItems(): Promise<ShopItem[]>;
  getShopItemById(id: number): Promise<ShopItem | undefined>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;

  // Daily Torah content methods
  getDailyHalachaByDate(date: string): Promise<DailyHalacha | undefined>;
  createDailyHalacha(halacha: InsertDailyHalacha): Promise<DailyHalacha>;
  
  getDailyEmunaByDate(date: string): Promise<DailyEmuna | undefined>;
  createDailyEmuna(emuna: InsertDailyEmuna): Promise<DailyEmuna>;
  
  getDailyChizukByDate(date: string): Promise<DailyChizuk | undefined>;
  createDailyChizuk(chizuk: InsertDailyChizuk): Promise<DailyChizuk>;
  
  getLoshonHorahByDate(date: string): Promise<LoshonHorah | undefined>;
  createLoshonHorah(loshon: InsertLoshonHorah): Promise<LoshonHorah>;
  
  getPirkeiAvotByDate(date: string): Promise<any | undefined>;
  createPirkeiAvot(pirkeiAvot: any): Promise<any>;

  // Weekly Torah content methods
  getShabbatRecipeByWeek(week: string): Promise<ShabbatRecipe | undefined>;
  createShabbatRecipe(recipe: InsertShabbatRecipe): Promise<ShabbatRecipe>;
  
  getParshaVortByWeek(week: string): Promise<ParshaVort | undefined>;
  createParshaVort(vort: InsertParshaVort): Promise<ParshaVort>;

  // Table inspiration methods
  getTableInspirationByDate(date: string): Promise<TableInspiration | undefined>;
  createTableInspiration(inspiration: InsertTableInspiration): Promise<TableInspiration>;

  // Tehillim methods
  getActiveNames(): Promise<TehillimName[]>;
  createTehillimName(name: InsertTehillimName): Promise<TehillimName>;
  cleanupExpiredNames(): Promise<void>;
  getGlobalTehillimProgress(): Promise<GlobalTehillimProgress>;
  updateGlobalTehillimProgress(currentPerek: number, language: string, completedBy?: string): Promise<GlobalTehillimProgress>;
  getRandomNameForPerek(): Promise<TehillimName | undefined>;
  getSefariaTehillim(perek: number, language: string): Promise<{text: string; perek: number; language: string}>;

  // Mincha methods
  getMinchaPrayers(): Promise<MinchaPrayer[]>;
  createMinchaPrayer(prayer: InsertMinchaPrayer): Promise<MinchaPrayer>;

  // Sponsor methods
  getSponsorByContentTypeAndDate(contentType: string, date: string): Promise<Sponsor | undefined>;
  getDailySponsor(date: string): Promise<Sponsor | undefined>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  getActiveSponsors(): Promise<Sponsor[]>;

  // Nishmas text methods
  getNishmasTextByLanguage(language: string): Promise<NishmasText | undefined>;
  createNishmasText(text: InsertNishmasText): Promise<NishmasText>;
  updateNishmasText(language: string, text: Partial<InsertNishmasText>): Promise<NishmasText>;

  // Campaign methods
  getActiveCampaign(): Promise<Campaign | undefined>;
  getAllCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignProgress(id: number, amount: number): Promise<Campaign>;

  // Pirkei Avot progression methods
  getPirkeiAvotProgress(): Promise<PirkeiAvotProgress>;
  updatePirkeiAvotProgress(chapter: number, verse: number): Promise<PirkeiAvotProgress>;
  getNextPirkeiAvotReference(): Promise<{chapter: number, verse: number}>;

  // Women's prayer methods
  getWomensPrayersByCategory(category: string): Promise<WomensPrayer[]>;
  getWomensPrayerById(id: number): Promise<WomensPrayer | undefined>;
  createWomensPrayer(prayer: InsertWomensPrayer): Promise<WomensPrayer>;

  // Discount promotion methods
  getActiveDiscountPromotion(): Promise<DiscountPromotion | undefined>;
  createDiscountPromotion(promotion: InsertDiscountPromotion): Promise<DiscountPromotion>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Skip initialization for better performance
  }

  private async initializeDefaults() {
    // Skip initialization to improve startup performance
    return;
  }

  private initializeData() {
    this.initializeDefaults().catch(console.error);
  }



  // Calendar Events methods
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  // Shop Items methods
  async getAllShopItems(): Promise<ShopItem[]> {
    return await db.select().from(shopItems).where(eq(shopItems.isActive, true));
  }

  async getShopItemById(id: number): Promise<ShopItem | undefined> {
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, id));
    return item || undefined;
  }

  async createShopItem(insertItem: InsertShopItem): Promise<ShopItem> {
    const [item] = await db.insert(shopItems).values(insertItem).returning();
    return item;
  }

  // Tehillim methods
  async getActiveNames(): Promise<TehillimName[]> {
    await this.cleanupExpiredNames();
    const now = new Date();
    return await db.select().from(tehillimNames).where(gt(tehillimNames.expiresAt, now));
  }

  async createTehillimName(insertName: InsertTehillimName): Promise<TehillimName> {
    const [name] = await db.insert(tehillimNames).values({
      ...insertName,
      dateAdded: new Date(),
      expiresAt: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
      userId: null
    }).returning();
    return name;
  }

  async cleanupExpiredNames(): Promise<void> {
    const now = new Date();
    await db.delete(tehillimNames).where(lt(tehillimNames.expiresAt, now));
  }

  async getGlobalTehillimProgress(): Promise<GlobalTehillimProgress> {
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    if (!progress) {
      const [newProgress] = await db.insert(globalTehillimProgress).values({
        currentPerek: 1,

        completedBy: null
      }).returning();
      return newProgress;
    }
    return progress;
  }

  async updateGlobalTehillimProgress(currentPerek: number, language: string, completedBy?: string): Promise<GlobalTehillimProgress> {
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    if (progress) {
      // Calculate next perek (1-150, cycling)
      const nextPerek = currentPerek >= 150 ? 1 : currentPerek + 1;
      
      const [updated] = await db.update(globalTehillimProgress)
        .set({
          currentPerek: nextPerek,

          lastUpdated: new Date(),
          completedBy: completedBy || null
        })
        .where(eq(globalTehillimProgress.id, progress.id))
        .returning();
      return updated;
    }
    return this.getGlobalTehillimProgress();
  }

  async getRandomNameForPerek(): Promise<TehillimName | undefined> {
    await this.cleanupExpiredNames();
    const activeNames = await this.getActiveNames();
    if (activeNames.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * activeNames.length);
    return activeNames[randomIndex];
  }

  async getSefariaPirkeiAvot(chapter: number): Promise<{text: string; chapter: number; source: string}> {
    // Get current progress from database
    const progress = await this.getPirkeiAvotProgress();
    const selectedRef = `${progress.currentChapter}.${progress.currentVerse}`;

    try {
      // Fetch the entire chapter first
      const chapterUrl = `https://www.sefaria.org/api/texts/Pirkei_Avot.${progress.currentChapter}`;
      const response = await serverAxiosClient.get(chapterUrl);
      const data = response.data;
      
      let text = '';
      let actualSourceRef = selectedRef;
      
      // Handle the response based on its structure
      if (data.text && Array.isArray(data.text)) {
        // Get the specific verse from the array (verse numbers are 1-indexed, arrays are 0-indexed)
        const verseIndex = progress.currentVerse - 1;
        text = data.text[verseIndex] || data.text[0] || '';
      } else if (typeof data.text === 'string') {
        text = data.text;
      }
      
      if (!text) {
        throw new Error('No text content found in API response');
      }
      
      // Clean up any HTML formatting first
      let cleanText = text
        .replace(/<[^>]*>/gi, '')  // Remove HTML tags
        .replace(/&[a-zA-Z]+;/gi, '')  // Remove HTML entities
        .replace(/&thinsp;/g, ' ')  // Remove thin spaces
        .replace(/&nbsp;/g, ' ')    // Remove non-breaking spaces
        .trim();
      
      // Use the actual reference from database
      actualSourceRef = selectedRef;
      
      const actualChapter = parseInt(actualSourceRef.split('.')[0]);
      
      return {
        text: cleanText,
        chapter: actualChapter,
        source: actualSourceRef
      };
    } catch (error) {
      console.error('Error fetching from Sefaria API:', error);
      
      // Return fallback with the correct reference format
      return {
        text: `Pirkei Avot ${selectedRef} - Unable to load from Sefaria API. Please try again later.`,
        chapter: parseInt(selectedRef.split('.')[0]),
        source: selectedRef
      };
    }
  }

  async getSefariaTehillim(perek: number, language: string): Promise<{text: string; perek: number; language: string}> {
    try {
      // Use the correct Sefaria API endpoint
      const url = `https://www.sefaria.org/api/texts/Psalms.${perek}`;
      const response = await serverAxiosClient.get(url);
      const data = response.data;
      
      // Extract text based on language preference
      let text = '';
      if (language === 'hebrew' && data.he) {
        if (Array.isArray(data.he)) {
          text = data.he.join('\n');
        } else if (typeof data.he === 'string') {
          text = data.he;
        }
      } else if (language === 'english' && data.text) {
        if (Array.isArray(data.text)) {
          text = data.text.join('\n');
        } else if (typeof data.text === 'string') {
          text = data.text;
        }
      }
      
      // Fallback to English if Hebrew not available or empty
      if (!text && data.text) {
        if (Array.isArray(data.text)) {
          text = data.text.join('\n');
        } else if (typeof data.text === 'string') {
          text = data.text;
        }
      }
      
      if (!text) {
        throw new Error('No text content found in API response');
      }
      
      // Clean up HTML formatting and Hebrew-specific markers from Sefaria text
      const cleanText = text
        .replace(/<br\s*\/?>/gi, '\n')  // Replace <br> tags with newlines
        .replace(/<small>(.*?)<\/small>/gi, '$1')  // Remove <small> tags but keep content
        .replace(/<sup[^>]*>.*?<\/sup>/gi, '')  // Remove footnote superscripts
        .replace(/<i[^>]*>.*?<\/i>/gi, '')  // Remove footnote italic text
        .replace(/<[^>]*>/gi, '')  // Remove any remaining HTML tags
        .replace(/&thinsp;/gi, '')  // Remove thin space HTML entities
        .replace(/&nbsp;/gi, ' ')  // Replace non-breaking spaces with regular spaces
        .replace(/&[a-zA-Z]+;/gi, '')  // Remove other HTML entities
        .replace(/\{[פס]\}/g, '')  // Remove Hebrew paragraph markers like {פ} and {ס}
        .replace(/\n\s*\n/g, '\n')  // Remove multiple consecutive newlines
        .trim();
      
      return {
        text: cleanText,
        perek,
        language
      };
    } catch (error) {
      console.error('Error fetching from Sefaria API:', error);
      // Return fallback text if API fails
      return {
        text: `Tehillim ${perek} - Unable to load from Sefaria API. Please try again later.`,
        perek,
        language
      };
    }
  }

  // Mincha methods
  async getMinchaPrayers(): Promise<MinchaPrayer[]> {
    return await db.select().from(minchaPrayers).orderBy(minchaPrayers.orderIndex);
  }

  async createMinchaPrayer(insertPrayer: InsertMinchaPrayer): Promise<MinchaPrayer> {
    const [prayer] = await db.insert(minchaPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Sponsor methods
  async getSponsorByContentTypeAndDate(contentType: string, date: string): Promise<Sponsor | undefined> {
    // Since we now have daily sponsors instead of content-specific ones, just return the daily sponsor
    return this.getDailySponsor(date);
  }

  async createSponsor(insertSponsor: InsertSponsor): Promise<Sponsor> {
    const [sponsor] = await db.insert(sponsors).values(insertSponsor).returning();
    return sponsor;
  }

  async getDailySponsor(date: string): Promise<Sponsor | undefined> {
    try {
      const [sponsor] = await db.select().from(sponsors)
        .where(and(
          eq(sponsors.sponsorshipDate, date),
          eq(sponsors.isActive, true)
        ))
        .limit(1);
      return sponsor || undefined;
    } catch (error) {
      console.error('Error fetching daily sponsor:', error);
      return undefined;
    }
  }

  async getActiveSponsors(): Promise<Sponsor[]> {
    return await db.select().from(sponsors).where(eq(sponsors.isActive, true));
  }

  // Daily Torah content methods
  async getDailyHalachaByDate(date: string): Promise<DailyHalacha | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, source, provider, speaker_website as "speakerWebsite", created_at as "createdAt" FROM daily_halacha WHERE date = $1 LIMIT 1`,
        [date]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Failed to fetch daily halacha:', error);
      return undefined;
    }
  }

  async createDailyHalacha(insertHalacha: InsertDailyHalacha): Promise<DailyHalacha> {
    const [halacha] = await db.insert(dailyHalacha).values(insertHalacha).returning();
    return halacha;
  }

  async getDailyEmunaByDate(date: string): Promise<DailyEmuna | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, author, source, audio_url as "audioUrl", duration, speaker, provider, speaker_website as "speakerWebsite", created_at as "createdAt" FROM daily_emuna WHERE date = $1 LIMIT 1`,
        [date]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Failed to fetch daily emuna:', error);
      return undefined;
    }
  }

  async createDailyEmuna(insertEmuna: InsertDailyEmuna): Promise<DailyEmuna> {
    const [emuna] = await db.insert(dailyEmuna).values(insertEmuna).returning();
    return emuna;
  }

  async getDailyChizukByDate(date: string): Promise<DailyChizuk | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, audio_url as "audioUrl", duration, speaker, provider, speaker_website as "speakerWebsite", created_at as "createdAt" FROM daily_chizuk WHERE date = $1 LIMIT 1`,
        [date]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Failed to fetch daily chizuk:', error);
      return undefined;
    }
  }

  async createDailyChizuk(insertChizuk: InsertDailyChizuk): Promise<DailyChizuk> {
    const [chizuk] = await db.insert(dailyChizuk).values(insertChizuk).returning();
    return chizuk;
  }

  async getLoshonHorahByDate(date: string): Promise<LoshonHorah | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, halachic_source as "halachicSource", practical_tip as "practicalTip", provider, speaker_website as "speakerWebsite", created_at as "createdAt" FROM loshon_horah WHERE date = $1 LIMIT 1`,
        [date]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Failed to fetch loshon horah:', error);
      return undefined;
    }
  }

  async createLoshonHorah(insertLoshon: InsertLoshonHorah): Promise<LoshonHorah> {
    const [loshon] = await db.insert(loshonHorah).values(insertLoshon).returning();
    return loshon;
  }

  async getPirkeiAvotByDate(date: string): Promise<{text: string; chapter: number; source: string} | undefined> {
    try {
      // Use the new daily cycling system from getSefariaPirkeiAvot
      return await this.getSefariaPirkeiAvot(1); // Pass any number, function calculates based on date internally
    } catch (error) {
      console.error('Error getting Pirkei Avot:', error);
      return undefined;
    }
  }

  async createPirkeiAvot(pirkeiAvot: any): Promise<any> {
    // No longer needed since we use Sefaria API, but kept for compatibility
    return pirkeiAvot;
  }

  // Weekly Torah content methods
  async getShabbatRecipeByWeek(week: string): Promise<ShabbatRecipe | undefined> {
    const [recipe] = await db.select().from(shabbatRecipes).where(eq(shabbatRecipes.week, week));
    return recipe || undefined;
  }

  async createShabbatRecipe(insertRecipe: InsertShabbatRecipe): Promise<ShabbatRecipe> {
    const [recipe] = await db.insert(shabbatRecipes).values(insertRecipe).returning();
    return recipe;
  }

  async getParshaVortByWeek(week: string): Promise<ParshaVort | undefined> {
    const [vort] = await db.select().from(parshaVorts).where(eq(parshaVorts.week, week));
    return vort || undefined;
  }

  async createParshaVort(insertVort: InsertParshaVort): Promise<ParshaVort> {
    const [vort] = await db.insert(parshaVorts).values(insertVort).returning();
    return vort;
  }

  async getNishmasTextByLanguage(language: string): Promise<NishmasText | undefined> {
    const [text] = await db.select().from(nishmasText).where(eq(nishmasText.language, language));
    return text || undefined;
  }

  async createNishmasText(insertText: InsertNishmasText): Promise<NishmasText> {
    const [text] = await db.insert(nishmasText).values(insertText).returning();
    return text;
  }

  async updateNishmasText(language: string, updatedText: Partial<InsertNishmasText>): Promise<NishmasText> {
    const [text] = await db
      .update(nishmasText)
      .set({ ...updatedText, updatedAt: new Date() })
      .where(eq(nishmasText.language, language))
      .returning();
    return text;
  }

  // Campaign methods
  async getActiveCampaign(): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.isActive, true))
      .limit(1);
    return campaign || undefined;
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaignProgress(id: number, amount: number): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ 
        currentAmount: amount,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async getPirkeiAvotProgress(): Promise<PirkeiAvotProgress> {
    let [progress] = await db.select().from(pirkeiAvotProgress).limit(1);
    
    if (!progress) {
      // Initialize with 1:1 if no progress exists
      [progress] = await db
        .insert(pirkeiAvotProgress)
        .values({ currentChapter: 1, currentVerse: 1 })
        .returning();
    }
    
    return progress;
  }

  async updatePirkeiAvotProgress(chapter: number, verse: number): Promise<PirkeiAvotProgress> {
    const progress = await this.getPirkeiAvotProgress();
    
    const [updated] = await db
      .update(pirkeiAvotProgress)
      .set({ 
        currentChapter: chapter, 
        currentVerse: verse,
        lastUpdated: new Date()
      })
      .where(eq(pirkeiAvotProgress.id, progress.id))
      .returning();
    
    return updated;
  }

  async getNextPirkeiAvotReference(): Promise<{chapter: number, verse: number}> {
    const progress = await this.getPirkeiAvotProgress();
    
    // Define the structure of Pirkei Avot chapters with correct verse counts
    const chapterStructure = [
      { chapter: 1, maxVerse: 18 },
      { chapter: 2, maxVerse: 21 },  
      { chapter: 3, maxVerse: 18 },
      { chapter: 4, maxVerse: 22 },
      { chapter: 5, maxVerse: 23 },
      { chapter: 6, maxVerse: 11 }
    ];
    
    let { currentChapter, currentVerse } = progress;
    const currentChapterData = chapterStructure.find(c => c.chapter === currentChapter);
    
    if (!currentChapterData) {
      // Reset to beginning if invalid chapter
      currentChapter = 1;
      currentVerse = 1;
    } else if (currentVerse >= currentChapterData.maxVerse) {
      // Move to next chapter
      const nextChapterIndex = chapterStructure.findIndex(c => c.chapter === currentChapter) + 1;
      if (nextChapterIndex >= chapterStructure.length) {
        // Cycle back to beginning
        currentChapter = 1;
        currentVerse = 1;
      } else {
        currentChapter = chapterStructure[nextChapterIndex].chapter;
        currentVerse = 1;
      }
    } else {
      // Move to next verse in same chapter
      currentVerse += 1;
    }
    
    // Update the progress in database
    await this.updatePirkeiAvotProgress(currentChapter, currentVerse);
    
    return { chapter: currentChapter, verse: currentVerse };
  }

  async getWomensPrayersByCategory(category: string): Promise<WomensPrayer[]> {
    return await db
      .select()
      .from(womensPrayers)
      .where(eq(womensPrayers.category, category))
      .orderBy(womensPrayers.prayerName);
  }

  async getWomensPrayerById(id: number): Promise<WomensPrayer | undefined> {
    const [prayer] = await db
      .select()
      .from(womensPrayers)
      .where(eq(womensPrayers.id, id))
      .limit(1);
    return prayer;
  }

  async createWomensPrayer(insertPrayer: InsertWomensPrayer): Promise<WomensPrayer> {
    const [prayer] = await db
      .insert(womensPrayers)
      .values(insertPrayer)
      .returning();
    return prayer;
  }

  async getActiveDiscountPromotion(userLocation?: string): Promise<DiscountPromotion | undefined> {
    try {
      // Determine target location based on user's coordinates
      let targetLocation = "worldwide";
      if (userLocation === "israel") {
        targetLocation = "israel";
      }
      
      // Use raw SQL to get the correct mapping
      const result = await db.execute(`
        SELECT 
          id, title, subtitle, 
          logo_url, link_url, 
          start_date, end_date, 
          is_active, target_location, 
          created_at
        FROM discount_promotions 
        WHERE is_active = true 
          AND start_date <= NOW() 
          AND end_date >= NOW()
          AND target_location = '${targetLocation}'
        LIMIT 1
      `);
      
      let promotion = result.rows && result.rows.length > 0 ? result.rows[0] : null;
      
      // If no location-specific promotion found, fall back to worldwide
      if (!promotion && targetLocation === "israel") {
        const fallbackResult = await db.execute(`
          SELECT 
            id, title, subtitle, 
            logo_url, link_url, 
            start_date, end_date, 
            is_active, target_location, 
            created_at
          FROM discount_promotions 
          WHERE is_active = true 
            AND start_date <= NOW() 
            AND end_date >= NOW()
            AND target_location = 'worldwide'
          LIMIT 1
        `);
        
        promotion = fallbackResult.rows && fallbackResult.rows.length > 0 ? fallbackResult.rows[0] : null;
      }
      
      // Transform to match expected interface
      if (promotion) {
        return {
          id: promotion.id,
          title: promotion.title,
          subtitle: promotion.subtitle,
          logoUrl: promotion.logo_url,
          linkUrl: promotion.link_url,
          startDate: promotion.start_date,
          endDate: promotion.end_date,
          isActive: promotion.is_active,
          createdAt: promotion.created_at
        } as any;
      }
      
      return undefined;
    } catch (error) {
      console.error('Database error in getActiveDiscountPromotion:', error);
      return undefined;
    }
  }

  async createDiscountPromotion(insertPromotion: InsertDiscountPromotion): Promise<DiscountPromotion> {
    const [promotion] = await db
      .insert(discountPromotions)
      .values(insertPromotion)
      .returning();
    return promotion;
  }

  async getTableInspirationByDate(date: string): Promise<TableInspiration | undefined> {
    const [inspiration] = await db
      .select()
      .from(tableInspirations)
      .where(eq(tableInspirations.date, date))
      .limit(1);
    return inspiration;
  }

  async createTableInspiration(insertInspiration: InsertTableInspiration): Promise<TableInspiration> {
    const [inspiration] = await db
      .insert(tableInspirations)
      .values(insertInspiration)
      .returning();
    return inspiration;
  }
}

export const storage = new DatabaseStorage();