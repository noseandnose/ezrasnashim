import { 
  calendarEvents, shopItems, 
  tehillimNames, globalTehillimProgress, minchaPrayers, sponsors, nishmasText,
  dailyHalacha, dailyMussar, dailyChizuk, loshonHorah,
  shabbatRecipes, parshaVorts, campaigns, inspirationalQuotes, womensPrayers,
  type CalendarEvent, type InsertCalendarEvent,
  type ShopItem, type InsertShopItem, type TehillimName, type InsertTehillimName,
  type GlobalTehillimProgress, type MinchaPrayer, type InsertMinchaPrayer,
  type Sponsor, type InsertSponsor, type NishmasText, type InsertNishmasText,
  type DailyHalacha, type InsertDailyHalacha,
  type DailyMussar, type InsertDailyMussar,
  type DailyChizuk, type InsertDailyChizuk,
  type LoshonHorah, type InsertLoshonHorah,
  type ShabbatRecipe, type InsertShabbatRecipe,
  type ParshaVort, type InsertParshaVort,
  type Campaign, type InsertCampaign,
  type InspirationalQuote, type InsertInspirationalQuote,
  type WomensPrayer, type InsertWomensPrayer
} from "@shared/schema";
import { db } from "./db";
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
  
  getDailyMussarByDate(date: string): Promise<DailyMussar | undefined>;
  createDailyMussar(mussar: InsertDailyMussar): Promise<DailyMussar>;
  
  getDailyChizukByDate(date: string): Promise<DailyChizuk | undefined>;
  createDailyChizuk(chizuk: InsertDailyChizuk): Promise<DailyChizuk>;
  
  getLoshonHorahByDate(date: string): Promise<LoshonHorah | undefined>;
  createLoshonHorah(loshon: InsertLoshonHorah): Promise<LoshonHorah>;

  // Weekly Torah content methods
  getShabbatRecipeByWeek(week: string): Promise<ShabbatRecipe | undefined>;
  createShabbatRecipe(recipe: InsertShabbatRecipe): Promise<ShabbatRecipe>;
  
  getParshaVortByWeek(week: string): Promise<ParshaVort | undefined>;
  createParshaVort(vort: InsertParshaVort): Promise<ParshaVort>;

  // Tehillim methods
  getActiveNames(): Promise<TehillimName[]>;
  createTehillimName(name: InsertTehillimName): Promise<TehillimName>;
  cleanupExpiredNames(): Promise<void>;
  getGlobalTehillimProgress(): Promise<GlobalTehillimProgress>;
  updateGlobalTehillimProgress(currentPerek: number, completedBy?: string): Promise<GlobalTehillimProgress>;
  getRandomNameForPerek(): Promise<TehillimName | undefined>;

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

  // Inspirational quote methods
  getInspirationalQuoteByDate(date: string): Promise<InspirationalQuote | undefined>;
  createInspirationalQuote(quote: InsertInspirationalQuote): Promise<InspirationalQuote>;

  // Women's prayer methods
  getWomensPrayersByCategory(category: string): Promise<WomensPrayer[]>;
  getWomensPrayerById(id: number): Promise<WomensPrayer | undefined>;
  createWomensPrayer(prayer: InsertWomensPrayer): Promise<WomensPrayer>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeDefaults() {
    try {
      // Check if Mincha prayers already exist
      const existingPrayers = await db.select().from(minchaPrayers).limit(1);
      if (existingPrayers.length > 0) return;

      // Insert default Mincha prayers only
      await db.insert(minchaPrayers).values([
        {
          prayerType: "ashrei",
          hebrewText: "אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ עוֹד יְהַלְלוּךָ סֶּלָה",
          englishTranslation: "Happy are those who dwell in Your house; they will praise You forever. Selah.",
          transliteration: "Ashrei yoshvei veitecha, od yehallelucha selah.",
          orderIndex: 1
        },
        {
          prayerType: "ashrei",
          hebrewText: "אַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ אַשְׁרֵי הָעָם שֶׁה' אֱלֹהָיו",
          englishTranslation: "Happy is the people for whom it is so; happy is the people whose God is the Lord.",
          transliteration: "Ashrei ha'am she'kacha lo, ashrei ha'am she'Adonai Elohav.",
          orderIndex: 2
        },
        {
          prayerType: "blessing",
          hebrewText: "בָּרוּךְ אַתָּה ה' אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל הַתְּפִלָּה",
          englishTranslation: "Blessed are You, Lord our God, King of the universe, who has sanctified us with His commandments and commanded us concerning prayer.",
          transliteration: "Baruch atah Adonai, Eloheinu melech ha'olam, asher kidshanu bemitzvotav vetzivanu al hatefilah.",
          orderIndex: 3
        }
      ]);

      console.log('Initialized default Mincha prayers');
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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

  async updateGlobalTehillimProgress(currentPerek: number, completedBy?: string): Promise<GlobalTehillimProgress> {
    const [progress] = await db.select().from(globalTehillimProgress).limit(1);
    if (progress) {
      const [updated] = await db.update(globalTehillimProgress)
        .set({
          currentPerek: currentPerek > 150 ? 1 : currentPerek,
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
    const [halacha] = await db.select().from(dailyHalacha).where(eq(dailyHalacha.date, date));
    return halacha || undefined;
  }

  async createDailyHalacha(insertHalacha: InsertDailyHalacha): Promise<DailyHalacha> {
    const [halacha] = await db.insert(dailyHalacha).values(insertHalacha).returning();
    return halacha;
  }

  async getDailyMussarByDate(date: string): Promise<DailyMussar | undefined> {
    const [mussar] = await db.select().from(dailyMussar).where(eq(dailyMussar.date, date));
    return mussar || undefined;
  }

  async createDailyMussar(insertMussar: InsertDailyMussar): Promise<DailyMussar> {
    const [mussar] = await db.insert(dailyMussar).values(insertMussar).returning();
    return mussar;
  }

  async getDailyChizukByDate(date: string): Promise<DailyChizuk | undefined> {
    const [chizuk] = await db.select().from(dailyChizuk).where(eq(dailyChizuk.date, date));
    return chizuk || undefined;
  }

  async createDailyChizuk(insertChizuk: InsertDailyChizuk): Promise<DailyChizuk> {
    const [chizuk] = await db.insert(dailyChizuk).values(insertChizuk).returning();
    return chizuk;
  }

  async getLoshonHorahByDate(date: string): Promise<LoshonHorah | undefined> {
    const [loshon] = await db.select().from(loshonHorah).where(eq(loshonHorah.date, date));
    return loshon || undefined;
  }

  async createLoshonHorah(insertLoshon: InsertLoshonHorah): Promise<LoshonHorah> {
    const [loshon] = await db.insert(loshonHorah).values(insertLoshon).returning();
    return loshon;
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

  async getInspirationalQuoteByDate(date: string): Promise<InspirationalQuote | undefined> {
    const [quote] = await db
      .select()
      .from(inspirationalQuotes)
      .where(eq(inspirationalQuotes.date, date))
      .limit(1);
    return quote;
  }

  async createInspirationalQuote(insertQuote: InsertInspirationalQuote): Promise<InspirationalQuote> {
    const [quote] = await db
      .insert(inspirationalQuotes)
      .values(insertQuote)
      .returning();
    return quote;
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
}

export const storage = new DatabaseStorage();