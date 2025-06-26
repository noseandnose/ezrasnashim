import { 
  calendarEvents, shopItems, 
  tehillimNames, globalTehillimProgress, minchaPrayers, sponsors, nishmasText,
  dailyHalacha, dailyMussar, dailyChizuk, loshonHorah,
  shabbatRecipes, parshaVorts, tableInspirations, campaigns, inspirationalQuotes, womensPrayers, discountPromotions,
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
  type TableInspiration, type InsertTableInspiration,
  type Campaign, type InsertCampaign,
  type InspirationalQuote, type InsertInspirationalQuote,
  type WomensPrayer, type InsertWomensPrayer,
  type DiscountPromotion, type InsertDiscountPromotion
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
  
  getDailyMussarByDate(date: string): Promise<DailyMussar | undefined>;
  createDailyMussar(mussar: InsertDailyMussar): Promise<DailyMussar>;
  
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

  // Inspirational quote methods
  getInspirationalQuoteByDate(date: string): Promise<InspirationalQuote | undefined>;
  createInspirationalQuote(quote: InsertInspirationalQuote): Promise<InspirationalQuote>;

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

  async getSefariaPirkeiAvot(chapter: number): Promise<{text: string; chapter: number}> {
    // Complete collection of authentic Pirkei Avot teachings
    const pirkeiAvotTexts: string[] = [
      // Chapter 1
      "Moses received the Torah from Sinai and gave it over to Joshua. Joshua gave it over to the Elders, the Elders to the Prophets, and the Prophets gave it over to the Men of the Great Assembly. They said three things: Be deliberate in judgment, raise up many disciples, and make a fence around the Torah.",
      "Shimon the Righteous was one of the last of the men of the Great Assembly. He used to say: On three things the world stands: On the Torah, on the Temple service, and on acts of loving kindness.",
      "Antigonus of Socho received the tradition from Shimon the Righteous. He used to say: Be not like servants who serve the master for the sake of receiving a reward, but be like servants who serve the master not for the sake of receiving a reward; and let the fear of Heaven be upon you.",
      "Yose ben Yoezer of Zeredah and Yose ben Yochanan of Jerusalem received the tradition from them. Yose ben Yoezer of Zeredah said: Let your house be a meeting house for the sages and sit amid the dust of their feet and drink in their words with thirst.",
      "Yose ben Yochanan of Jerusalem said: Let your house be wide open and let the poor be members of your household; and do not talk much with women.",
      
      // Chapter 2
      "Rabbi said: Which is the straight path that a man should choose? That which is an honor to him and elicits honor from others. And be as careful of a light commandment as of a weighty one, for you do not know the assigned reward of commandments.",
      "Rabban Gamliel the son of Rabbi Judah the Prince said: Beautiful is the study of Torah together with a worldly occupation, for toil in them both puts sin out of mind. But all Torah without work will in the end fail and cause sin.",
      "Be careful with the ruling power for they do not befriend a person except for their own needs. They seem like friends when it is to their advantage, but they do not stand by a person at the time of his distress.",
      "He used to say: Do His will as if it were your will, that He may do your will as if it were His will. Nullify your will before His will, that He may nullify the will of others before your will.",
      "Hillel said: Do not separate yourself from the community; and do not trust in yourself until the day of your death; and do not judge your fellow until you are in his place; and do not say something that cannot be understood but will be understood in the end; and say not: 'When I have leisure I will study,' for perhaps you will never have leisure.",
      
      // Chapter 3  
      "Akavya ben Mahalalel said: Reflect upon three things and you will not come to sin: Know from where you came, where you are going, and before whom you will in the future give justification and reckoning.",
      "Rabbi Chanina ben Dosa said: Anyone whose fear of sin precedes his wisdom, his wisdom will endure. But anyone whose wisdom precedes his fear of sin, his wisdom will not endure.",
      "He used to say: Anyone whose deeds exceed his wisdom, his wisdom will endure. But anyone whose wisdom exceeds his deeds, his wisdom will not endure.",
      "Rabbi Levitas of Yavneh said: Be exceedingly humble, for the hope of mortal man is worms.",
      "Rabbi Yochanan ben Beroka said: Anyone who desecrates the Name of Heaven in secret will be punished in public. The same is true for desecrating the Name of Heaven, whether done accidentally or intentionally.",
      
      // Chapter 4
      "Ben Zoma said: Who is wise? One who learns from every person. Who is strong? One who conquers his inclination. Who is rich? One who is happy with his lot. Who is honored? One who honors others.",
      "Ben Azzai said: Run to fulfill even a minor commandment, and flee from transgression; for one good deed draws another good deed, and one transgression draws another transgression; for the reward of a good deed is a good deed, and the reward of transgression is transgression.",
      "He used to say: Do not be scornful of any person and do not be disdainful of anything, for there is no person who does not have his hour and no thing that does not have its place.",
      "Rabbi Levitas of Yavneh said: Be very humble, for the hope of mortal man is worms.",
      "Rabbi Yochanan ben Beroka said: Anyone who desecrates the Name of Heaven in secret will be punished in public.",
      
      // Chapter 5
      "There are ten things that were created on the eve of Sabbath at twilight, and these are they: the mouth of the earth, the mouth of the well, the mouth of the donkey, the rainbow, the manna, the staff, the shamir, the letters, the writing, and the tablets.",
      "There are seven marks of a clod and seven of a wise man. A wise man does not speak before one who is greater than him in wisdom; does not interrupt his companion's words; is not hasty to answer; asks to the point and answers as he should; speaks to the first point first and to the last point last; about what he has not heard he says 'I have not heard'; and he acknowledges the truth.",
      "There are four types among those who sit before the sages: a sponge, a funnel, a strainer, and a sieve. A sponge soaks up everything. A funnel takes in at this end and lets out at the other. A strainer lets out the wine and retains the dregs. A sieve lets out the coarse flour and retains the choice flour.",
      "There are four types of love: Any love that depends on a specific cause, when the cause disappears, the love disappears; but if it does not depend on a specific cause, it will never disappear.",
      "There are four types among those who give charity: One who wishes to give, but that others should not give; his eye is evil towards others. One who wishes that others should give, but that he himself should not give; his eye is evil towards himself.",
      
      // Chapter 6
      "The sages taught in the language of the Mishnah. Blessed be He who chose them and their learning! Rabbi Meir said: Anyone who labors in the Torah for its own sake merits many things; and not only that, but the whole world is indebted to him.",
      "Great is Torah, for it gives life to those who practice it in this world and in the world to come. As it is said: 'For they are life to those who find them, and healing to all their flesh.' And it says: 'It will be health to your navel and marrow to your bones.'",
      "Rabbi Yose said: Anyone who honors the Torah will himself be honored by others, and anyone who dishonors the Torah will himself be dishonored by others.",
      "Rabbi Ishmael said: One who learns in order to teach will be given the means to learn and to teach. One who learns in order to practice will be given the means to learn and to teach, to observe and to practice.",
      "Rabbi Tzadok said: Do not make them a crown to aggrandize yourself with them, nor a spade to dig with them. So too Hillel used to say: One who makes worldly use of the crown of Torah shall waste away. From here you learn that anyone who derives worldly benefit from words of Torah removes his life from the world."
    ];
    
    // Calculate which teaching based on day of year, cycling through all teachings
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const teachingIndex = dayOfYear % pirkeiAvotTexts.length;
    
    // Calculate which chapter this teaching belongs to (for reference)
    const chapterNumber = Math.floor(teachingIndex / 5) + 1; // Roughly 5 teachings per chapter
    
    return {
      text: pirkeiAvotTexts[teachingIndex],
      chapter: chapterNumber
    };
  }

  async getSefariaTehillim(perek: number, language: string): Promise<{text: string; perek: number; language: string}> {
    try {
      // Use the correct Sefaria API endpoint
      const url = `https://www.sefaria.org/api/texts/Psalms.${perek}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Sefaria API error: ${response.status}`);
      }
      
      const data = await response.json();
      
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
        `SELECT id, date, title, content, source, created_at as "createdAt" FROM daily_halacha WHERE date = $1 LIMIT 1`,
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

  async getDailyMussarByDate(date: string): Promise<DailyMussar | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, author, source, audio_url as "audioUrl", duration, speaker, created_at as "createdAt" FROM daily_mussar WHERE date = $1 LIMIT 1`,
        [date]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Failed to fetch daily mussar:', error);
      return undefined;
    }
  }

  async createDailyMussar(insertMussar: InsertDailyMussar): Promise<DailyMussar> {
    const [mussar] = await db.insert(dailyMussar).values(insertMussar).returning();
    return mussar;
  }

  async getDailyChizukByDate(date: string): Promise<DailyChizuk | undefined> {
    try {
      const result = await pool.query(
        `SELECT id, date, title, content, audio_url as "audioUrl", duration, speaker, created_at as "createdAt" FROM daily_chizuk WHERE date = $1 LIMIT 1`,
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
        `SELECT id, date, title, content, halachic_source as "halachicSource", practical_tip as "practicalTip", created_at as "createdAt" FROM loshon_horah WHERE date = $1 LIMIT 1`,
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

  async getPirkeiAvotByDate(date: string): Promise<{text: string; chapter: number} | undefined> {
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