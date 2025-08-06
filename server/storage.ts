import serverAxiosClient from "./axiosClient";
import { 
  shopItems, 
  tehillimNames, globalTehillimProgress, minchaPrayers, maarivPrayers, morningPrayers, birkatHamazonPrayers, afterBrochasPrayers, sponsors, nishmasText,
  dailyHalacha, dailyEmuna, dailyChizuk, featuredContent,
  dailyRecipes, parshaVorts, tableInspirations, communityImpact, campaigns, womensPrayers, discountPromotions, pirkeiAvotProgress,
  analyticsEvents, dailyStats,

  type ShopItem, type InsertShopItem, type TehillimName, type InsertTehillimName,
  type GlobalTehillimProgress, type MinchaPrayer, type InsertMinchaPrayer,
  type MaarivPrayer, type InsertMaarivPrayer, type MorningPrayer, type InsertMorningPrayer,
  type BirkatHamazonPrayer, type InsertBirkatHamazonPrayer,
  type AfterBrochasPrayer, type InsertAfterBrochasPrayer,
  type Sponsor, type InsertSponsor, type NishmasText, type InsertNishmasText,
  type DailyHalacha, type InsertDailyHalacha,
  type DailyEmuna, type InsertDailyEmuna,
  type DailyChizuk, type InsertDailyChizuk,
  type FeaturedContent, type InsertFeaturedContent,
  type DailyRecipe, type InsertDailyRecipe,
  type ParshaVort, type InsertParshaVort,
  type TableInspiration, type InsertTableInspiration,
  type CommunityImpact, type InsertCommunityImpact,
  type Campaign, type InsertCampaign,
  type WomensPrayer, type InsertWomensPrayer,
  type DiscountPromotion, type InsertDiscountPromotion,
  type PirkeiAvotProgress, type InsertPirkeiAvotProgress,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type DailyStats, type InsertDailyStats
} from "../shared/schema";
import { db, pool } from "./db";
import { eq, gt, lt, gte, lte, and } from "drizzle-orm";
import { cleanHebrewText, memoize, withRetry, formatDate } from './typeHelpers';

export interface IStorage {
  
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
  
  getFeaturedContentByDate(date: string): Promise<FeaturedContent | undefined>;
  createFeaturedContent(featured: InsertFeaturedContent): Promise<FeaturedContent>;
  
  getPirkeiAvotByDate(date: string): Promise<any | undefined>;
  createPirkeiAvot(pirkeiAvot: any): Promise<any>;

  // Daily recipe methods
  getDailyRecipeByDate(date: string): Promise<DailyRecipe | undefined>;
  createDailyRecipe(recipe: InsertDailyRecipe): Promise<DailyRecipe>;
  
  getParshaVortByWeek(week: string): Promise<ParshaVort | undefined>;
  getParshaVortByDate(date: string): Promise<ParshaVort | undefined>;
  createParshaVort(vort: InsertParshaVort): Promise<ParshaVort>;

  // Table inspiration methods
  getTableInspirationByDate(date: string): Promise<TableInspiration | undefined>;
  createTableInspiration(inspiration: InsertTableInspiration): Promise<TableInspiration>;

  // Community impact methods
  getCommunityImpactByDate(date: string): Promise<CommunityImpact | undefined>;
  createCommunityImpact(impact: InsertCommunityImpact): Promise<CommunityImpact>;

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
  
  // Morning prayer methods
  getMorningPrayers(): Promise<MorningPrayer[]>;
  createMorningPrayer(prayer: InsertMorningPrayer): Promise<MorningPrayer>;
  
  // Maariv methods
  getMaarivPrayers(): Promise<MaarivPrayer[]>;
  createMaarivPrayer(prayer: InsertMaarivPrayer): Promise<MaarivPrayer>;

  // After Brochas methods
  getAfterBrochasPrayers(): Promise<AfterBrochasPrayer[]>;
  createAfterBrochasPrayer(prayer: InsertAfterBrochasPrayer): Promise<AfterBrochasPrayer>;
  
  // Birkat Hamazon methods
  getBirkatHamazonPrayers(): Promise<BirkatHamazonPrayer[]>;
  createBirkatHamazonPrayer(prayer: InsertBirkatHamazonPrayer): Promise<BirkatHamazonPrayer>;

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

  // Analytics methods
  trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  recordActiveSession(sessionId: string): Promise<void>;
  cleanupOldAnalytics(): Promise<void>;
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  updateDailyStats(date: string, updates: Partial<DailyStats>): Promise<DailyStats>;
  getTotalStats(): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalModalCompletions: Record<string, number>;
  }>;

  // Community impact methods
  getCommunityImpact(): Promise<{
    totalDaysSponsored: number;
    totalCampaigns: number;
    totalRaised: number;
  }>;
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
      // Assign a random name for the initial perek
      const initialName = await this.getRandomNameForInitialAssignment();
      const [newProgress] = await db.insert(globalTehillimProgress).values({
        currentPerek: 1,
        currentNameId: initialName?.id || null,
        completedBy: null
      }).returning();
      return newProgress;
    }
    return progress;
  }

  async updateGlobalTehillimProgress(currentPerek: number, language: string, completedBy?: string): Promise<GlobalTehillimProgress> {
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    if (progress) {
      // Check if we're completing the entire book (perek 150)
      const isBookComplete = currentPerek === 150;
      
      // Calculate next perek (1-150, cycling)
      const nextPerek = currentPerek >= 150 ? 1 : currentPerek + 1;
      
      // Log book completion event when finishing perek 150
      if (isBookComplete) {
        await this.trackEvent({
          eventType: 'tehillim_book_complete',
          eventData: {
            completedBy: completedBy || 'Anonymous',
            language: language,
            completedAt: new Date().toISOString()
          },
          sessionId: 'system' // System-generated event
        });
      }
      
      // Assign a new random name for the next perek
      const nextName = await this.getRandomNameForInitialAssignment();
      
      const [updated] = await db.update(globalTehillimProgress)
        .set({
          currentPerek: nextPerek,
          currentNameId: nextName?.id || null,
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
    // First get the current progress to see if there's already an assigned name
    const progress = await this.getGlobalTehillimProgress();
    if (progress.currentNameId) {
      // Return the assigned name for this perek
      const [assignedName] = await db.select().from(tehillimNames).where(eq(tehillimNames.id, progress.currentNameId));
      if (assignedName) {
        return assignedName;
      }
    }
    
    // If no assigned name, assign one now
    const newName = await this.getRandomNameForInitialAssignment();
    if (newName && progress.id) {
      // Update the progress with this name
      await db.update(globalTehillimProgress)
        .set({ currentNameId: newName.id })
        .where(eq(globalTehillimProgress.id, progress.id));
      return newName;
    }
    
    return undefined;
  }

  async getRandomNameForInitialAssignment(): Promise<TehillimName | undefined> {
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
      
      // Clean up HTML formatting and Unicode artifacts with comprehensive filtering
      let cleanText = text
        .replace(/<[^>]*>/gi, '')  // Remove HTML tags
        .replace(/&[a-zA-Z0-9#]+;/gi, '')  // Remove HTML entities
        .replace(/&thinsp;/g, ' ')  // Remove thin spaces
        .replace(/&nbsp;/g, ' ')    // Remove non-breaking spaces
        .replace(/[\u200E\u200F\u202A-\u202E]/g, '')  // Remove Unicode directional marks
        .replace(/[\u2060\u00A0\u180E\u2000-\u200B\u2028\u2029\uFEFF]/g, '')  // Remove zero-width spaces
        .replace(/[\u25A0-\u25FF]/g, '')  // Remove geometric shapes (rectangles, squares)
        .replace(/[\uFFF0-\uFFFF]/g, '')  // Remove specials block characters
        .replace(/[\uE000-\uF8FF]/g, '')  // Remove private use area characters
        .replace(/[\u2400-\u243F]/g, '')  // Remove control pictures
        .replace(/[\u2500-\u257F]/g, '')  // Remove box drawing characters
        .replace(/[\uFE00-\uFE0F]/g, '')  // Remove variation selectors
        .replace(/[\u0590-\u05CF]/g, (match) => {
          // Keep valid Hebrew characters, remove problematic ones
          const codePoint = match.codePointAt(0);
          if (!codePoint) return '';
          if (codePoint >= 0x05D0 && codePoint <= 0x05EA) return match; // Hebrew letters
          if (codePoint >= 0x05B0 && codePoint <= 0x05BD) return match; // Hebrew points
          if (codePoint >= 0x05BF && codePoint <= 0x05C2) return match; // Hebrew points
          if (codePoint >= 0x05C4 && codePoint <= 0x05C5) return match; // Hebrew points
          if (codePoint === 0x05C7) return match; // Hebrew point
          return ''; // Remove other characters in Hebrew block
        })
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
        .replace(/&[a-zA-Z0-9#]+;/gi, '')  // Remove HTML entities
        .replace(/\{[פס]\}/g, '')  // Remove Hebrew paragraph markers like {פ} and {ס}
        .replace(/[\u200E\u200F\u202A-\u202E]/g, '')  // Remove Unicode directional marks
        .replace(/[\u2060\u00A0\u180E\u2000-\u200B\u2028\u2029\uFEFF]/g, '')  // Remove zero-width spaces
        .replace(/[\u25A0-\u25FF]/g, '')  // Remove geometric shapes (rectangles, squares)
        .replace(/[\uFFF0-\uFFFF]/g, '')  // Remove specials block characters
        .replace(/[\uE000-\uF8FF]/g, '')  // Remove private use area characters
        .replace(/[\u2400-\u243F]/g, '')  // Remove control pictures
        .replace(/[\u2500-\u257F]/g, '')  // Remove box drawing characters
        .replace(/[\uFE00-\uFE0F]/g, '')  // Remove variation selectors
        .replace(/[\u0590-\u05CF]/g, (match) => {
          // Keep valid Hebrew characters, remove problematic ones
          const codePoint = match.codePointAt(0);
          if (!codePoint) return '';
          if (codePoint >= 0x05D0 && codePoint <= 0x05EA) return match; // Hebrew letters
          if (codePoint >= 0x05B0 && codePoint <= 0x05BD) return match; // Hebrew points
          if (codePoint >= 0x05BF && codePoint <= 0x05C2) return match; // Hebrew points
          if (codePoint >= 0x05C4 && codePoint <= 0x05C5) return match; // Hebrew points
          if (codePoint === 0x05C7) return match; // Hebrew point
          return ''; // Remove other characters in Hebrew block
        })
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

  // Morning prayer methods
  async getMorningPrayers(): Promise<MorningPrayer[]> {
    return await db.select().from(morningPrayers).orderBy(morningPrayers.orderIndex);
  }

  async createMorningPrayer(insertPrayer: InsertMorningPrayer): Promise<MorningPrayer> {
    const [prayer] = await db.insert(morningPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Maariv methods
  async getMaarivPrayers(): Promise<MaarivPrayer[]> {
    return await db.select().from(maarivPrayers).orderBy(maarivPrayers.orderIndex);
  }

  async createMaarivPrayer(insertPrayer: InsertMaarivPrayer): Promise<MaarivPrayer> {
    const [prayer] = await db.insert(maarivPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // After Brochas methods
  async getAfterBrochasPrayers(): Promise<AfterBrochasPrayer[]> {
    return await db.select().from(afterBrochasPrayers);
  }

  async createAfterBrochasPrayer(insertPrayer: InsertAfterBrochasPrayer): Promise<AfterBrochasPrayer> {
    const [prayer] = await db.insert(afterBrochasPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Birkat Hamazon methods
  async getBirkatHamazonPrayers(): Promise<BirkatHamazonPrayer[]> {
    return await db.select().from(birkatHamazonPrayers).orderBy(birkatHamazonPrayers.orderIndex);
  }

  async createBirkatHamazonPrayer(insertPrayer: InsertBirkatHamazonPrayer): Promise<BirkatHamazonPrayer> {
    const [prayer] = await db.insert(birkatHamazonPrayers).values(insertPrayer).returning();
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
      const [result] = await db.select().from(dailyHalacha).where(eq(dailyHalacha.date, date)).limit(1);
      return result;
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
      const [result] = await db.select().from(dailyEmuna).where(eq(dailyEmuna.date, date)).limit(1);
      return result;
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
      const [result] = await db.select().from(dailyChizuk).where(eq(dailyChizuk.date, date)).limit(1);
      return result;
    } catch (error) {
      console.error('Failed to fetch daily chizuk:', error);
      return undefined;
    }
  }

  async createDailyChizuk(insertChizuk: InsertDailyChizuk): Promise<DailyChizuk> {
    const [chizuk] = await db.insert(dailyChizuk).values(insertChizuk).returning();
    return chizuk;
  }

  async getFeaturedContentByDate(date: string): Promise<FeaturedContent | undefined> {
    try {
      const [result] = await db.select().from(featuredContent).where(eq(featuredContent.date, date)).limit(1);
      return result;
    } catch (error) {
      console.error('Failed to fetch featured content:', error);
      return undefined;
    }
  }

  async createFeaturedContent(insertFeatured: InsertFeaturedContent): Promise<FeaturedContent> {
    const [featured] = await db.insert(featuredContent).values(insertFeatured).returning();
    return featured;
  }

  async getPirkeiAvotByDate(date: string): Promise<{text: string; chapter: number; source: string} | undefined> {
    try {
      // Check if we need to advance to next verse for a new day
      const progress = await this.getPirkeiAvotProgress();
      const today = new Date().toISOString().split('T')[0];
      const lastUpdated = progress.lastUpdated ? new Date(progress.lastUpdated).toISOString().split('T')[0] : '';
      
      // If it's a new day, advance to next verse
      if (today !== lastUpdated) {
        await this.getNextPirkeiAvotReference(); // This will advance and update the database
      }
      
      // Now get the current verse content
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

  // Daily recipe methods
  async getDailyRecipeByDate(date: string): Promise<DailyRecipe | undefined> {
    // Find recipe where the given date falls within the date range
    const [recipe] = await db
      .select()
      .from(dailyRecipes)
      .where(
        and(
          lte(dailyRecipes.fromDate, date),
          gte(dailyRecipes.untilDate, date)
        )
      )
      .limit(1);
    return recipe;
  }

  async createDailyRecipe(insertRecipe: InsertDailyRecipe): Promise<DailyRecipe> {
    const [recipe] = await db.insert(dailyRecipes).values(insertRecipe).returning();
    return recipe;
  }

  async getParshaVortByWeek(week: string): Promise<ParshaVort | undefined> {
    // For compatibility, treat week parameter as fromDate for now
    const [vort] = await db.select().from(parshaVorts).where(eq(parshaVorts.fromDate, week));
    return vort || undefined;
  }

  async getParshaVortByDate(date: string): Promise<ParshaVort | undefined> {
    const [vort] = await db
      .select()
      .from(parshaVorts)
      .where(and(
        lte(parshaVorts.fromDate, date),
        gte(parshaVorts.untilDate, date)
      ))
      .limit(1);
    return vort;
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
      const targetLocation = userLocation === "israel" ? "israel" : "worldwide";
      const now = new Date();
      
      // First try location-specific promotion
      let result = await db.select()
        .from(discountPromotions)
        .where(
          and(
            eq(discountPromotions.isActive, true),
            lte(discountPromotions.startDate, now),
            gte(discountPromotions.endDate, now),
            eq(discountPromotions.targetLocation, targetLocation)
          )
        )
        .limit(1);
      
      // If no location-specific promotion found and target is israel, fall back to worldwide
      if (result.length === 0 && targetLocation === "israel") {
        result = await db.select()
          .from(discountPromotions)
          .where(
            and(
              eq(discountPromotions.isActive, true),
              lte(discountPromotions.startDate, now),
              gte(discountPromotions.endDate, now),
              eq(discountPromotions.targetLocation, "worldwide")
            )
          )
          .limit(1);
      }
      
      return result[0] || undefined;
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
    // Find inspiration where the given date falls within the date range
    const [inspiration] = await db
      .select()
      .from(tableInspirations)
      .where(
        and(
          lte(tableInspirations.fromDate, date),
          gte(tableInspirations.untilDate, date)
        )
      )
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

  async getCommunityImpactByDate(date: string): Promise<CommunityImpact | undefined> {
    // Find community impact where the given date falls within the date range
    const [impact] = await db
      .select()
      .from(communityImpact)
      .where(
        and(
          lte(communityImpact.fromDate, date),
          gte(communityImpact.untilDate, date)
        )
      )
      .limit(1);
    return impact;
  }

  async createCommunityImpact(insertImpact: InsertCommunityImpact): Promise<CommunityImpact> {
    const [impact] = await db
      .insert(communityImpact)
      .values(insertImpact)
      .returning();
    return impact;
  }

  // Analytics methods implementation
  async trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [newEvent] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();
    
    // Update daily stats with proper aggregation
    const today = formatDate(new Date());
    await this.recalculateDailyStats(today);
    
    return newEvent;
  }

  // Efficient session tracking - only record unique sessions once per day
  async recordActiveSession(sessionId: string): Promise<void> {
    const today = formatDate(new Date());
    
    // Update daily stats to include this unique session
    const existing = await this.getDailyStats(today);
    
    if (existing) {
      // Increment unique users count by 1 (simple approach for session-based counting)
      await db
        .update(dailyStats)
        .set({
          uniqueUsers: (existing.uniqueUsers || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(dailyStats.date, today));
    } else {
      // Create new daily stats with this session
      await db
        .insert(dailyStats)
        .values({
          date: today,
          uniqueUsers: 1,
          pageViews: 0,
          tehillimCompleted: 0,
          namesProcessed: 0,
          booksCompleted: 0,
          modalCompletions: {}
        });
    }
  }

  // Clean up old analytics events (keep only last 30 days)
  async cleanupOldAnalytics(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await db
      .delete(analyticsEvents)
      .where(lt(analyticsEvents.createdAt, thirtyDaysAgo));
  }

  async getDailyStats(date: string): Promise<DailyStats | undefined> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, date))
      .limit(1);
    return stats;
  }

  async recalculateDailyStats(date: string): Promise<DailyStats> {
    // Count today's events for recalculation (only completion events now)
    const todayEvents = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          gt(analyticsEvents.createdAt, new Date(date + 'T00:00:00')),
          lt(analyticsEvents.createdAt, new Date(date + 'T23:59:59'))
        )
      );
    
    // Count unique users (by session ID)
    const uniqueSessions = new Set(todayEvents.map(e => e.sessionId).filter(Boolean));
    
    // Count event types (no more page_view tracking)
    const pageViews = 0; // No longer tracking page views
    const tehillimCompleted = todayEvents.filter(e => e.eventType === 'tehillim_complete').length;
    const namesProcessed = todayEvents.filter(e => e.eventType === 'name_prayed').length;
    const booksCompleted = todayEvents.filter(e => e.eventType === 'tehillim_book_complete').length;
    
    // Count modal completions by type
    const modalCompletions: Record<string, number> = {};
    todayEvents
      .filter(e => e.eventType === 'modal_complete')
      .forEach(e => {
        const modalType = (e.eventData as any)?.modalType || 'unknown';
        modalCompletions[modalType] = (modalCompletions[modalType] || 0) + 1;
      });
    
    // Upsert stats with recalculated values
    const existing = await this.getDailyStats(date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyStats)
        .set({
          uniqueUsers: uniqueSessions.size,
          pageViews,
          tehillimCompleted,
          namesProcessed,
          booksCompleted,
          totalActs: this.calculateTotalActs(modalCompletions, tehillimCompleted),
          modalCompletions,
          updatedAt: new Date()
        })
        .where(eq(dailyStats.date, date))
        .returning();
      return updated;
    } else {
      const [newStats] = await db
        .insert(dailyStats)
        .values({
          date,
          uniqueUsers: uniqueSessions.size,
          pageViews,
          tehillimCompleted,
          namesProcessed,
          booksCompleted,
          totalActs: this.calculateTotalActs(modalCompletions, tehillimCompleted),
          modalCompletions
        })
        .returning();
      return newStats;
    }
  }

  async updateDailyStats(date: string, updates: Partial<DailyStats>): Promise<DailyStats> {
    // Get existing stats or create new
    const existing = await this.getDailyStats(date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyStats)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(dailyStats.date, date))
        .returning();
      return updated;
    } else {
      // Use recalculation for initial creation
      return await this.recalculateDailyStats(date);
    }
  }

  // Helper method to calculate total acts
  private calculateTotalActs(modalCompletions: Record<string, number>, tehillimCompleted: number): number {
    const torahActs = ['torah', 'chizuk', 'emuna', 'halacha', 'featured-content'];
    const tefillaActs = ['tefilla', 'morning-brochas', 'mincha', 'maariv', 'nishmas', 'birkat-hamazon', 'tehillim-text', 'special-tehillim'];
    const tzedakaActs = ['tzedaka', 'donate'];
    
    let totalActs = 0;
    
    // Count modal acts
    for (const [modalType, count] of Object.entries(modalCompletions || {})) {
      if (torahActs.includes(modalType) || tefillaActs.includes(modalType) || tzedakaActs.includes(modalType)) {
        totalActs += count;
      }
    }
    
    // Add tehillim completions as acts
    totalActs += tehillimCompleted || 0;
    
    return totalActs;
  }

  async getMonthlyStats(year: number, month: number): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalActs: number;
    totalModalCompletions: Record<string, number>;
  }> {
    try {
      // Get stats for the specified month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
      
      const monthlyStats = await db
        .select()
        .from(dailyStats)
        .where(
          and(
            gte(dailyStats.date, startDate),
            lte(dailyStats.date, endDate)
          )
        );
      
      // Aggregate monthly totals
      let totalUsers = 0;
      let totalPageViews = 0;
      let totalTehillimCompleted = 0;
      let totalNamesProcessed = 0;
      let totalBooksCompleted = 0;
      let totalActs = 0;
      const totalModalCompletions: Record<string, number> = {};
      
      for (const stats of monthlyStats) {
        totalUsers += stats.uniqueUsers || 0;
        totalPageViews += stats.pageViews || 0;
        totalTehillimCompleted += stats.tehillimCompleted || 0;
        totalNamesProcessed += stats.namesProcessed || 0;
        totalBooksCompleted += stats.booksCompleted || 0;
        totalActs += stats.totalActs || 0;
        
        // Merge modal completions
        const completions = stats.modalCompletions as Record<string, number> || {};
        for (const [modalType, count] of Object.entries(completions)) {
          totalModalCompletions[modalType] = (totalModalCompletions[modalType] || 0) + count;
        }
      }
      
      return {
        totalUsers,
        totalPageViews,
        totalTehillimCompleted,
        totalNamesProcessed,
        totalBooksCompleted,
        totalActs,
        totalModalCompletions
      };
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      // Return empty stats if error occurs
      return {
        totalUsers: 0,
        totalPageViews: 0,
        totalTehillimCompleted: 0,
        totalNamesProcessed: 0,
        totalBooksCompleted: 0,
        totalActs: 0,
        totalModalCompletions: {}
      };
    }
  }

  async getTotalStats(): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalActs: number;
    totalModalCompletions: Record<string, number>;
  }> {
    // Get all daily stats
    const allStats = await db.select().from(dailyStats);
    
    // Aggregate totals
    let totalUsers = 0;
    let totalPageViews = 0;
    let totalTehillimCompleted = 0;
    let totalNamesProcessed = 0;
    let totalBooksCompleted = 0;
    let totalActs = 0;
    const totalModalCompletions: Record<string, number> = {};
    
    for (const stats of allStats) {
      totalUsers += stats.uniqueUsers || 0;
      totalPageViews += stats.pageViews || 0;
      totalTehillimCompleted += stats.tehillimCompleted || 0;
      totalNamesProcessed += stats.namesProcessed || 0;
      totalBooksCompleted += stats.booksCompleted || 0;
      totalActs += stats.totalActs || 0;
      
      // Merge modal completions
      const completions = stats.modalCompletions as Record<string, number> || {};
      for (const [modalType, count] of Object.entries(completions)) {
        totalModalCompletions[modalType] = (totalModalCompletions[modalType] || 0) + count;
      }
    }
    
    return {
      totalUsers,
      totalPageViews,
      totalTehillimCompleted,
      totalNamesProcessed,
      totalBooksCompleted,
      totalActs,
      totalModalCompletions
    };
  }

  async getCommunityImpact(): Promise<{
    totalDaysSponsored: number;
    totalCampaigns: number;
    totalRaised: number;
  }> {
    // Count total active sponsors (days sponsored)
    const activeSponsors = await db.select().from(sponsors).where(eq(sponsors.isActive, true));
    const totalDaysSponsored = activeSponsors.length;

    // Count total campaigns
    const allCampaigns = await db.select().from(campaigns);
    const totalCampaigns = allCampaigns.length;

    // Sum total raised from all campaigns
    const totalRaised = allCampaigns.reduce((sum, campaign) => sum + (campaign.currentAmount || 0), 0);

    return {
      totalDaysSponsored,
      totalCampaigns,
      totalRaised
    };
  }
}

export const storage = new DatabaseStorage();