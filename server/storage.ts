import serverAxiosClient from "./axiosClient";
import { 
  shopItems, 
  tehillimNames, tehillim, globalTehillimProgress, minchaPrayers, maarivPrayers, morningPrayers, brochas, sponsors, nishmasText,
  dailyHalacha, dailyEmuna, dailyChizuk, featuredContent, todaysSpecial, giftOfChatzos, torahChallenges,
  dailyRecipes, parshaVorts, torahClasses, lifeClasses, gemsOfGratitude, tableInspirations, marriageInsights, communityImpact, campaigns, donations, womensPrayers, meditations, discountPromotions, pirkeiAvot, pirkeiAvotProgress,
  analyticsEvents, dailyStats, acts,
  tehillimChains, tehillimChainReadings,
  userMitzvahProgress,

  type ShopItem, type InsertShopItem, type TehillimName, type InsertTehillimName,
  type GlobalTehillimProgress, type MinchaPrayer, type InsertMinchaPrayer,
  type MaarivPrayer, type InsertMaarivPrayer, type MorningPrayer, type InsertMorningPrayer,
  type Brocha, type InsertBrocha,
  type Sponsor, type InsertSponsor, type NishmasText, type InsertNishmasText,
  type DailyHalacha, type InsertDailyHalacha,
  type DailyEmuna, type InsertDailyEmuna,
  type DailyChizuk, type InsertDailyChizuk,
  type FeaturedContent, type InsertFeaturedContent,
  type DailyRecipe, type InsertDailyRecipe,
  type ParshaVort, type InsertParshaVort,
  type TorahClass, type InsertTorahClass,
  type LifeClass, type InsertLifeClass,
  type GemsOfGratitude, type InsertGemsOfGratitude,
  type TableInspiration, type InsertTableInspiration,
  type MarriageInsight, type InsertMarriageInsight,
  type CommunityImpact, type InsertCommunityImpact,
  type Campaign, type InsertCampaign,
  type Donation, type InsertDonation,
  type Act, type InsertAct,
  type WomensPrayer, type InsertWomensPrayer,
  type Meditation,
  type DiscountPromotion, type InsertDiscountPromotion,
  type PirkeiAvot, type InsertPirkeiAvot,
  type PirkeiAvotProgress,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type DailyStats,
  type Message, type InsertMessage, messages,
  scheduledNotifications, type ScheduledNotification, type InsertScheduledNotification,
  pushSubscriptions, pushNotifications,
  type PushSubscription, type InsertPushSubscription,
  type PushNotification, type InsertPushNotification,
  type TehillimChain, type InsertTehillimChain,
  type TehillimChainReading,
  type TodaysSpecial, type InsertTodaysSpecial,
  type GiftOfChatzos, type InsertGiftOfChatzos,
  type TorahChallenge, type InsertTorahChallenge,
  type UserMitzvahProgress
} from "../shared/schema";
import { db } from "./db";
import { eq, gt, lt, gte, lte, and, or, sql, like, ilike, desc, isNull } from "drizzle-orm";
import { formatDate } from './typeHelpers';

// Module-level session deduplication (persists across requests)
const recordedSessionsPerDay: Map<string, Set<string>> = new Map();

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
  
  // Today's Special methods
  getTodaysSpecialByDate(date: string): Promise<TodaysSpecial | undefined>;
  createTodaysSpecial(special: InsertTodaysSpecial): Promise<TodaysSpecial>;
  
  // Gift of Chatzos methods
  getGiftOfChatzosByDayOfWeek(dayOfWeek: number): Promise<GiftOfChatzos | undefined>;
  createGiftOfChatzos(gift: InsertGiftOfChatzos): Promise<GiftOfChatzos>;
  updateGiftOfChatzos(id: number, gift: Partial<InsertGiftOfChatzos>): Promise<GiftOfChatzos | undefined>;
  getAllGiftOfChatzos(): Promise<GiftOfChatzos[]>;
  
  // Torah Challenge methods
  getTorahChallengeByDate(date: string): Promise<TorahChallenge | undefined>;
  createTorahChallenge(challenge: InsertTorahChallenge): Promise<TorahChallenge>;
  updateTorahChallenge(id: number, challenge: Partial<InsertTorahChallenge>): Promise<TorahChallenge | undefined>;
  getAllTorahChallenges(): Promise<TorahChallenge[]>;
  
  // Pirkei Avot methods
  getAllPirkeiAvot(): Promise<PirkeiAvot[]>;
  getPirkeiAvotByOrderIndex(orderIndex: number): Promise<PirkeiAvot | undefined>;
  createPirkeiAvot(pirkeiAvot: InsertPirkeiAvot): Promise<PirkeiAvot>;
  getCurrentPirkeiAvot(): Promise<PirkeiAvot | undefined>;

  // Daily recipe methods
  getDailyRecipeByDate(date: string): Promise<DailyRecipe | undefined>;
  createDailyRecipe(recipe: InsertDailyRecipe): Promise<DailyRecipe>;
  getAllDailyRecipes(): Promise<DailyRecipe[]>;
  
  getParshaVortByWeek(week: string): Promise<ParshaVort | undefined>;
  getParshaVortByDate(date: string): Promise<ParshaVort | undefined>;
  getParshaVortsByDate(date: string): Promise<ParshaVort[]>;
  getAllParshaVorts(): Promise<ParshaVort[]>;
  createParshaVort(vort: InsertParshaVort): Promise<ParshaVort>;
  updateParshaVort(id: number, vort: Partial<InsertParshaVort>): Promise<ParshaVort | undefined>;
  deleteParshaVort(id: number): Promise<boolean>;

  // Torah classes methods
  getTorahClassByDate(date: string): Promise<TorahClass | undefined>;
  getTorahClassesByDate(date: string): Promise<TorahClass[]>;
  getAllTorahClasses(): Promise<TorahClass[]>;
  createTorahClass(torahClass: InsertTorahClass): Promise<TorahClass>;
  updateTorahClass(id: number, torahClass: Partial<InsertTorahClass>): Promise<TorahClass | undefined>;
  deleteTorahClass(id: number): Promise<boolean>;

  // Life classes methods
  getLifeClassesByDate(date: string): Promise<LifeClass[]>;
  getAllLifeClasses(): Promise<LifeClass[]>;
  createLifeClass(lifeClass: InsertLifeClass): Promise<LifeClass>;
  updateLifeClass(id: number, lifeClass: Partial<InsertLifeClass>): Promise<LifeClass | undefined>;
  deleteLifeClass(id: number): Promise<boolean>;

  // Gems of Gratitude methods
  getGemsOfGratitudeByDate(date: string): Promise<GemsOfGratitude | undefined>;
  getAllGemsOfGratitude(): Promise<GemsOfGratitude[]>;
  createGemsOfGratitude(gem: InsertGemsOfGratitude): Promise<GemsOfGratitude>;
  updateGemsOfGratitude(id: number, gem: Partial<InsertGemsOfGratitude>): Promise<GemsOfGratitude | undefined>;
  deleteGemsOfGratitude(id: number): Promise<boolean>;

  // Table inspiration methods
  getTableInspirationByDate(date: string): Promise<TableInspiration | undefined>;
  createTableInspiration(inspiration: InsertTableInspiration): Promise<TableInspiration>;
  getAllTableInspirations(): Promise<TableInspiration[]>;
  updateTableInspiration(id: number, inspiration: InsertTableInspiration): Promise<TableInspiration | undefined>;
  deleteTableInspiration(id: number): Promise<boolean>;

  // Marriage insights methods
  getMarriageInsightByDate(date: string): Promise<MarriageInsight | undefined>;
  createMarriageInsight(insight: InsertMarriageInsight): Promise<MarriageInsight>;
  getAllMarriageInsights(): Promise<MarriageInsight[]>;
  updateMarriageInsight(id: number, insight: Partial<InsertMarriageInsight>): Promise<MarriageInsight | undefined>;
  deleteMarriageInsight(id: number): Promise<boolean>;

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
  getSupabaseTehillim(englishNumber: number, language: string): Promise<{text: string; perek: number; language: string}>;
  getSupabaseTehillimById(id: number): Promise<{id: number; englishNumber: number; partNumber: number; hebrewNumber: string; hebrewText: string; englishText: string;} | null>;
  getSupabaseTehillimByEnglishAndPart(englishNumber: number, partNumber: number): Promise<{id: number; englishNumber: number; partNumber: number; hebrewNumber: string; hebrewText: string; englishText: string;} | null>;
  getTehillimById(id: number, language: string): Promise<{text: string; perek: number; language: string}>;
  getSupabaseTehillimPreview(id: number, language: string): Promise<{preview: string; englishNumber: number; partNumber: number; language: string;} | null>;

  // Tehillim Chains methods
  createTehillimChain(chain: InsertTehillimChain): Promise<TehillimChain>;
  getTehillimChainBySlug(slug: string): Promise<TehillimChain | null>;
  searchTehillimChains(query: string): Promise<TehillimChain[]>;
  getRandomTehillimChain(): Promise<TehillimChain | null>;
  getActiveTehillimChainCount(): Promise<number>;
  getTehillimChainStats(chainId: number): Promise<{totalSaid: number; booksCompleted: number; currentlyReading: number; available: number}>;
  startChainReading(chainId: number, psalmNumber: number, deviceId: string): Promise<TehillimChainReading>;
  completeChainReading(chainId: number, psalmNumber: number, deviceId: string): Promise<TehillimChainReading | null>;
  getAvailablePsalmForChain(chainId: number, excludeDeviceId?: string): Promise<number | null>;
  getRandomAvailablePsalmForChain(chainId: number, excludeDeviceId?: string, excludePsalm?: number): Promise<number | null>;
  getTotalChainTehillimCompleted(): Promise<number>;
  getTehillimGlobalStats(): Promise<{ totalRead: number; booksCompleted: number; uniqueReaders: number }>;
  getActiveChainReadingForDevice(chainId: number, deviceId: string): Promise<number | null>;
  migrateTehillimNamesToChains(): Promise<{ migrated: number; skipped: number; errors: string[] }>;

  // Mincha methods
  getMinchaPrayers(): Promise<MinchaPrayer[]>;
  createMinchaPrayer(prayer: InsertMinchaPrayer): Promise<MinchaPrayer>;
  
  // Morning prayer methods
  getMorningPrayers(): Promise<MorningPrayer[]>;
  createMorningPrayer(prayer: InsertMorningPrayer): Promise<MorningPrayer>;
  
  // Maariv methods
  getMaarivPrayers(): Promise<MaarivPrayer[]>;
  createMaarivPrayer(prayer: InsertMaarivPrayer): Promise<MaarivPrayer>;

  // Brochas methods
  getBrochas(): Promise<Brocha[]>;
  getBrochasByType(isSpecial: boolean): Promise<Brocha[]>;
  getBrochaById(id: number): Promise<Brocha | undefined>;
  createBrocha(brocha: InsertBrocha): Promise<Brocha>;
  
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

  // Donation methods - Enhanced for new schema
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationByPaymentIntentId(stripePaymentIntentId: string): Promise<Donation | null>;
  updateDonationStatus(stripePaymentIntentId: string, status: string): Promise<Donation>;
  updateDonation(id: number, updates: Partial<InsertDonation>): Promise<Donation>;

  // Acts tracking methods - New for individual button completion tracking
  createAct(act: InsertAct): Promise<Act>;
  getActByPaymentIntentId(paymentIntentId: string): Promise<Act | null>;

  // Pirkei Avot progression methods
  getPirkeiAvotProgress(): Promise<PirkeiAvotProgress>;
  updatePirkeiAvotProgress(orderIndex: number): Promise<PirkeiAvotProgress>;
  advancePirkeiAvotProgress(): Promise<PirkeiAvotProgress>;

  // Women's prayer methods
  getWomensPrayersByCategory(category: string): Promise<WomensPrayer[]>;
  getWomensPrayerById(id: number): Promise<WomensPrayer | undefined>;
  createWomensPrayer(prayer: InsertWomensPrayer): Promise<WomensPrayer>;

  // Meditation methods
  getMeditationCategories(): Promise<{section: string; subtitle: string}[]>;
  getMeditationsBySection(section: string): Promise<Meditation[]>;
  getAllMeditations(): Promise<Meditation[]>;
  getMeditationById(id: number): Promise<Meditation | undefined>;

  // Discount promotion methods
  getActiveDiscountPromotion(): Promise<DiscountPromotion | undefined>;
  getActiveDiscountPromotions(userLocation?: string): Promise<DiscountPromotion[]>;
  createDiscountPromotion(promotion: InsertDiscountPromotion): Promise<DiscountPromotion>;

  // Analytics methods
  trackEvent(event: InsertAnalyticsEvent & { idempotencyKey?: string; analyticsDate?: string }): Promise<AnalyticsEvent | null>;
  syncAnalyticsEvents(events: Array<{ eventType: string; eventData: Record<string, any>; sessionId: string; idempotencyKey: string; date?: string }>): Promise<{ synced: number }>;
  recordActiveSession(sessionId: string): Promise<void>;
  cleanupOldAnalytics(): Promise<void>;
  getDailyStats(date: string): Promise<DailyStats | undefined>;
  updateDailyStats(date: string, updates: Partial<DailyStats>): Promise<DailyStats>;
  getWeeklyStats(startDate: string): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
  }>;
  getTotalStats(): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalModalCompletions: Record<string, number>;
  }>;
  recalculateDailyStats(date: string): Promise<DailyStats>;
  getMonthlyStats(year: number, month: number): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
  }>;
  recalculateAllHistoricalStats(): Promise<{ updated: number; dates: string[] }>;
  getDateRangeStats(startDate: string, endDate: string): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
    moneyRaised: number;
    activeCampaignTotal: number;
    putACoinTotal: number;
    sponsorADayTotal: number;
    gaveElsewhereCount: number;
  }>;
  getComparisonStats(period: 'week' | 'month'): Promise<{
    current: {
      totalUsers: number;
      totalActs: number;
      totalTehillimCompleted: number;
      totalNamesProcessed: number;
      totalBooksCompleted: number;
      totalTzedakaActs: number;
      totalMeditationsCompleted: number;
      moneyRaised: number;
      activeCampaignTotal: number;
      putACoinTotal: number;
      sponsorADayTotal: number;
      totalModalCompletions: Record<string, number>;
    };
    previous: {
      totalUsers: number;
      totalActs: number;
      totalTehillimCompleted: number;
      totalNamesProcessed: number;
      totalBooksCompleted: number;
      totalTzedakaActs: number;
      totalMeditationsCompleted: number;
      moneyRaised: number;
      activeCampaignTotal: number;
      putACoinTotal: number;
      sponsorADayTotal: number;
      totalModalCompletions: Record<string, number>;
    };
    changes: {
      users: number;
      acts: number;
      tehillim: number;
      names: number;
      books: number;
      tzedaka: number;
      meditations: number;
      moneyRaised: number;
    };
  }>;

  // Community impact methods
  getCommunityImpact(period?: string): Promise<{
    totalDaysSponsored: number;
    totalCampaigns: number;
    totalRaised: number;
  }>;
  
  // Message methods
  getMessageByDate(date: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getAllMessages(): Promise<Message[]>;
  getUpcomingMessages(): Promise<Message[]>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  incrementMessageLike(id: number): Promise<Message>;
  incrementMessageDislike(id: number): Promise<Message>;
  decrementMessageLike(id: number): Promise<Message>;
  decrementMessageDislike(id: number): Promise<Message>;
  pinMessage(id: number): Promise<Message>;
  unpinMessage(id: number): Promise<void>;
  
  // Scheduled Notification methods
  getAllScheduledNotifications(): Promise<ScheduledNotification[]>;
  getScheduledNotificationById(id: number): Promise<ScheduledNotification | undefined>;
  getUpcomingScheduledNotifications(): Promise<ScheduledNotification[]>;
  getPendingScheduledNotifications(): Promise<ScheduledNotification[]>;
  createScheduledNotification(notification: InsertScheduledNotification): Promise<ScheduledNotification>;
  updateScheduledNotification(id: number, notification: Partial<InsertScheduledNotification>): Promise<ScheduledNotification>;
  deleteScheduledNotification(id: number): Promise<void>;
  markScheduledNotificationAsSent(id: number): Promise<void>;
  
  // Push notification methods
  subscribeToPush(subscription: InsertPushSubscription): Promise<PushSubscription>;
  unsubscribeFromPush(endpoint: string): Promise<void>;
  getActiveSubscriptions(): Promise<PushSubscription[]>;
  createNotification(notification: InsertPushNotification): Promise<PushNotification>;
  getNotificationHistory(limit?: number): Promise<PushNotification[]>;
  updateNotificationStats(id: number, successCount: number, failureCount: number): Promise<void>;
  
  // Subscription validation methods
  markSubscriptionValid(endpoint: string): Promise<void>;
  markSubscriptionInvalid(endpoint: string, errorCode?: number, errorMessage?: string): Promise<void>;
  getSubscriptionsNeedingValidation(hoursThreshold?: number): Promise<PushSubscription[]>;
  getAllSubscriptions(): Promise<PushSubscription[]>;
  
  // User Mitzvah Progress methods (for authenticated users)
  getUserMitzvahProgress(userId: string): Promise<UserMitzvahProgress | undefined>;
  upsertUserMitzvahProgress(userId: string, modalCompletions: Record<string, any>, tzedakaCompletions: Record<string, any>): Promise<UserMitzvahProgress>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Skip initialization for better performance
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
    // Note: Cleanup is handled by scheduled interval in routes.ts, not per-request
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
    
    const result = await db.transaction(async (tx) => {
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
      
      // Get the current name being prayed for before updating
      let currentNameDetails = null;
      if (progress.currentNameId) {
        const [nameDetails] = await tx.select()
          .from(tehillimNames)
          .where(eq(tehillimNames.id, progress.currentNameId));
        currentNameDetails = nameDetails;
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
      
      // Track analytics events using the transaction context
      try {
        // Track the Tehillim completion - using tx for proper transaction consistency
        await tx
          .insert(analyticsEvents)
          .values({
            eventType: 'tehillim_complete',
            eventData: {
              perekNumber: currentPerek,
              language: language,
              completedBy: completedBy || 'Anonymous',
              isGlobal: true
            },
            sessionId: 'global-chain'
          });
        
        // Track the name being prayed for (if there was a name)
        if (currentNameDetails) {
          await tx
            .insert(analyticsEvents)
            .values({
              eventType: 'name_prayed',
              eventData: {
                nameId: currentNameDetails.id,
                namePrayed: currentNameDetails.hebrewName,
                perekNumber: currentPerek,
                language: language,
                completedBy: completedBy || 'Anonymous'
              },
              sessionId: 'global-chain'
            });
        }
        
        // IMPORTANT: Global Tehillim chain counts as 2 mitzvos
        // Track an additional mitzvah for the global chain completion
        await tx
          .insert(analyticsEvents)
          .values({
            eventType: 'modal_complete',
            eventData: {
              modalType: 'global-tehillim-chain',
              perekNumber: currentPerek,
              language: language,
              completedBy: completedBy || 'Anonymous',
              mitzvahType: 'second_global_mitzvah'
            },
            sessionId: 'global-chain'
          });
        
        console.log(`Tracked Tehillim completion: perek ${currentPerek}, name: ${currentNameDetails?.hebrewName || 'None'}, counted as 2 mitzvos`);
      } catch (analyticsError) {
        // Log analytics errors but don't fail the transaction
        console.error('Failed to track Tehillim analytics:', analyticsError);
      }
      
      return updated;
    });
    
    // Recalculate daily stats after the transaction commits successfully
    try {
      const today = formatDate(new Date());
      await this.recalculateDailyStats(today);
    } catch (statsError) {
      console.error('Failed to recalculate daily stats after Tehillim completion:', statsError);
    }
    
    return result;
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

  // Get specific Tehillim part by English number and part number
  async getSupabaseTehillimByEnglishAndPart(englishNumber: number, partNumber: number): Promise<{
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
        .where(
          and(
            eq(tehillim.englishNumber, englishNumber),
            eq(tehillim.partNumber, partNumber)
          )
        );

      return row || null;
    } catch (error) {
      console.error('Error fetching Tehillim by English number and part from Supabase:', error);
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

  // =====================
  // Tehillim Chains Methods
  // =====================

  async createTehillimChain(chain: InsertTehillimChain): Promise<TehillimChain> {
    const [newChain] = await db.insert(tehillimChains).values(chain).returning();
    return newChain;
  }

  async getTehillimChainBySlug(slug: string): Promise<TehillimChain | null> {
    const [chain] = await db.select().from(tehillimChains).where(eq(tehillimChains.slug, slug));
    return chain || null;
  }

  async searchTehillimChains(query: string): Promise<TehillimChain[]> {
    if (!query || query.trim() === '') {
      // Return recent chains if no query
      return db.select().from(tehillimChains)
        .where(eq(tehillimChains.isActive, true))
        .orderBy(desc(tehillimChains.createdAt))
        .limit(5);
    }
    
    // Search by name or reason (case-insensitive)
    const searchPattern = `%${query}%`;
    return db.select().from(tehillimChains)
      .where(and(
        eq(tehillimChains.isActive, true),
        or(
          ilike(tehillimChains.name, searchPattern),
          ilike(tehillimChains.reason, searchPattern)
        )
      ))
      .orderBy(desc(tehillimChains.createdAt))
      .limit(20);
  }

  async getRandomTehillimChain(): Promise<TehillimChain | null> {
    // Get all active chains
    const chains = await db.select().from(tehillimChains)
      .where(eq(tehillimChains.isActive, true));
    
    if (chains.length === 0) {
      return null;
    }
    
    // Return a random chain
    return chains[Math.floor(Math.random() * chains.length)];
  }

  async getActiveTehillimChainCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tehillimChains)
      .where(eq(tehillimChains.isActive, true));
    return Number(result[0]?.count || 0);
  }

  async getTehillimChainStats(chainId: number): Promise<{totalSaid: number; booksCompleted: number; currentlyReading: number; available: number}> {
    // Total tehillim units: 171 (psalms 1-150, but psalm 119 has 22 parts instead of 1)
    const TOTAL_TEHILLIM_UNITS = 171;
    
    // Get completions per tehillim id to properly track cycles
    // psalmNumber in the database represents tehillim table id (1-171), not psalm number
    const completedResult = await db.select({ 
      psalmNumber: tehillimChainReadings.psalmNumber,
      count: sql<number>`count(*)`
    })
      .from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.status, 'completed')
      ))
      .groupBy(tehillimChainReadings.psalmNumber);
    
    // A book is complete when ALL 171 tehillim units have been read at least once
    // booksCompleted = minimum completion count across all 171 units
    // If any unit has never been completed, booksCompleted = 0
    const uniqueUnitsCompleted = completedResult.length;
    let booksCompleted = 0;
    if (uniqueUnitsCompleted === TOTAL_TEHILLIM_UNITS) {
      // All units have been completed at least once
      // Find the minimum completion count - that's how many full books
      const minCompletions = Math.min(...completedResult.map(r => Number(r.count)));
      booksCompleted = minCompletions;
    }
    
    // Count UNIQUE units completed in the CURRENT cycle (after the completed books)
    // A unit is completed in current cycle if its completion count > booksCompleted
    let completedInCurrentCycle = 0;
    for (const row of completedResult) {
      const completionsForUnit = Number(row.count);
      if (completionsForUnit > booksCompleted) {
        completedInCurrentCycle++;
      }
    }
    
    // Get currently reading (active readings started in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const readingResult = await db.select({ 
      count: sql<number>`count(DISTINCT ${tehillimChainReadings.psalmNumber})` 
    })
      .from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.status, 'reading'),
        gt(tehillimChainReadings.startedAt, tenMinutesAgo)
      ));
    const currentlyReading = Number(readingResult[0]?.count || 0);
    
    // Calculate available units in current cycle
    // IMPORTANT: completed + reading + available must equal 171
    const available = Math.max(0, TOTAL_TEHILLIM_UNITS - completedInCurrentCycle - currentlyReading);
    
    // Return UNIQUE completions in current cycle as "totalSaid" for display
    // This ensures: totalSaid + currentlyReading + available = 171
    return { totalSaid: completedInCurrentCycle, booksCompleted, currentlyReading, available };
  }

  async startChainReading(chainId: number, psalmNumber: number, deviceId: string): Promise<TehillimChainReading> {
    // First, check if this device already has an active reading on this chain
    const existingReading = await db.select().from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.deviceId, deviceId),
        eq(tehillimChainReadings.status, 'reading')
      ))
      .limit(1);
    
    // If there's an existing reading, DELETE it (don't store abandoned readings)
    // Completions should ONLY happen via explicit "Complete" button click
    if (existingReading.length > 0) {
      await db.delete(tehillimChainReadings)
        .where(eq(tehillimChainReadings.id, existingReading[0].id));
    }
    
    // Also cleanup any stale readings older than 10 minutes (from any device on this chain)
    // Include readings with null startedAt (legacy data) in the cleanup
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await db.delete(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.status, 'reading'),
        or(
          lt(tehillimChainReadings.startedAt, tenMinutesAgo),
          isNull(tehillimChainReadings.startedAt)
        )
      ));
    
    // Create new reading
    const [reading] = await db.insert(tehillimChainReadings).values({
      chainId,
      psalmNumber,
      deviceId,
      status: 'reading',
    }).returning();
    
    return reading;
  }

  async completeChainReading(chainId: number, psalmNumber: number, deviceId: string): Promise<TehillimChainReading | null> {
    // Find the reading and mark it complete
    const [reading] = await db.select().from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.psalmNumber, psalmNumber),
        eq(tehillimChainReadings.deviceId, deviceId),
        eq(tehillimChainReadings.status, 'reading')
      ))
      .limit(1);
    
    let completedReading: TehillimChainReading | null = null;
    
    if (!reading) {
      // Check if there's already a completed reading for this psalm by this device
      // This prevents duplicate completions when the user clicks complete multiple times
      const [existingCompleted] = await db.select().from(tehillimChainReadings)
        .where(and(
          eq(tehillimChainReadings.chainId, chainId),
          eq(tehillimChainReadings.psalmNumber, psalmNumber),
          eq(tehillimChainReadings.deviceId, deviceId),
          eq(tehillimChainReadings.status, 'completed')
        ))
        .orderBy(desc(tehillimChainReadings.completedAt))
        .limit(1);
      
      if (existingCompleted) {
        // Already completed by this device - return existing without creating duplicate
        console.log(`Chain ${chainId} psalm ${psalmNumber} already completed by device ${deviceId.slice(0, 20)}...`);
        return existingCompleted;
      }
      
      // No active reading and no existing completion - create a new completed one
      const [newReading] = await db.insert(tehillimChainReadings).values({
        chainId,
        psalmNumber,
        deviceId,
        status: 'completed',
      }).returning();
      completedReading = newReading;
    } else {
      // Update existing reading
      const [updatedReading] = await db.update(tehillimChainReadings)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(tehillimChainReadings.id, reading.id))
        .returning();
      completedReading = updatedReading;
    }
    
    // Track analytics event for chain tehillim completion
    try {
      // Get chain info for analytics
      const [chain] = await db.select().from(tehillimChains).where(eq(tehillimChains.id, chainId));
      
      // Track as tehillim_complete event
      await db.insert(analyticsEvents).values({
        eventType: 'tehillim_complete',
        eventData: {
          perekNumber: psalmNumber,
          chainId: chainId,
          chainName: chain?.name || 'Unknown',
          chainReason: chain?.reason || 'Unknown',
          isChainTehillim: true
        },
        sessionId: deviceId,
        analyticsDate: formatDate(new Date())
      });
      
      // Track as modal_complete for mitzvah counting
      await db.insert(analyticsEvents).values({
        eventType: 'modal_complete',
        eventData: {
          modalType: 'chain-tehillim',
          perekNumber: psalmNumber,
          chainId: chainId,
          chainName: chain?.name || 'Unknown'
        },
        sessionId: deviceId,
        analyticsDate: formatDate(new Date())
      });
      
      // Recalculate daily stats
      const today = formatDate(new Date());
      await this.recalculateDailyStats(today);
    } catch (analyticsError) {
      console.error('Failed to track chain tehillim analytics:', analyticsError);
    }
    
    return completedReading;
  }

  async getAvailablePsalmForChain(chainId: number, excludeDeviceId?: string): Promise<number | null> {
    // Total tehillim units: 171 (psalms 1-150, but psalm 119 has 22 parts instead of 1)
    const TOTAL_TEHILLIM_UNITS = 171;
    
    // Get all units currently being read by OTHER devices (active in last 10 min)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Build where clause - exclude current device's readings so they can get a fresh unit
    const whereConditions = [
      eq(tehillimChainReadings.chainId, chainId),
      eq(tehillimChainReadings.status, 'reading'),
      gt(tehillimChainReadings.startedAt, tenMinutesAgo)
    ];
    
    // If we have a device ID, exclude that device's readings (so same user can get new units)
    if (excludeDeviceId) {
      whereConditions.push(sql`${tehillimChainReadings.deviceId} != ${excludeDeviceId}`);
    }
    
    const activeReadings = await db.select({ psalmNumber: tehillimChainReadings.psalmNumber })
      .from(tehillimChainReadings)
      .where(and(...whereConditions));
    
    // Get completed units in current cycle
    // psalmNumber represents tehillim table id (1-171)
    const completedResult = await db.select({ 
      psalmNumber: tehillimChainReadings.psalmNumber,
      count: sql<number>`count(*)`
    })
      .from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.status, 'completed')
      ))
      .groupBy(tehillimChainReadings.psalmNumber);
    
    // Calculate books completed (a book is complete when ALL 171 units are read)
    const uniqueUnitsCompleted = completedResult.length;
    let booksCompleted = 0;
    if (uniqueUnitsCompleted === TOTAL_TEHILLIM_UNITS) {
      const minCompletions = Math.min(...completedResult.map(r => Number(r.count)));
      booksCompleted = minCompletions;
    }
    
    // Find units completed in current cycle (after the completed books)
    const completedUnits = new Set<number>();
    for (const row of completedResult) {
      const completionsForUnit = Number(row.count);
      if (completionsForUnit > booksCompleted) {
        completedUnits.add(row.psalmNumber);
      }
    }
    
    // Get units being read by others
    const readingUnits = new Set(activeReadings.map(r => r.psalmNumber));
    
    // Find available units (not completed in this cycle, not being read by others)
    // Iterate through tehillim ids 1-171
    const available: number[] = [];
    for (let i = 1; i <= TOTAL_TEHILLIM_UNITS; i++) {
      if (!completedUnits.has(i) && !readingUnits.has(i)) {
        available.push(i);
      }
    }
    
    if (available.length === 0) {
      // All units completed or being read - start new cycle with id 1
      return 1;
    }
    
    // Return the first available tehillim id (sequential order starting from 1)
    return available[0];
  }

  async getRandomAvailablePsalmForChain(chainId: number, _excludeDeviceId?: string, excludePsalm?: number): Promise<number | null> {
    // Total tehillim units: 171 (psalms 1-150, but psalm 119 has 22 parts instead of 1)
    const TOTAL_TEHILLIM_UNITS = 171;
    
    // Get completed units in current cycle
    const completedResult = await db.select({ 
      psalmNumber: tehillimChainReadings.psalmNumber,
      count: sql<number>`count(*)`
    })
      .from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.status, 'completed')
      ))
      .groupBy(tehillimChainReadings.psalmNumber);
    
    // Calculate books completed (a book is complete when ALL 171 units are read)
    const uniqueUnitsCompleted = completedResult.length;
    let booksCompleted = 0;
    if (uniqueUnitsCompleted === TOTAL_TEHILLIM_UNITS) {
      const minCompletions = Math.min(...completedResult.map(r => Number(r.count)));
      booksCompleted = minCompletions;
    }
    
    const completedUnits = new Set<number>();
    for (const row of completedResult) {
      const completionsForUnit = Number(row.count);
      if (completionsForUnit > booksCompleted) {
        completedUnits.add(row.psalmNumber);
      }
    }
    
    // Build available list - exclude completed units and the currently displayed psalm
    const available: number[] = [];
    for (let i = 1; i <= TOTAL_TEHILLIM_UNITS; i++) {
      // Skip if already completed in this cycle
      if (completedUnits.has(i)) continue;
      // Skip the currently displayed psalm (for "Find me another")
      if (excludePsalm && i === excludePsalm) continue;
      available.push(i);
    }
    
    if (available.length === 0) {
      // All units completed - if we excluded one, try returning any random one
      if (excludePsalm) {
        const allUnits = Array.from({ length: TOTAL_TEHILLIM_UNITS }, (_, i) => i + 1)
          .filter(i => i !== excludePsalm);
        return allUnits[Math.floor(Math.random() * allUnits.length)] || 1;
      }
      return 1;
    }
    
    // Return a random available tehillim id
    return available[Math.floor(Math.random() * available.length)];
  }

  async getTotalChainTehillimCompleted(): Promise<number> {
    // Get chain completions only (not individual tehillim from dailyStats)
    const chainResult = await db.select({ count: sql<number>`count(*)` })
      .from(tehillimChainReadings)
      .where(eq(tehillimChainReadings.status, 'completed'));
    const chainCount = Number(chainResult[0]?.count || 0);
    
    return chainCount;
  }

  async getTehillimGlobalStats(): Promise<{ totalRead: number; booksCompleted: number; uniqueReaders: number }> {
    // Get all daily stats to count tehillim from modalCompletions
    // This matches the Analytics page calculation exactly
    const allStats = await db.select().from(dailyStats);
    
    let totalRead = 0;
    
    for (const stats of allStats) {
      // Count tehillim from modalCompletions only (same as Analytics page)
      const completions = stats.modalCompletions as Record<string, number> || {};
      for (const [modalType, count] of Object.entries(completions)) {
        // Count the same types as Analytics page: global-tehillim-chain, tehillim-text, 
        // chain-tehillim, special-tehillim, and individual-tehillim-*
        if (
          modalType.startsWith('individual-tehillim-') ||
          modalType === 'individual-tehillim' ||
          modalType === 'chain-tehillim' ||
          modalType === 'global-tehillim-chain' ||
          modalType === 'tehillim-text' ||
          modalType === 'special-tehillim'
        ) {
          totalRead += count;
        }
      }
    }
    
    // Books completed (total / 150, rounded down)
    const booksCompleted = Math.floor(totalRead / 150);
    
    return { totalRead, booksCompleted, uniqueReaders: 0 };
  }

  async getActiveChainReadingForDevice(chainId: number, deviceId: string): Promise<number | null> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const readings = await db.select({ psalmNumber: tehillimChainReadings.psalmNumber })
      .from(tehillimChainReadings)
      .where(and(
        eq(tehillimChainReadings.chainId, chainId),
        eq(tehillimChainReadings.deviceId, deviceId),
        eq(tehillimChainReadings.status, 'reading'),
        gt(tehillimChainReadings.startedAt, tenMinutesAgo)
      ))
      .limit(1);
    return readings.length > 0 ? readings[0].psalmNumber : null;
  }

  async migrateTehillimNamesToChains(): Promise<{ migrated: number; skipped: number; errors: string[] }> {
    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    try {
      // Get all tehillim names
      const names = await db.select().from(tehillimNames);
      
      for (const name of names) {
        try {
          // Generate slug from name - use numeric ID for Hebrew names
          let slug: string;
          const isLatin = /^[a-zA-Z0-9\s-]+$/.test(name.hebrewName);
          if (isLatin) {
            // Convert to URL-friendly slug
            slug = name.hebrewName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .substring(0, 50);
          } else {
            // Use numeric ID for Hebrew/non-Latin names
            slug = `chain-${name.id}`;
          }
          
          // Check if chain with this slug already exists
          const existing = await db.select().from(tehillimChains).where(eq(tehillimChains.slug, slug)).limit(1);
          if (existing.length > 0) {
            skipped++;
            continue;
          }
          
          // Create the chain
          await db.insert(tehillimChains).values({
            name: name.hebrewName,
            reason: name.reasonEnglish || name.reason || 'Prayer',
            slug,
            creatorDeviceId: 'migrated-from-global',
            createdAt: name.dateAdded || new Date(),
          });
          
          migrated++;
        } catch (err) {
          errors.push(`Error migrating name ID ${name.id}: ${err}`);
        }
      }
    } catch (err) {
      errors.push(`Error fetching tehillim names: ${err}`);
    }
    
    return { migrated, skipped, errors };
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
    try {
      // Add timeout protection to prevent hangs
      const queryPromise = db.select().from(minchaPrayers).orderBy(minchaPrayers.orderIndex);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      );
      
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error fetching mincha prayers:', error);
      // Return empty array on timeout/error to prevent app crashes
      return [];
    }
  }

  async createMinchaPrayer(insertPrayer: InsertMinchaPrayer): Promise<MinchaPrayer> {
    const [prayer] = await db.insert(minchaPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Morning prayer methods
  async getMorningPrayers(): Promise<MorningPrayer[]> {
    try {
      // Add timeout protection to prevent hangs
      const queryPromise = db.select().from(morningPrayers).orderBy(morningPrayers.orderIndex);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      );
      
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error fetching morning prayers:', error);
      // Return empty array on timeout/error to prevent app crashes
      return [];
    }
  }

  async createMorningPrayer(insertPrayer: InsertMorningPrayer): Promise<MorningPrayer> {
    const [prayer] = await db.insert(morningPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Maariv methods
  async getMaarivPrayers(): Promise<MaarivPrayer[]> {
    try {
      // Add timeout protection to prevent hangs
      const queryPromise = db.select().from(maarivPrayers).orderBy(maarivPrayers.orderIndex);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      );
      
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error fetching maariv prayers:', error);
      // Return empty array on timeout/error to prevent app crashes
      return [];
    }
  }

  async createMaarivPrayer(insertPrayer: InsertMaarivPrayer): Promise<MaarivPrayer> {
    const [prayer] = await db.insert(maarivPrayers).values(insertPrayer).returning();
    return prayer;
  }

  // Brochas methods
  async getBrochas(): Promise<Brocha[]> {
    return await db.select().from(brochas).orderBy(brochas.orderIndex);
  }

  async getBrochasByType(isSpecial: boolean): Promise<Brocha[]> {
    return await db.select().from(brochas)
      .where(eq(brochas.specialOccasions, isSpecial))
      .orderBy(brochas.orderIndex);
  }

  async getBrochaById(id: number): Promise<Brocha | undefined> {
    const [brocha] = await db.select().from(brochas).where(eq(brochas.id, id));
    return brocha;
  }

  async createBrocha(insertBrocha: InsertBrocha): Promise<Brocha> {
    const [brocha] = await db.insert(brochas).values(insertBrocha).returning();
    return brocha;
  }

  // Sponsor methods
  async getSponsorByContentTypeAndDate(_contentType: string, date: string): Promise<Sponsor | undefined> {
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
      const [result] = await db.select().from(featuredContent)
        .where(and(
          lte(featuredContent.fromDate, date),
          gte(featuredContent.untilDate, date)
        ))
        .limit(1);
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

  // Today's Special methods
  async getTodaysSpecialByDate(date: string): Promise<TodaysSpecial | undefined> {
    try {
      const [result] = await db.select().from(todaysSpecial)
        .where(and(
          lte(todaysSpecial.fromDate, date),
          gte(todaysSpecial.untilDate, date)
        ))
        .limit(1);
      return result;
    } catch (error) {
      console.error('Failed to fetch today\'s special:', error);
      return undefined;
    }
  }

  async createTodaysSpecial(insertSpecial: InsertTodaysSpecial): Promise<TodaysSpecial> {
    const [special] = await db.insert(todaysSpecial).values(insertSpecial).returning();
    return special;
  }

  // Gift of Chatzos methods
  async getGiftOfChatzosByDayOfWeek(dayOfWeek: number): Promise<GiftOfChatzos | undefined> {
    try {
      const [result] = await db.select().from(giftOfChatzos)
        .where(eq(giftOfChatzos.dayOfWeek, dayOfWeek))
        .limit(1);
      return result;
    } catch (error) {
      console.error('Failed to fetch gift of chatzos:', error);
      return undefined;
    }
  }

  async createGiftOfChatzos(insertGift: InsertGiftOfChatzos): Promise<GiftOfChatzos> {
    const [gift] = await db.insert(giftOfChatzos).values(insertGift).returning();
    return gift;
  }

  async updateGiftOfChatzos(id: number, gift: Partial<InsertGiftOfChatzos>): Promise<GiftOfChatzos | undefined> {
    const [updated] = await db.update(giftOfChatzos).set(gift).where(eq(giftOfChatzos.id, id)).returning();
    return updated;
  }

  async getAllGiftOfChatzos(): Promise<GiftOfChatzos[]> {
    return await db.select().from(giftOfChatzos).orderBy(giftOfChatzos.dayOfWeek);
  }

  // Torah Challenge methods
  async getTorahChallengeByDate(date: string): Promise<TorahChallenge | undefined> {
    try {
      const [result] = await db.select().from(torahChallenges)
        .where(eq(torahChallenges.date, date))
        .limit(1);
      return result;
    } catch (error) {
      console.error('Failed to fetch torah challenge:', error);
      return undefined;
    }
  }

  async createTorahChallenge(insertChallenge: InsertTorahChallenge): Promise<TorahChallenge> {
    const [challenge] = await db.insert(torahChallenges).values(insertChallenge).returning();
    return challenge;
  }

  async updateTorahChallenge(id: number, challenge: Partial<InsertTorahChallenge>): Promise<TorahChallenge | undefined> {
    const [updated] = await db.update(torahChallenges).set(challenge).where(eq(torahChallenges.id, id)).returning();
    return updated;
  }

  async getAllTorahChallenges(): Promise<TorahChallenge[]> {
    return await db.select().from(torahChallenges).orderBy(desc(torahChallenges.date));
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
    // Find the maximum ID currently in the table
    const [maxIdResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${dailyRecipes.id}), 0)` })
      .from(dailyRecipes);
    
    const nextId = (maxIdResult?.maxId || 0) + 1;
    
    // Insert with explicit ID to avoid sequence issues
    const [recipe] = await db
      .insert(dailyRecipes)
      .values({ ...insertRecipe, id: nextId })
      .returning();
    return recipe;
  }

  async getAllDailyRecipes(): Promise<DailyRecipe[]> {
    const recipes = await db.select().from(dailyRecipes).orderBy(sql`${dailyRecipes.date} DESC`);
    return recipes;
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

  async getParshaVortsByDate(date: string): Promise<ParshaVort[]> {
    const vorts = await db
      .select()
      .from(parshaVorts)
      .where(and(
        lte(parshaVorts.fromDate, date),
        gte(parshaVorts.untilDate, date)
      ))
      .orderBy(parshaVorts.id);
    return vorts;
  }

  async createParshaVort(insertVort: InsertParshaVort): Promise<ParshaVort> {
    const [vort] = await db.insert(parshaVorts).values(insertVort).returning();
    return vort;
  }

  async getAllParshaVorts(): Promise<ParshaVort[]> {
    return await db.select().from(parshaVorts).orderBy(desc(parshaVorts.fromDate), desc(parshaVorts.id));
  }

  async getParshaVortById(id: number): Promise<ParshaVort | undefined> {
    const [vort] = await db.select().from(parshaVorts).where(eq(parshaVorts.id, id));
    return vort || undefined;
  }

  async updateParshaVort(id: number, updatedVort: Partial<InsertParshaVort>): Promise<ParshaVort | undefined> {
    // Filter out undefined values to prevent accidental nullification
    const cleanedData = Object.fromEntries(
      Object.entries(updatedVort).filter(([_, value]) => value !== undefined)
    );
    
    const [vort] = await db
      .update(parshaVorts)
      .set(cleanedData)
      .where(eq(parshaVorts.id, id))
      .returning();
    return vort || undefined;
  }

  async deleteParshaVort(id: number): Promise<boolean> {
    const result = await db.delete(parshaVorts).where(eq(parshaVorts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Torah Classes methods
  async getTorahClassByDate(date: string): Promise<TorahClass | undefined> {
    const [torahClass] = await db
      .select()
      .from(torahClasses)
      .where(and(
        lte(torahClasses.fromDate, date),
        gte(torahClasses.untilDate, date)
      ))
      .limit(1);
    return torahClass;
  }

  async getTorahClassesByDate(date: string): Promise<TorahClass[]> {
    const classes = await db
      .select()
      .from(torahClasses)
      .where(and(
        lte(torahClasses.fromDate, date),
        gte(torahClasses.untilDate, date)
      ))
      .orderBy(torahClasses.id);
    return classes;
  }

  async getAllTorahClasses(): Promise<TorahClass[]> {
    return await db.select().from(torahClasses).orderBy(desc(torahClasses.fromDate), desc(torahClasses.id));
  }

  async createTorahClass(insertClass: InsertTorahClass): Promise<TorahClass> {
    const [torahClass] = await db.insert(torahClasses).values(insertClass).returning();
    return torahClass;
  }

  async updateTorahClass(id: number, updatedClass: Partial<InsertTorahClass>): Promise<TorahClass | undefined> {
    const cleanedData = Object.fromEntries(
      Object.entries(updatedClass).filter(([_, value]) => value !== undefined)
    );
    
    const [torahClass] = await db
      .update(torahClasses)
      .set(cleanedData)
      .where(eq(torahClasses.id, id))
      .returning();
    return torahClass || undefined;
  }

  async deleteTorahClass(id: number): Promise<boolean> {
    const result = await db.delete(torahClasses).where(eq(torahClasses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getLifeClassesByDate(date: string): Promise<LifeClass[]> {
    const classes = await db
      .select()
      .from(lifeClasses)
      .where(and(
        lte(lifeClasses.fromDate, date),
        gte(lifeClasses.untilDate, date)
      ))
      .orderBy(lifeClasses.id);
    return classes;
  }

  async getAllLifeClasses(): Promise<LifeClass[]> {
    return await db.select().from(lifeClasses).orderBy(desc(lifeClasses.fromDate), desc(lifeClasses.id));
  }

  async createLifeClass(insertClass: InsertLifeClass): Promise<LifeClass> {
    const [lifeClass] = await db.insert(lifeClasses).values(insertClass).returning();
    return lifeClass;
  }

  async updateLifeClass(id: number, updatedClass: Partial<InsertLifeClass>): Promise<LifeClass | undefined> {
    const cleanedData = Object.fromEntries(
      Object.entries(updatedClass).filter(([_, value]) => value !== undefined)
    );
    
    const [lifeClass] = await db
      .update(lifeClasses)
      .set(cleanedData)
      .where(eq(lifeClasses.id, id))
      .returning();
    return lifeClass || undefined;
  }

  async deleteLifeClass(id: number): Promise<boolean> {
    const result = await db.delete(lifeClasses).where(eq(lifeClasses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Gems of Gratitude methods
  async getGemsOfGratitudeByDate(date: string): Promise<GemsOfGratitude | undefined> {
    const gems = await db
      .select()
      .from(gemsOfGratitude)
      .where(and(
        lte(gemsOfGratitude.fromDate, date),
        gte(gemsOfGratitude.untilDate, date)
      ))
      .orderBy(gemsOfGratitude.id);
    return gems[0];
  }

  async getAllGemsOfGratitude(): Promise<GemsOfGratitude[]> {
    return await db.select().from(gemsOfGratitude).orderBy(desc(gemsOfGratitude.fromDate), desc(gemsOfGratitude.id));
  }

  async createGemsOfGratitude(gem: InsertGemsOfGratitude): Promise<GemsOfGratitude> {
    const [created] = await db.insert(gemsOfGratitude).values(gem).returning();
    return created;
  }

  async updateGemsOfGratitude(id: number, gem: Partial<InsertGemsOfGratitude>): Promise<GemsOfGratitude | undefined> {
    const filteredGem = Object.fromEntries(
      Object.entries(gem).filter(([_, v]) => v !== undefined)
    ) as Partial<InsertGemsOfGratitude>;
    const [updated] = await db.update(gemsOfGratitude).set(filteredGem).where(eq(gemsOfGratitude.id, id)).returning();
    return updated;
  }

  async deleteGemsOfGratitude(id: number): Promise<boolean> {
    const result = await db.delete(gemsOfGratitude).where(eq(gemsOfGratitude.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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

  // Donation methods - Enhanced for new schema
  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [result] = await db
      .insert(donations)
      .values(donation)
      .returning();
    return result;
  }

  // Acts tracking methods - New for individual button completion tracking
  async createAct(act: InsertAct): Promise<Act> {
    const [result] = await db
      .insert(acts)
      .values(act)
      .returning();
    return result;
  }

  async getActByPaymentIntentId(paymentIntentId: string): Promise<Act | null> {
    const [result] = await db
      .select()
      .from(acts)
      .where(eq(acts.paymentIntentId, paymentIntentId))
      .limit(1);
    return result || null;
  }

  async getDonationByPaymentIntentId(stripePaymentIntentId: string) {
    const [result] = await db
      .select()
      .from(donations)
      .where(eq(donations.stripePaymentIntentId, stripePaymentIntentId))
      .limit(1);
    return result || null;
  }

  async getDonationBySessionId(stripeSessionId: string) {
    const [result] = await db
      .select()
      .from(donations)
      .where(eq(donations.stripeSessionId, stripeSessionId))
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

  async updateDonation(id: number, updates: Partial<InsertDonation>): Promise<Donation> {
    const [result] = await db
      .update(donations)
      .set(updates)
      .where(eq(donations.id, id))
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

  async getMeditationCategories(): Promise<{section: string; subtitle: string}[]> {
    const result = await db
      .selectDistinct({
        section: meditations.section,
        subtitle: meditations.subtitle,
      })
      .from(meditations);
    return result;
  }

  async getMeditationsBySection(section: string): Promise<Meditation[]> {
    return await db
      .select()
      .from(meditations)
      .where(eq(meditations.section, section))
      .orderBy(meditations.name);
  }

  async getAllMeditations(): Promise<Meditation[]> {
    return await db
      .select()
      .from(meditations)
      .orderBy(meditations.section, meditations.name);
  }

  async getMeditationById(id: number): Promise<Meditation | undefined> {
    const [meditation] = await db
      .select()
      .from(meditations)
      .where(eq(meditations.id, id))
      .limit(1);
    return meditation;
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

  async getActiveDiscountPromotions(userLocation?: string): Promise<DiscountPromotion[]> {
    try {
      const targetLocation = userLocation === "israel" ? "israel" : "worldwide";
      const now = new Date();
      
      // Get only promotions that match the exact user location
      const promotions = await db.select()
        .from(discountPromotions)
        .where(
          and(
            eq(discountPromotions.isActive, true),
            lte(discountPromotions.startDate, now),
            gte(discountPromotions.endDate, now),
            eq(discountPromotions.targetLocation, targetLocation)
          )
        )
        .orderBy(discountPromotions.id);
      
      return promotions;
    } catch (error) {
      console.error('Database error in getActiveDiscountPromotions:', error);
      return [];
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
    // Find the maximum ID currently in the table
    const [maxIdResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${tableInspirations.id}), 0)` })
      .from(tableInspirations);
    
    const nextId = (maxIdResult?.maxId || 0) + 1;
    
    // Insert with explicit ID to avoid sequence issues
    const [inspiration] = await db
      .insert(tableInspirations)
      .values({ ...insertInspiration, id: nextId })
      .returning();
    return inspiration;
  }

  async getAllTableInspirations(): Promise<TableInspiration[]> {
    return await db
      .select()
      .from(tableInspirations)
      .orderBy(tableInspirations.fromDate);
  }

  async updateTableInspiration(id: number, insertInspiration: InsertTableInspiration): Promise<TableInspiration | undefined> {
    const [inspiration] = await db
      .update(tableInspirations)
      .set(insertInspiration)
      .where(eq(tableInspirations.id, id))
      .returning();
    return inspiration;
  }

  async deleteTableInspiration(id: number): Promise<boolean> {
    const deletedRows = await db
      .delete(tableInspirations)
      .where(eq(tableInspirations.id, id))
      .returning({ id: tableInspirations.id });
    return deletedRows.length > 0;
  }

  // Marriage insights implementation
  async getMarriageInsightByDate(date: string): Promise<MarriageInsight | undefined> {
    const [insight] = await db
      .select()
      .from(marriageInsights)
      .where(eq(marriageInsights.date, date))
      .limit(1);
    return insight;
  }

  async createMarriageInsight(insertInsight: InsertMarriageInsight): Promise<MarriageInsight> {
    const [maxIdResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${marriageInsights.id}), 0)` })
      .from(marriageInsights);
    
    const nextId = (maxIdResult?.maxId || 0) + 1;
    
    const [insight] = await db
      .insert(marriageInsights)
      .values({ ...insertInsight, id: nextId })
      .returning();
    return insight;
  }

  async getAllMarriageInsights(): Promise<MarriageInsight[]> {
    return await db
      .select()
      .from(marriageInsights)
      .orderBy(marriageInsights.date);
  }

  async updateMarriageInsight(id: number, updateData: Partial<InsertMarriageInsight>): Promise<MarriageInsight | undefined> {
    const [insight] = await db
      .update(marriageInsights)
      .set(updateData)
      .where(eq(marriageInsights.id, id))
      .returning();
    return insight;
  }

  async deleteMarriageInsight(id: number): Promise<boolean> {
    const deletedRows = await db
      .delete(marriageInsights)
      .where(eq(marriageInsights.id, id))
      .returning({ id: marriageInsights.id });
    return deletedRows.length > 0;
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
  async trackEvent(event: InsertAnalyticsEvent & { idempotencyKey?: string; analyticsDate?: string }): Promise<AnalyticsEvent | null> {
    // Check for idempotency - skip if already exists
    if (event.idempotencyKey) {
      const [existing] = await db
        .select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.idempotencyKey, event.idempotencyKey))
        .limit(1);
      
      if (existing) {
        return existing; // Return existing event instead of creating duplicate
      }
    }
    
    // Use client-provided analyticsDate for accurate timezone handling
    // Fall back to server date if not provided (for backward compatibility)
    const eventDate = event.analyticsDate || formatDate(new Date());
    
    const [newEvent] = await db
      .insert(analyticsEvents)
      .values({
        eventType: event.eventType,
        eventData: event.eventData,
        sessionId: event.sessionId,
        idempotencyKey: event.idempotencyKey,
        analyticsDate: eventDate
      })
      .returning();
    
    // Update daily stats using the correct analytics date
    await this.recalculateDailyStats(eventDate);
    
    return newEvent;
  }
  
  async syncAnalyticsEvents(events: Array<{ eventType: string; eventData: Record<string, any>; sessionId: string; idempotencyKey: string; date?: string }>): Promise<{ synced: number }> {
    let syncedCount = 0;
    const datesToRecalculate = new Set<string>();
    
    for (const event of events) {
      // Check for idempotency - skip if already exists
      if (event.idempotencyKey) {
        const [existing] = await db
          .select()
          .from(analyticsEvents)
          .where(eq(analyticsEvents.idempotencyKey, event.idempotencyKey))
          .limit(1);
        
        if (existing) continue;
      }
      
      // Use client-provided date for accurate timezone handling
      const eventDate = event.date || formatDate(new Date());
      
      await db.insert(analyticsEvents).values({
        eventType: event.eventType,
        eventData: event.eventData,
        sessionId: event.sessionId,
        idempotencyKey: event.idempotencyKey,
        analyticsDate: eventDate // Store client-provided date
      });
      syncedCount++;
      
      // Track dates to recalculate (avoid recalculating same date multiple times)
      datesToRecalculate.add(eventDate);
    }
    
    // Recalculate stats for each affected date
    for (const date of Array.from(datesToRecalculate)) {
      await this.recalculateDailyStats(date);
    }
    
    return { synced: syncedCount };
  }

  // Efficient session tracking - only record unique sessions once per day
  async recordActiveSession(sessionId: string): Promise<void> {
    const today = formatDate(new Date());
    
    // Check if this session was already recorded today (server-side deduplication using module-level map)
    if (!recordedSessionsPerDay.has(today)) {
      recordedSessionsPerDay.set(today, new Set());
      // Clean up old dates to prevent memory leak
      const keysToDelete: string[] = [];
      recordedSessionsPerDay.forEach((_, key) => {
        if (key !== today) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => recordedSessionsPerDay.delete(key));
    }
    
    const todaySessions = recordedSessionsPerDay.get(today)!;
    if (todaySessions.has(sessionId)) {
      // Already recorded this session today, skip
      return;
    }
    
    // Mark this session as recorded
    todaySessions.add(sessionId);
    
    // Update daily stats to include this unique session
    const existing = await this.getDailyStats(today);
    
    if (existing) {
      // Increment unique users count by 1
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

  // Get all unique dates that have analytics events
  async getAllAnalyticsDates(): Promise<string[]> {
    const events = await db
      .selectDistinct({ date: sql<string>`DATE(${analyticsEvents.createdAt})` })
      .from(analyticsEvents)
      .orderBy(sql`DATE(${analyticsEvents.createdAt}) DESC`);
    
    return events.map(e => e.date).filter(Boolean);
  }

  // Recalculate all historical analytics
  async recalculateAllHistoricalStats(): Promise<{ updated: number; dates: string[] }> {
    const dates = await this.getAllAnalyticsDates();
    let updated = 0;
    
    for (const date of dates) {
      try {
        await this.recalculateDailyStats(date);
        updated++;
        console.log(`Recalculated stats for ${date}`);
      } catch (error) {
        console.error(`Failed to recalculate stats for ${date}:`, error);
      }
    }
    
    return { updated, dates };
  }

  async recalculateDailyStats(date: string): Promise<DailyStats> {
    // Query events by their stored analyticsDate field
    // This field contains the client-provided date (YYYY-MM-DD) that correctly accounts for 
    // their local 2 AM boundary, ensuring accurate timezone-aware aggregation
    // 
    // For legacy events without analyticsDate, we fall back to the old createdAt-based query
    
    // First, get events with the matching analyticsDate
    const eventsWithDate = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.analyticsDate, date));
    
    // Also get legacy events (no analyticsDate) from the same UTC date range for backward compatibility
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    
    const legacyEvents = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          isNull(analyticsEvents.analyticsDate), // Only events without analyticsDate
          gte(analyticsEvents.createdAt, start),
          lt(analyticsEvents.createdAt, end)
        )
      );
    
    // Combine both sets of events
    const todayEvents = [...eventsWithDate, ...legacyEvents];
    
    // Count unique users (by session ID)
    // const uniqueSessions = new Set(todayEvents.map(e => e.sessionId).filter(Boolean));
    // Upsert stats with recalculated values

    const existing = await this.getDailyStats(date);

    // Count event types (no more page_view tracking)
    const pageViews = 0; // No longer tracking page views
    
    // Count direct tehillim_complete events (global chain completions)
    const directTehillimCompleted = todayEvents.filter(e => 
      e.eventType === 'tehillim_complete'
    ).length;
    
    // Count modal-based tehillim completions (individual and global modal completions)
    const globalTehillimCompleted = todayEvents.filter(e => 
      e.eventType === 'modal_complete' && (e.eventData as any)?.modalType?.startsWith('global_')
    ).length;
    const regularTehillimCompleted = todayEvents.filter(e => 
      e.eventType === 'modal_complete' && (e.eventData as any)?.modalType?.startsWith('individual_')
    ).length;
    
    // Total Tehillim completed = direct + modal-based
    const tehillimCompleted = directTehillimCompleted + globalTehillimCompleted + regularTehillimCompleted;
    // IMPORTANT: Only count names prayed from global chain (not individual Tehillim)
    const namesProcessed = todayEvents.filter(e => 
      e.eventType === 'name_prayed' && e.sessionId === 'global-chain'
    ).length;
    const booksCompleted = todayEvents.filter(e => e.eventType === 'tehillim_book_complete').length;
    const tzedakaActs = todayEvents.filter(e => e.eventType === 'tzedaka_completion');
    const meditationsCompleted = todayEvents.filter(e => e.eventType === 'meditation_complete').length;
    
    // Count modal completions by type
    const modalCompletions: Record<string, number> = {};
    todayEvents
      .filter(e => e.eventType === 'modal_complete')
      .forEach(e => {
        const modalType = (e.eventData as any)?.modalType || 'unknown';
        if(modalType != 'unknown'){
          modalCompletions[modalType] = (modalCompletions[modalType] || 0) + 1;
        }
      });
    
    // Count feature usage events
    todayEvents
      .filter(e => e.eventType === 'feature_usage')
      .forEach(e => {
        const featureName = (e.eventData as any)?.feature || 'unknown';
        if(featureName != 'unknown'){
          // Use 'feature:' prefix to distinguish from modal completions
          modalCompletions[`feature:${featureName}`] = (modalCompletions[`feature:${featureName}`] || 0) + 1;
        }
      });

    // IMPORTANT: Fix global chain analytics counting
    // The problem: older global chain completions only have tehillim_complete events, 
    // newer ones have both tehillim_complete AND modal_complete events.
    // Solution: Count all global chain completions (tehillim_complete from global-chain) as the true count
    const globalChainCompletions = todayEvents.filter(e => 
      e.eventType === 'tehillim_complete' && 
      e.sessionId === 'global-chain' &&
      // Exclude test sessions
      !e.sessionId?.startsWith('test-') &&
      !e.sessionId?.startsWith('final-')
    ).length;
    
    // Set the correct count (don't add, replace to avoid double-counting)
    if (globalChainCompletions > 0) {
      modalCompletions['global-tehillim-chain'] = globalChainCompletions;
    }

    // Add gave elsewhere tzedakah (doesn't have a modal)
    // Count tzedakah completions by type
    let gaveElsewhereCompletions: number = 0;
    tzedakaActs
    .forEach(e => {
        const buttonType = (e.eventData as any)?.buttonType || 'unknown';
        if (buttonType.startsWith('gave_elsewhere')) {
          gaveElsewhereCompletions += 1;
        }
      });

    if (existing) {

      const [updated] = await db
        .update(dailyStats)
        .set({
          gaveElsewhereCount: gaveElsewhereCompletions, 
          pageViews,
          tehillimCompleted,
          namesProcessed,
          booksCompleted,
          tzedakaActs: tzedakaActs.length,
          meditationsCompleted,
          totalActs: this.calculateTotalActs(modalCompletions, gaveElsewhereCompletions, namesProcessed, meditationsCompleted),
          modalCompletions,
          updatedAt: new Date(),
        })
        .where(eq(dailyStats.date, date))
        .returning();
      return updated;
    } else {
      const [newStats] = await db
        .insert(dailyStats)
        .values({
          date,
          pageViews,
          tehillimCompleted,
          namesProcessed,
          booksCompleted,
          tzedakaActs: tzedakaActs.length,
          meditationsCompleted,
          totalActs: this.calculateTotalActs(modalCompletions, gaveElsewhereCompletions, namesProcessed, meditationsCompleted),
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
  private calculateTotalActs(modalCompletions: Record<string, number>, gaveElsewhereCompletions: number = 0, namesProcessed: number = 0, meditationsCompleted: number = 0): number {
    const torahActs = ['torah', 'chizuk', 'emuna', 'halacha', 'featured', 'parsha-vort', 'pirkei-avot', 'gems-of-gratitude', 'torah-class', 'torah-challenge'];
    const tefillaActs = ['tefilla', 'morning-brochas', 'mincha', 'maariv', 'shacharis', 'nishmas-campaign', 'birkat-hamazon', 'al-hamichiya', 'special-tehillim', 'global-tehillim-chain', 'tehillim-text', 'chain-tehillim'];
    const tzedakaActs = ['tzedaka', 'donate'];
    const lifeActs = ['life-class', 'marriage-insights', 'recipe', 'gift-of-chatzos'];
    
    let totalActs = 0;
    
    // Count modal acts
    for (const [modalType, count] of Object.entries(modalCompletions || {})) {
      if (torahActs.includes(modalType) || tefillaActs.includes(modalType) || tzedakaActs.includes(modalType) || lifeActs.includes(modalType)) {
        totalActs += count;
      }
      // Also count individual tehillim, chain tehillim (with psalm number), womens prayers, and individual brochas
      if (
        modalType.startsWith('individual-tehillim-') ||
        modalType.startsWith('chain-tehillim-') ||  // Personal chain tehillim completions
        modalType.startsWith('womens-prayer-') ||
        modalType.startsWith('brocha-')  // Count individual brochas like Asher Yatzar
      ) {
        totalActs += count;
      }
    }
    
    // Add names processed as acts (this is the 2nd modal counting for global tehillim)
    totalActs += namesProcessed;

    // These don't have a modal, so we count separately
    totalActs += gaveElsewhereCompletions;

    // Add meditation completions to total acts
    totalActs += meditationsCompleted;

    return totalActs;

  }

  async getMonthlyStats(year: number, month: number): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
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
      let totalTzedakaActs = 0;
      let totalActs = 0;
      let totalMeditationsCompleted = 0;
      const totalModalCompletions: Record<string, number> = {};
      
      for (const stats of monthlyStats) {
        totalUsers += stats.uniqueUsers || 0;
        totalPageViews += stats.pageViews || 0;
        totalTehillimCompleted += stats.tehillimCompleted || 0;
        totalNamesProcessed += stats.namesProcessed || 0;
        totalBooksCompleted += stats.booksCompleted || 0;
        totalTzedakaActs += stats.tzedakaActs || 0;
        totalActs += stats.totalActs || 0;
        totalMeditationsCompleted += stats.meditationsCompleted || 0;
        
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
        totalTzedakaActs,
        totalActs,
        totalMeditationsCompleted,
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
        totalTzedakaActs: 0,
        totalActs: 0,
        totalMeditationsCompleted: 0,
        totalModalCompletions: {}
      };
    }
  }

  async getWeeklyStats(startDate: string): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
  }> {
    try {
      // Week runs from Sunday 2 AM through the following Sunday at 1:59 AM (7 full days)
      // Start date is already the Sunday analytics date (accounts for 2 AM boundary)
      // End date is 6 days later, which gives us Sun -> Mon -> Tue -> Wed -> Thu -> Fri -> Sat
      // But since analytics days run 2 AM to 1:59 AM, Saturday's day includes Sunday until 1:59 AM
      // So we actually get 7 full days: Sun 2AM through the next Sun 1:59 AM
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // 6 days later (inclusive of start day = 7 days total)
      const endDate = end.toISOString().split('T')[0];
      
      const weeklyStats = await db
        .select()
        .from(dailyStats)
        .where(
          and(
            gte(dailyStats.date, startDate),
            lte(dailyStats.date, endDate)
          )
        );
      
      // Aggregate weekly totals
      let totalUsers = 0;
      let totalPageViews = 0;
      let totalTehillimCompleted = 0;
      let totalNamesProcessed = 0;
      let totalBooksCompleted = 0;
      let totalTzedakaActs = 0;
      let totalActs = 0;
      let totalMeditationsCompleted = 0;
      const totalModalCompletions: Record<string, number> = {};
      
      for (const stats of weeklyStats) {
        totalUsers += stats.uniqueUsers || 0;
        totalPageViews += stats.pageViews || 0;
        totalTehillimCompleted += stats.tehillimCompleted || 0;
        totalNamesProcessed += stats.namesProcessed || 0;
        totalBooksCompleted += stats.booksCompleted || 0;
        totalTzedakaActs += stats.tzedakaActs || 0;
        totalActs += stats.totalActs || 0;
        totalMeditationsCompleted += stats.meditationsCompleted || 0;
        
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
        totalTzedakaActs,
        totalActs,
        totalMeditationsCompleted,
        totalModalCompletions
      };
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      // Return empty stats if error occurs
      return {
        totalUsers: 0,
        totalPageViews: 0,
        totalTehillimCompleted: 0,
        totalNamesProcessed: 0,
        totalBooksCompleted: 0,
        totalTzedakaActs: 0,
        totalActs: 0,
        totalMeditationsCompleted: 0,
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
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
  }> {
    // Use SQL aggregation for speed - avoid fetching all rows
    const [aggregated] = await db
      .select({
        totalUsers: sql<number>`COALESCE(SUM(${dailyStats.uniqueUsers}), 0)`,
        totalPageViews: sql<number>`COALESCE(SUM(${dailyStats.pageViews}), 0)`,
        totalTehillimCompleted: sql<number>`COALESCE(SUM(${dailyStats.tehillimCompleted}), 0)`,
        totalNamesProcessed: sql<number>`COALESCE(SUM(${dailyStats.namesProcessed}), 0)`,
        totalBooksCompleted: sql<number>`COALESCE(SUM(${dailyStats.booksCompleted}), 0)`,
        totalTzedakaActs: sql<number>`COALESCE(SUM(${dailyStats.tzedakaActs}), 0)`,
        totalActs: sql<number>`COALESCE(SUM(${dailyStats.totalActs}), 0)`,
        totalMeditationsCompleted: sql<number>`COALESCE(SUM(${dailyStats.meditationsCompleted}), 0)`,
      })
      .from(dailyStats);
    
    // For modal completions, we still need to aggregate JSON - fetch only that column
    const modalRows = await db
      .select({ modalCompletions: dailyStats.modalCompletions })
      .from(dailyStats);
    
    const totalModalCompletions: Record<string, number> = {};
    for (const row of modalRows) {
      const completions = row.modalCompletions as Record<string, number> || {};
      for (const [modalType, count] of Object.entries(completions)) {
        totalModalCompletions[modalType] = (totalModalCompletions[modalType] || 0) + count;
      }
    }
    
    return {
      totalUsers: Number(aggregated?.totalUsers) || 0,
      totalPageViews: Number(aggregated?.totalPageViews) || 0,
      totalTehillimCompleted: Number(aggregated?.totalTehillimCompleted) || 0,
      totalNamesProcessed: Number(aggregated?.totalNamesProcessed) || 0,
      totalBooksCompleted: Number(aggregated?.totalBooksCompleted) || 0,
      totalTzedakaActs: Number(aggregated?.totalTzedakaActs) || 0,
      totalActs: Number(aggregated?.totalActs) || 0,
      totalMeditationsCompleted: Number(aggregated?.totalMeditationsCompleted) || 0,
      totalModalCompletions
    };
  }

  async getDateRangeStats(startDate: string, endDate: string): Promise<{
    totalUsers: number;
    totalPageViews: number;
    totalTehillimCompleted: number;
    totalNamesProcessed: number;
    totalBooksCompleted: number;
    totalTzedakaActs: number;
    totalActs: number;
    totalMeditationsCompleted: number;
    totalModalCompletions: Record<string, number>;
    moneyRaised: number;
    activeCampaignTotal: number;
    putACoinTotal: number;
    sponsorADayTotal: number;
    gaveElsewhereCount: number;
  }> {
    try {
      const rangeStats = await db
        .select()
        .from(dailyStats)
        .where(
          and(
            gte(dailyStats.date, startDate),
            lte(dailyStats.date, endDate)
          )
        );
      
      // Aggregate totals across the date range
      let totalUsers = 0;
      let totalPageViews = 0;
      let totalTehillimCompleted = 0;
      let totalNamesProcessed = 0;
      let totalBooksCompleted = 0;
      let totalTzedakaActs = 0;
      let totalActs = 0;
      let totalMeditationsCompleted = 0;
      let moneyRaised = 0;
      let activeCampaignTotal = 0;
      let putACoinTotal = 0;
      let sponsorADayTotal = 0;
      let gaveElsewhereCount = 0;
      const totalModalCompletions: Record<string, number> = {};
      
      for (const stats of rangeStats) {
        totalUsers += stats.uniqueUsers || 0;
        totalPageViews += stats.pageViews || 0;
        totalTehillimCompleted += stats.tehillimCompleted || 0;
        totalNamesProcessed += stats.namesProcessed || 0;
        totalBooksCompleted += stats.booksCompleted || 0;
        totalTzedakaActs += stats.tzedakaActs || 0;
        totalActs += stats.totalActs || 0;
        totalMeditationsCompleted += stats.meditationsCompleted || 0;
        moneyRaised += stats.moneyRaised || 0;
        activeCampaignTotal += stats.activeCampaignTotal || 0;
        putACoinTotal += stats.putACoinTotal || 0;
        sponsorADayTotal += stats.sponsorADayTotal || 0;
        gaveElsewhereCount += stats.gaveElsewhereCount || 0;
        
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
        totalTzedakaActs,
        totalActs,
        totalMeditationsCompleted,
        totalModalCompletions,
        moneyRaised,
        activeCampaignTotal,
        putACoinTotal,
        sponsorADayTotal,
        gaveElsewhereCount
      };
    } catch (error) {
      console.error('Error fetching date range stats:', error);
      return {
        totalUsers: 0,
        totalPageViews: 0,
        totalTehillimCompleted: 0,
        totalNamesProcessed: 0,
        totalBooksCompleted: 0,
        totalTzedakaActs: 0,
        totalActs: 0,
        totalMeditationsCompleted: 0,
        totalModalCompletions: {},
        moneyRaised: 0,
        activeCampaignTotal: 0,
        putACoinTotal: 0,
        sponsorADayTotal: 0,
        gaveElsewhereCount: 0
      };
    }
  }

  async getComparisonStats(period: 'week' | 'month'): Promise<{
    current: {
      totalUsers: number;
      totalActs: number;
      totalTehillimCompleted: number;
      totalNamesProcessed: number;
      totalBooksCompleted: number;
      totalTzedakaActs: number;
      totalMeditationsCompleted: number;
      moneyRaised: number;
      activeCampaignTotal: number;
      putACoinTotal: number;
      sponsorADayTotal: number;
      totalModalCompletions: Record<string, number>;
    };
    previous: {
      totalUsers: number;
      totalActs: number;
      totalTehillimCompleted: number;
      totalNamesProcessed: number;
      totalBooksCompleted: number;
      totalTzedakaActs: number;
      totalMeditationsCompleted: number;
      moneyRaised: number;
      activeCampaignTotal: number;
      putACoinTotal: number;
      sponsorADayTotal: number;
      totalModalCompletions: Record<string, number>;
    };
    changes: {
      users: number;
      acts: number;
      tehillim: number;
      names: number;
      books: number;
      tzedaka: number;
      meditations: number;
      moneyRaised: number;
    };
  }> {
    const now = new Date();
    let currentStart: string, currentEnd: string, previousStart: string, previousEnd: string;

    if (period === 'week') {
      // Current week: most recent Sunday to today
      const dayOfWeek = now.getDay();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(currentWeekStart.getDate() - dayOfWeek);
      currentStart = currentWeekStart.toISOString().split('T')[0];
      currentEnd = now.toISOString().split('T')[0];

      // Previous week: 7 days before current week start
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(currentWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
      previousStart = previousWeekStart.toISOString().split('T')[0];
      previousEnd = previousWeekEnd.toISOString().split('T')[0];
    } else {
      // Current month
      currentStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
      currentEnd = now.toISOString().split('T')[0];

      // Previous month
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      previousStart = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-01`;
      const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      previousEnd = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${lastDayPrevMonth}`;
    }

    const currentStats = await this.getDateRangeStats(currentStart, currentEnd);
    const previousStats = await this.getDateRangeStats(previousStart, previousEnd);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: {
        totalUsers: currentStats.totalUsers,
        totalActs: currentStats.totalActs,
        totalTehillimCompleted: currentStats.totalTehillimCompleted,
        totalNamesProcessed: currentStats.totalNamesProcessed,
        totalBooksCompleted: currentStats.totalBooksCompleted,
        totalTzedakaActs: currentStats.totalTzedakaActs,
        totalMeditationsCompleted: currentStats.totalMeditationsCompleted,
        moneyRaised: currentStats.moneyRaised,
        activeCampaignTotal: currentStats.activeCampaignTotal,
        putACoinTotal: currentStats.putACoinTotal,
        sponsorADayTotal: currentStats.sponsorADayTotal,
        totalModalCompletions: currentStats.totalModalCompletions
      },
      previous: {
        totalUsers: previousStats.totalUsers,
        totalActs: previousStats.totalActs,
        totalTehillimCompleted: previousStats.totalTehillimCompleted,
        totalNamesProcessed: previousStats.totalNamesProcessed,
        totalBooksCompleted: previousStats.totalBooksCompleted,
        totalTzedakaActs: previousStats.totalTzedakaActs,
        totalMeditationsCompleted: previousStats.totalMeditationsCompleted,
        moneyRaised: previousStats.moneyRaised,
        activeCampaignTotal: previousStats.activeCampaignTotal,
        putACoinTotal: previousStats.putACoinTotal,
        sponsorADayTotal: previousStats.sponsorADayTotal,
        totalModalCompletions: previousStats.totalModalCompletions
      },
      changes: {
        users: calculateChange(currentStats.totalUsers, previousStats.totalUsers),
        acts: calculateChange(currentStats.totalActs, previousStats.totalActs),
        tehillim: calculateChange(currentStats.totalTehillimCompleted, previousStats.totalTehillimCompleted),
        names: calculateChange(currentStats.totalNamesProcessed, previousStats.totalNamesProcessed),
        books: calculateChange(currentStats.totalBooksCompleted, previousStats.totalBooksCompleted),
        tzedaka: calculateChange(currentStats.totalTzedakaActs, previousStats.totalTzedakaActs),
        meditations: calculateChange(currentStats.totalMeditationsCompleted, previousStats.totalMeditationsCompleted),
        moneyRaised: calculateChange(currentStats.moneyRaised, previousStats.moneyRaised)
      }
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
    } else if (period === 'week') {
      // Current week (Sunday 2 AM to following Sunday 1:59 AM)
      const hours = now.getHours();
      const adjustedDate = new Date(now);
      
      // Adjust for 2 AM boundary - if before 2 AM, use previous day
      if (hours < 2) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
      }
      
      // Find the most recent Sunday (after 2 AM adjustment)
      const dayOfWeek = adjustedDate.getDay();
      const weekStart = new Date(adjustedDate);
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      weekStart.setHours(2, 0, 0, 0); // Start at 2 AM on Sunday
      
      // Week ends 7 days later at 1:59:59 AM (just before next Sunday 2 AM)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7); // Next Sunday
      weekEnd.setHours(1, 59, 59, 999); // 1:59:59 AM
      
      dateFilter = and(
        gte(donations.createdAt, weekStart),
        lte(donations.createdAt, weekEnd)
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
    } else if (period === 'week') {
      // Current week (Sunday 2 AM to following Sunday 1:59 AM)
      const hours = now.getHours();
      const adjustedDate = new Date(now);
      
      // Adjust for 2 AM boundary - if before 2 AM, use previous analytics day
      if (hours < 2) {
        adjustedDate.setDate(adjustedDate.getDate() - 1);
      }
      
      // Find the most recent Sunday (after 2 AM adjustment)
      const dayOfWeek = adjustedDate.getDay();
      const weekStart = new Date(adjustedDate);
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      const weekStartStr = formatDate(weekStart); // Use local date formatting
      
      // Week includes 7 analytics days: the start date + 6 more days
      // This gives us Sunday through Saturday in analytics terms
      // But since each analytics day runs 2 AM to 1:59 AM, Saturday's day captures Sunday until 1:59 AM
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = formatDate(weekEnd);
      
      // Get all sponsors for this week (using local date comparison)
      const allActiveSponsors = await db.select().from(sponsors).where(eq(sponsors.isActive, true));
      const weekSponsors = allActiveSponsors.filter(sponsor => 
        sponsor.sponsorshipDate >= weekStartStr && sponsor.sponsorshipDate <= weekEndStr
      );
      
      // Return early with week-specific sponsor count
      const totalDaysSponsored = weekSponsors.length;
      
      const successfulDonations = await db
        .select()
        .from(donations)
        .where(and(
          eq(donations.status, 'succeeded'),
          dateFilter!
        ));
      
      const totalDonations = successfulDonations.length;
      const totalRaised = successfulDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0) / 100;
      
      return {
        totalDaysSponsored,
        totalCampaigns: totalDonations,
        totalRaised
      };
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
      
      // FIX: Count all successful donations as "Donations" (renamed from totalCampaigns for clarity)
      const totalDonations = successfulDonations.length;
      const totalRaised = successfulDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0) / 100;
      
      return {
        totalDaysSponsored,
        totalCampaigns: totalDonations, // Using totalCampaigns field to mean total donations
        totalRaised
      };
    } else {
      // All time - original logic
      const successfulDonations = await donationQuery;
      const totalDonations = successfulDonations.length;
      const totalRaised = successfulDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0) / 100;
      
      return {
        totalDaysSponsored,
        totalCampaigns: totalDonations, // Using totalCampaigns field to mean total donations
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
    // Find the maximum ID currently in the table
    const [maxIdResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${messages.id}), 0)` })
      .from(messages);
    
    const nextId = (maxIdResult?.maxId || 0) + 1;
    
    // Insert with explicit ID to avoid sequence issues
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, id: nextId })
      .returning();
    return newMessage;
  }

  async getAllMessages(): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(messages.date);
  }

  async getUpcomingMessages(): Promise<Message[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(messages)
      .where(gte(messages.date, today))
      .orderBy(messages.date);
  }

  async updateMessage(id: number, messageData: Partial<InsertMessage>): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ ...messageData, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db
      .delete(messages)
      .where(eq(messages.id, id));
  }
  
  async incrementMessageLike(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ likes: sql`${messages.likes} + 1` })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async incrementMessageDislike(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ dislikes: sql`${messages.dislikes} + 1` })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async decrementMessageLike(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ likes: sql`GREATEST(${messages.likes} - 1, 0)` })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async decrementMessageDislike(id: number): Promise<Message> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ dislikes: sql`GREATEST(${messages.dislikes} - 1, 0)` })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async pinMessage(id: number): Promise<Message> {
    // First unpin all messages
    await db.update(messages).set({ isPinned: false });
    // Then pin the specified message
    const [pinnedMessage] = await db
      .update(messages)
      .set({ isPinned: true })
      .where(eq(messages.id, id))
      .returning();
    return pinnedMessage;
  }
  
  async unpinMessage(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ isPinned: false })
      .where(eq(messages.id, id));
  }
  
  // Scheduled Notification methods
  async getAllScheduledNotifications(): Promise<ScheduledNotification[]> {
    return await db
      .select()
      .from(scheduledNotifications)
      .orderBy(scheduledNotifications.scheduledDate, scheduledNotifications.scheduledTime);
  }

  async getScheduledNotificationById(id: number): Promise<ScheduledNotification | undefined> {
    const [notification] = await db
      .select()
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.id, id))
      .limit(1);
    return notification;
  }

  async getUpcomingScheduledNotifications(): Promise<ScheduledNotification[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(scheduledNotifications)
      .where(gte(scheduledNotifications.scheduledDate, today))
      .orderBy(scheduledNotifications.scheduledDate, scheduledNotifications.scheduledTime);
  }

  async getPendingScheduledNotifications(): Promise<ScheduledNotification[]> {
    return await db
      .select()
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.sent, false))
      .orderBy(scheduledNotifications.scheduledDate, scheduledNotifications.scheduledTime);
  }

  async createScheduledNotification(notification: InsertScheduledNotification): Promise<ScheduledNotification> {
    const [newNotification] = await db
      .insert(scheduledNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async updateScheduledNotification(id: number, notificationData: Partial<InsertScheduledNotification>): Promise<ScheduledNotification> {
    const [updatedNotification] = await db
      .update(scheduledNotifications)
      .set({ ...notificationData, updatedAt: new Date() })
      .where(eq(scheduledNotifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteScheduledNotification(id: number): Promise<void> {
    await db
      .delete(scheduledNotifications)
      .where(eq(scheduledNotifications.id, id));
  }

  async markScheduledNotificationAsSent(id: number): Promise<void> {
    await db
      .update(scheduledNotifications)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(scheduledNotifications.id, id));
  }
  
  // Push notification methods
  async subscribeToPush(subscription: InsertPushSubscription): Promise<PushSubscription> {
    // Upsert - if endpoint exists, update it, otherwise insert new
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          subscribed: true,
          updatedAt: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
        .returning();
      return updated;
    } else {
      const [newSub] = await db
        .insert(pushSubscriptions)
        .values(subscription)
        .returning();
      return newSub;
    }
  }
  
  async unsubscribeFromPush(endpoint: string): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set({ subscribed: false, updatedAt: new Date() })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }
  
  async getActiveSubscriptions(): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.subscribed, true));
  }
  
  async createNotification(notification: InsertPushNotification): Promise<PushNotification> {
    // Find the maximum ID currently in the table
    const [maxIdResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${pushNotifications.id}), 0)` })
      .from(pushNotifications);
    
    const nextId = (maxIdResult?.maxId || 0) + 1;
    
    // Insert with explicit ID to avoid sequence issues
    const [newNotification] = await db
      .insert(pushNotifications)
      .values({ ...notification, id: nextId })
      .returning();
    return newNotification;
  }
  
  async getNotificationHistory(limit: number = 50): Promise<PushNotification[]> {
    return await db
      .select()
      .from(pushNotifications)
      .orderBy(sql`${pushNotifications.sentAt} DESC`)
      .limit(limit);
  }
  
  async updateNotificationStats(id: number, successCount: number, failureCount: number): Promise<void> {
    await db
      .update(pushNotifications)
      .set({
        successCount: successCount,
        failureCount: failureCount,
        sentCount: successCount + failureCount
      })
      .where(eq(pushNotifications.id, id));
  }
  
  // Subscription validation methods
  async markSubscriptionValid(endpoint: string): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set({
        lastValidatedAt: new Date(),
        validationFailures: 0,
        lastErrorCode: null,
        lastErrorMessage: null,
        updatedAt: new Date()
      })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }
  
  async markSubscriptionInvalid(endpoint: string, errorCode?: number, errorMessage?: string): Promise<void> {
    // Increment failure count
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    
    if (!subscription) return;
    
    const newFailureCount = (subscription.validationFailures || 0) + 1;
    
    // If 3 consecutive failures, mark as unsubscribed
    await db
      .update(pushSubscriptions)
      .set({
        validationFailures: newFailureCount,
        lastErrorCode: errorCode || null,
        lastErrorMessage: errorMessage || null,
        subscribed: newFailureCount < 3, // Unsubscribe after 3 failures
        updatedAt: new Date()
      })
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }
  
  async getSubscriptionsNeedingValidation(hoursThreshold: number = 24): Promise<PushSubscription[]> {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);
    
    return await db
      .select()
      .from(pushSubscriptions)
      .where(
        sql`${pushSubscriptions.subscribed} = true AND (
          ${pushSubscriptions.lastValidatedAt} IS NULL OR 
          ${pushSubscriptions.lastValidatedAt} < ${thresholdDate}
        )`
      );
  }
  
  async getAllSubscriptions(): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .orderBy(sql`${pushSubscriptions.createdAt} DESC`);
  }
  
  // User Mitzvah Progress methods
  async getUserMitzvahProgress(userId: string): Promise<UserMitzvahProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userMitzvahProgress)
      .where(eq(userMitzvahProgress.userId, userId))
      .limit(1);
    return progress || undefined;
  }
  
  async upsertUserMitzvahProgress(
    userId: string, 
    modalCompletions: Record<string, any>, 
    tzedakaCompletions: Record<string, any>
  ): Promise<UserMitzvahProgress> {
    const existing = await this.getUserMitzvahProgress(userId);
    
    if (existing) {
      // Merge incoming data with existing cloud data (preserve history, take max values)
      const existingModals = (existing.modalCompletions || {}) as Record<string, any>;
      const existingTzedaka = (existing.tzedakaCompletions || {}) as Record<string, any>;
      
      // Merge modal completions - preserve all dates, take max for repeatables
      const mergedModals: Record<string, any> = { ...existingModals };
      for (const [date, data] of Object.entries(modalCompletions)) {
        if (!mergedModals[date]) {
          mergedModals[date] = data;
        } else {
          // Merge singles (union)
          const existingSingles = new Set(mergedModals[date].singles || []);
          (data.singles || []).forEach((s: string) => existingSingles.add(s));
          
          // Merge repeatables (max values)
          const mergedRepeatables = { ...mergedModals[date].repeatables };
          for (const [modalId, count] of Object.entries(data.repeatables || {})) {
            mergedRepeatables[modalId] = Math.max(mergedRepeatables[modalId] || 0, count as number);
          }
          
          mergedModals[date] = {
            singles: Array.from(existingSingles),
            repeatables: mergedRepeatables
          };
        }
      }
      
      // Merge tzedaka completions - preserve all dates, take max values
      const mergedTzedaka: Record<string, any> = { ...existingTzedaka };
      for (const [date, data] of Object.entries(tzedakaCompletions)) {
        if (!mergedTzedaka[date]) {
          mergedTzedaka[date] = data;
        } else {
          for (const [key, count] of Object.entries(data as Record<string, number>)) {
            mergedTzedaka[date][key] = Math.max(mergedTzedaka[date][key] || 0, count);
          }
        }
      }
      
      // Update existing record with merged data
      const [updated] = await db
        .update(userMitzvahProgress)
        .set({
          modalCompletions: mergedModals,
          tzedakaCompletions: mergedTzedaka,
          updatedAt: new Date(),
          version: existing.version + 1
        })
        .where(eq(userMitzvahProgress.userId, userId))
        .returning();
      return updated;
    } else {
      // Insert new record
      const [created] = await db
        .insert(userMitzvahProgress)
        .values({
          userId,
          modalCompletions: modalCompletions,
          tzedakaCompletions: tzedakaCompletions,
          version: 1
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();