import serverAxiosClient from "./axiosClient";
import { 
  shopItems, 
  tehillimNames, tehillim, globalTehillimProgress, minchaPrayers, maarivPrayers, morningPrayers, birkatHamazonPrayers, afterBrochasPrayers, sponsors, nishmasText,
  dailyHalacha, dailyEmuna, dailyChizuk, featuredContent,
  dailyRecipes, parshaVorts, tableInspirations, communityImpact, campaigns, donations, womensPrayers, discountPromotions, pirkeiAvot, pirkeiAvotProgress,
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
  type PirkeiAvot, type InsertPirkeiAvot,
  type PirkeiAvotProgress, type InsertPirkeiAvotProgress,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type DailyStats, type InsertDailyStats,
  type Message, type InsertMessage, messages
} from "../shared/schema";
import { db, pool } from "./db";
import { eq, gt, lt, gte, lte, and, sql, like } from "drizzle-orm";
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
  
  // Pirkei Avot methods
  getAllPirkeiAvot(): Promise<PirkeiAvot[]>;
  getPirkeiAvotByOrderIndex(orderIndex: number): Promise<PirkeiAvot | undefined>;
  createPirkeiAvot(pirkeiAvot: InsertPirkeiAvot): Promise<PirkeiAvot>;
  getCurrentPirkeiAvot(): Promise<PirkeiAvot | undefined>;

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
  getProgressWithAssignedName(): Promise<any>;
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
  updatePirkeiAvotProgress(orderIndex: number): Promise<PirkeiAvotProgress>;
  advancePirkeiAvotProgress(): Promise<PirkeiAvotProgress>;

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
  
  // Message methods
  getMessageByDate(date: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
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
    // Cleanup expired names only when fetching all names
    // This happens less frequently than progress checks
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
      const initialName = await this.getNextNameForAssignment();
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
    // CRITICAL FIX: Use atomic database operation to prevent concurrent update issues
    // When multiple users complete the same perek simultaneously, this ensures 
    // the progress only advances by 1, not by the number of simultaneous completions
    
    return db.transaction(async (tx) => {
      // Lock the row for update to prevent concurrent modifications
      const [progress] = await tx.select()
        .from(globalTehillimProgress)
        .where(sql`id = (SELECT id FROM global_tehillim_progress LIMIT 1)`)
        .for('update');
      
      if (!progress) {
        // Initialize progress if it doesn't exist
        const initialName = await this.getNextNameForAssignment();
        const [newProgress] = await tx.insert(globalTehillimProgress).values({
          currentPerek: 1,
          currentNameId: initialName?.id || null,
          completedBy: null
        }).returning();
        return newProgress;
      }
      
      // ONLY advance if the request matches the current database perek
      // This prevents multiple simultaneous completions of the same perek from 
      // causing the chain to jump multiple steps ahead
      if (currentPerek !== progress.currentPerek) {
        // Someone else already advanced this perek, return current state without advancing
        return progress;
      }
      
      // Get the max ID to know when to reset
      const [maxRow] = await tx
        .select({ maxId: sql<number>`MAX(id)` })
        .from(tehillim);
      
      const maxId = maxRow?.maxId || 171; // 171 is the total with Psalm 119 having 22 parts
      
      // Check if we're completing the entire book
      const isBookComplete = progress.currentPerek >= maxId;
      
      // Calculate next ID (cycling through all rows)
      const nextId = progress.currentPerek >= maxId ? 1 : progress.currentPerek + 1;
      
      // Log book completion event when finishing the last row
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
      const nextName = await this.getNextNameForAssignment();
      
      // Atomically update to the next perek
      const [updated] = await tx.update(globalTehillimProgress)
        .set({
          currentPerek: nextId,
          currentNameId: nextName?.id || null,
          lastUpdated: new Date(),
          completedBy: completedBy || null
        })
        .where(eq(globalTehillimProgress.id, progress.id))
        .returning();
        
      return updated;
    });
  }

  async getProgressWithAssignedName(): Promise<any> {
    // Optimized method to get progress and assigned name in fewer queries
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    
    if (!progress) {
      // Initialize progress if it doesn't exist
      const initialName = await this.getNextNameForAssignment();
      const [newProgress] = await db.insert(globalTehillimProgress).values({
        currentPerek: 1,
        currentNameId: initialName?.id || null,
        completedBy: null
      }).returning();
      
      return {
        ...newProgress,
        assignedName: initialName?.hebrewName || null
      };
    }
    
    // If there's an assigned name, fetch it
    let assignedName = null;
    if (progress.currentNameId) {
      const [name] = await db.select().from(tehillimNames).where(eq(tehillimNames.id, progress.currentNameId));
      if (name) {
        assignedName = name.hebrewName;
      }
    }
    
    // If no assigned name, assign one now
    if (!assignedName) {
      const newName = await this.getNextNameForAssignment();
      if (newName && progress.id) {
        await db.update(globalTehillimProgress)
          .set({ currentNameId: newName.id })
          .where(eq(globalTehillimProgress.id, progress.id));
        assignedName = newName.hebrewName;
      }
    }
    
    return {
      ...progress,
      assignedName: assignedName || null
    };
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
    const newName = await this.getNextNameForAssignment();
    if (newName && progress.id) {
      // Update the progress with this name
      await db.update(globalTehillimProgress)
        .set({ currentNameId: newName.id })
        .where(eq(globalTehillimProgress.id, progress.id));
      return newName;
    }
    
    return undefined;
  }

  async getNextNameForAssignment(): Promise<TehillimName | undefined> {
    // Don't cleanup here - avoid redundant cleanup operations
    const now = new Date();
    const activeNames = await db.select()
      .from(tehillimNames)
      .where(gt(tehillimNames.expiresAt, now))
      .orderBy(tehillimNames.id); // Order by ID to ensure consistent ordering
    
    if (activeNames.length === 0) return undefined;
    
    // Get the current progress to find which name was last used
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    
    if (!progress || !progress.currentNameId) {
      // No previous name, return the first one
      return activeNames[0];
    }
    
    // Find the index of the current name
    const currentIndex = activeNames.findIndex(name => name.id === progress.currentNameId);
    
    if (currentIndex === -1) {
      // Current name not found (maybe expired), return the first one
      return activeNames[0];
    }
    
    // Return the next name in the list, cycling back to the beginning if needed
    const nextIndex = (currentIndex + 1) % activeNames.length;
    return activeNames[nextIndex];
  }



  // Get Tehillim from Supabase database by English number (1-150)
  async getSupabaseTehillim(englishNumber: number, language: string): Promise<{text: string; perek: number; language: string}> {
    try {
      // Get all parts for this English number
      const rows = await db
        .select()
        .from(tehillim)
        .where(eq(tehillim.englishNumber, englishNumber))
        .orderBy(tehillim.partNumber);

      if (!rows || rows.length === 0) {
        throw new Error(`Tehillim ${englishNumber} not found in database`);
      }

      // Combine all parts into one text
      let combinedText = '';
      if (language === 'hebrew') {
        combinedText = rows.map((row: any) => row.hebrewText).join('\n\n');
      } else {
        combinedText = rows.map((row: any) => row.englishText).join('\n\n');
      }

      return {
        text: combinedText,
        perek: englishNumber,
        language
      };
    } catch (error) {
      console.error('Error fetching Tehillim from Supabase:', error);
      // Fallback to Sefaria if needed
      return this.getSefariaTehillim(englishNumber, language);
    }
  }

  // Get single Tehillim row by ID for Global Tehillim display
  async getSupabaseTehillimById(id: number): Promise<{
    id: number;
    englishNumber: number;
    partNumber: number;
    hebrewNumber: string;
    hebrewText: string;
    englishText: string;
  } | null> {
    try {
      const [row] = await db
        .select()
        .from(tehillim)
        .where(eq(tehillim.id, id));

      return row || null;
    } catch (error) {
      console.error('Error fetching Tehillim by ID:', error);
      return null;
    }
  }

  async getTehillimById(id: number, language: string): Promise<{text: string; perek: number; language: string}> {
    try {
      const [row] = await db
        .select()
        .from(tehillim)
        .where(eq(tehillim.id, id));

      if (!row) {
        throw new Error(`Tehillim with ID ${id} not found in database`);
      }

      const text = language === 'hebrew' ? row.hebrewText : row.englishText;

      return {
        text: text || '',
        perek: row.englishNumber || 1,
        language
      };
    } catch (error) {
      console.error('Error fetching Tehillim by ID:', error);
      // Fallback to Sefaria if needed
      throw error;
    }
  }

  // Get Tehillim preview for Global display
  async getSupabaseTehillimPreview(id: number, language: string): Promise<{
    preview: string;
    englishNumber: number;
    partNumber: number;
    language: string;
  } | null> {
    try {
      const row = await this.getSupabaseTehillimById(id);
      if (!row) return null;

      const text = language === 'hebrew' ? row.hebrewText : row.englishText;
      // Get first line or first 100 characters
      const firstLine = text.split('\n')[0] || text.substring(0, 100) + '...';

      return {
        preview: firstLine,
        englishNumber: row.englishNumber,
        partNumber: row.partNumber,
        language
      };
    } catch (error) {
      console.error('Error getting Tehillim preview:', error);
      return null;
    }
  }

  // DEPRECATED - Use getSupabaseTehillim instead
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
      
      // Aggressive Hebrew text cleaning to eliminate all display issues
      let cleanText = text
        .replace(/<br\s*\/?>/gi, '\n')  // Replace <br> tags with newlines
        .replace(/<b>\s*\|\s*<\/b>/gi, ' ')  // Replace vertical bar in bold tags with space
        .replace(/<b>\s*׀\s*<\/b>/gi, ' ')  // Replace Hebrew paseq in bold tags with space
        .replace(/<[^>]*>/gi, '')  // Remove any HTML tags
        .replace(/&nbsp;/gi, ' ')  // Replace non-breaking spaces with regular spaces
        .replace(/&thinsp;/gi, ' ')  // Replace thin spaces with regular spaces
        .replace(/&ensp;/gi, ' ')  // Replace en spaces with regular spaces
        .replace(/&emsp;/gi, ' ')  // Replace em spaces with regular spaces
        .replace(/&middot;/gi, ' ')  // Replace middle dot with space
        .replace(/&[a-zA-Z0-9#]+;/gi, ' ')  // Replace remaining HTML entities with space
        .replace(/\{[פס]\}/g, '')  // Remove Hebrew paragraph markers like {פ} and {ס}
        // Remove all problematic Unicode ranges - but preserve specific Hebrew punctuation
        .replace(/[\u2000-\u206F]/g, (char) => {
          const code = char.charCodeAt(0);
          // Keep only normal spaces and Hebrew punctuation
          if (code === 0x2000 || code === 0x2002 || code === 0x2003 || code === 0x2009) return ' '; // Convert spaces
          if (code === 0x2013 || code === 0x2014) return '-'; // Keep dashes
          if (code === 0x05BE) return char; // Keep Hebrew maqaf (hyphen)
          return ''; // Remove everything else in this range
        })
        .replace(/[\u2100-\u27BF]/g, '')  // Remove all symbols, shapes, and technical characters
        .replace(/[\u2800-\u28FF]/g, '')  // Remove braille patterns
        .replace(/[\uE000-\uF8FF]/g, '')  // Remove private use area
        .replace(/[\uFE00-\uFE0F]/g, '')  // Remove variation selectors
        .replace(/[\uFFF0-\uFFFF]/g, '')  // Remove specials
        .replace(/[\uFFFD\uFFFC]/g, '')  // Remove replacement characters
        .replace(/[\u00A0]/g, ' ')       // Convert non-breaking space to regular space
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
      
      // Character-by-character filtering to keep only safe characters
      let result = '';
      for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const code = char.charCodeAt(0);
        
        // Keep basic ASCII (0-127) except control chars
        if (code >= 32 && code <= 126) {
          result += char;
          continue;
        }
        if (code === 10 || code === 13) { // Keep newlines
          result += char;
          continue;
        }
        
        // Keep Hebrew block but filter problematic characters
        if (code >= 0x0590 && code <= 0x05FF) {
          // Skip paseq and sof pasuq which appear as vertical bars or colons
          if (code === 0x05C0 || code === 0x05C3) {
            result += ' '; // Replace with space to maintain word separation
            continue;
          }
          
          // Only keep Hebrew letters and most common vowels
          if ((code >= 0x05D0 && code <= 0x05EA) || // Hebrew letters
              code === 0x05B0 || // Sheva
              code === 0x05B1 || // Hataf Segol
              code === 0x05B2 || // Hataf Patah
              code === 0x05B3 || // Hataf Qamats
              code === 0x05B4 || // Hiriq
              code === 0x05B5 || // Tsere
              code === 0x05B6 || // Segol
              code === 0x05B7 || // Patah
              code === 0x05B8 || // Qamats
              code === 0x05B9 || // Holam
              code === 0x05BA || // Holam Haser for Vav
              code === 0x05BB || // Qubuts
              code === 0x05BC || // Dagesh or Mappiq
              code === 0x05BE || // Maqaf (Hebrew hyphen)
              code === 0x05C1 || // Shin Dot
              code === 0x05C2) { // Sin Dot
            result += char;
          }
          // Skip ALL other marks that cause display issues
          continue;
        }
        
        // Keep Hebrew presentation forms but be selective
        if (code >= 0xFB1D && code <= 0xFB4F) {
          result += char;
          continue;
        }
        
        // Convert various space characters to regular space
        if (code === 0x00A0 || // Non-breaking space
            code === 0x2000 || code === 0x2001 || code === 0x2002 || // Various width spaces
            code === 0x2003 || code === 0x2004 || code === 0x2005 ||
            code === 0x2006 || code === 0x2007 || code === 0x2008 ||
            code === 0x2009 || code === 0x200A || code === 0x202F ||
            code === 0x205F || code === 0x3000) { // Various other spaces
          result += ' ';
          continue;
        }
        
        // Special handling for vertical bar character
        if (code === 0x007C) { // Vertical bar |
          result += ' '; // Replace with space
          continue;
        }
        
        // Skip everything else (all other Unicode blocks that cause issues)
      }
      
      // Final cleanup - preserve line breaks and spacing
      cleanText = result
        .replace(/[ \t]{2,}/g, ' ')     // Replace multiple spaces/tabs with single space (but not newlines)
        .replace(/\n{3,}/g, '\n\n')    // Limit to max 2 consecutive newlines
        .replace(/׃/g, ':')           // Replace Hebrew sof pasuq with regular colon
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

  // Pirkei Avot methods  
  async getAllPirkeiAvot(): Promise<PirkeiAvot[]> {
    return await db.select().from(pirkeiAvot).orderBy(pirkeiAvot.orderIndex);
  }

  async getPirkeiAvotByOrderIndex(orderIndex: number): Promise<PirkeiAvot | undefined> {
    const [result] = await db.select().from(pirkeiAvot).where(eq(pirkeiAvot.orderIndex, orderIndex)).limit(1);
    return result;
  }

  async createPirkeiAvot(insertPirkeiAvot: InsertPirkeiAvot): Promise<PirkeiAvot> {
    const [result] = await db.insert(pirkeiAvot).values(insertPirkeiAvot).returning();
    return result;
  }

  async getCurrentPirkeiAvot(): Promise<PirkeiAvot | undefined> {
    try {
      // Get or create progress
      let progress = await this.getPirkeiAvotProgress();
      
      // Check if we need to advance (new day)
      const today = new Date().toISOString().split('T')[0];
      const lastUpdated = progress.lastUpdated ? new Date(progress.lastUpdated).toISOString().split('T')[0] : '';
      
      if (today !== lastUpdated) {
        progress = await this.advancePirkeiAvotProgress();
      }
      
      // Get the current Pirkei Avot content
      return await this.getPirkeiAvotByOrderIndex(progress.currentOrderIndex);
    } catch (error) {
      console.error('Error getting current Pirkei Avot:', error);
      return undefined;
    }
  }

  // Daily recipe methods
  async getDailyRecipeByDate(date: string): Promise<DailyRecipe | undefined> {
    // Find recipe for the specific date
    const [recipe] = await db
      .select()
      .from(dailyRecipes)
      .where(eq(dailyRecipes.date, date))
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

  // Donation methods
  async createDonation(donation: {
    stripePaymentIntentId?: string;
    amount: number;
    donationType: string;
    sponsorName?: string;
    dedication?: string;
    email?: string;
    status: string;
  }) {
    const [result] = await db
      .insert(donations)
      .values(donation)
      .returning();
    return result;
  }

  async getDonationByPaymentIntentId(stripePaymentIntentId: string) {
    const [result] = await db
      .select()
      .from(donations)
      .where(eq(donations.stripePaymentIntentId, stripePaymentIntentId))
      .limit(1);
    return result || null;
  }

  async updateDonationStatus(stripePaymentIntentId: string, status: string) {
    const [result] = await db
      .update(donations)
      .set({ status })
      .where(eq(donations.stripePaymentIntentId, stripePaymentIntentId))
      .returning();
    return result;
  }

  async getPirkeiAvotProgress(): Promise<PirkeiAvotProgress> {
    let [progress] = await db.select().from(pirkeiAvotProgress).limit(1);
    
    if (!progress) {
      // Initialize with orderIndex 0 if no progress exists
      [progress] = await db
        .insert(pirkeiAvotProgress)
        .values({ currentOrderIndex: 0 })
        .returning();
    }
    
    return progress;
  }

  async updatePirkeiAvotProgress(orderIndex: number): Promise<PirkeiAvotProgress> {
    const progress = await this.getPirkeiAvotProgress();
    
    const [updated] = await db
      .update(pirkeiAvotProgress)
      .set({ 
        currentOrderIndex: orderIndex,
        lastUpdated: new Date()
      })
      .where(eq(pirkeiAvotProgress.id, progress.id))
      .returning();
    
    return updated;
  }

  async advancePirkeiAvotProgress(): Promise<PirkeiAvotProgress> {
    const progress = await this.getPirkeiAvotProgress();
    
    // Get all Pirkei Avot content to find the max orderIndex
    const allContent = await this.getAllPirkeiAvot();
    
    if (allContent.length === 0) {
      // No content available, keep progress at 0
      return progress;
    }
    
    const maxOrderIndex = Math.max(...allContent.map(p => p.orderIndex));
    let nextOrderIndex = progress.currentOrderIndex + 1;
    
    // Cycle back to beginning if we've reached the end
    if (nextOrderIndex > maxOrderIndex) {
      nextOrderIndex = 0;
    }
    
    return await this.updatePirkeiAvotProgress(nextOrderIndex);
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
  async recordActiveSession(_sessionId: string): Promise<void> {
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
    const tefillaActs = ['tefilla', 'morning-brochas', 'mincha', 'maariv', 'nishmas', 'birkat-hamazon', 'special-tehillim', 'global-tehillim-chain', 'tehillim-text'];
    const tzedakaActs = ['tzedaka', 'donate'];
    
    let totalActs = 0;
    
    // Count modal acts
    for (const [modalType, count] of Object.entries(modalCompletions || {})) {
      if (torahActs.includes(modalType) || tefillaActs.includes(modalType) || tzedakaActs.includes(modalType)) {
        totalActs += count;
      }
      // Also count individual tehillim completions
      if (modalType.startsWith('individual-tehillim-')) {
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

  async getCommunityImpact(period: string = 'alltime'): Promise<{
    totalDaysSponsored: number;
    totalCampaigns: number;
    totalRaised: number;
  }> {
    let dateFilter;
    const now = new Date();
    
    if (period === 'today') {
      // Today only
      const today = now.toISOString().split('T')[0];
      dateFilter = and(
        gte(donations.createdAt, new Date(today + 'T00:00:00')),
        lte(donations.createdAt, new Date(today + 'T23:59:59'))
      );
    } else if (period === 'month') {
      // Current month
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = and(
        gte(donations.createdAt, firstDay),
        lte(donations.createdAt, lastDay)
      );
    }

    // Get sponsors based on period
    let sponsorFilter;
    if (period === 'today') {
      const today = now.toISOString().split('T')[0];
      sponsorFilter = and(
        eq(sponsors.isActive, true),
        eq(sponsors.sponsorshipDate, today)
      );
    } else if (period === 'month') {
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      sponsorFilter = and(
        eq(sponsors.isActive, true),
        like(sponsors.sponsorshipDate, `${year}-${month}-%`)
      );
    } else {
      sponsorFilter = eq(sponsors.isActive, true);
    }

    const activeSponsors = await db.select().from(sponsors).where(sponsorFilter);
    const totalDaysSponsored = activeSponsors.length;

    // Get donations based on period
    let donationQuery = db.select().from(donations).where(eq(donations.status, 'succeeded'));
    
    if (period === 'today' || period === 'month') {
      const successfulDonations = await db
        .select()
        .from(donations)
        .where(and(
          eq(donations.status, 'succeeded'),
          dateFilter!
        ));
      
      const totalCampaigns = successfulDonations.length;
      const totalRaised = successfulDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0) / 100;
      
      return {
        totalDaysSponsored,
        totalCampaigns,
        totalRaised
      };
    } else {
      // All time - original logic
      const successfulDonations = await donationQuery;
      const totalCampaigns = successfulDonations.length;
      const totalRaised = successfulDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0) / 100;
      
      return {
        totalDaysSponsored,
        totalCampaigns,
        totalRaised
      };
    }
  }
  
  // Message methods
  async getMessageByDate(date: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.date, date))
      .limit(1);
    return message;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();