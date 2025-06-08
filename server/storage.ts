import { 
  users, content, jewishTimes, calendarEvents, shopItems, 
  tehillimNames, globalTehillimProgress, minchaPrayers,
  type User, type InsertUser, type Content, type InsertContent,
  type JewishTimes, type InsertJewishTimes, type CalendarEvent, type InsertCalendarEvent,
  type ShopItem, type InsertShopItem, type TehillimName, type InsertTehillimName,
  type GlobalTehillimProgress, type MinchaPrayer, type InsertMinchaPrayer
} from "@shared/schema";
import { db } from "./db";
import { eq, gt, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getContentByType(type: string): Promise<Content[]>;
  getContentByDate(date: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  
  getJewishTimesByDate(date: string): Promise<JewishTimes | undefined>;
  createJewishTimes(times: InsertJewishTimes): Promise<JewishTimes>;
  
  getCalendarEvents(): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  
  getShopItemsByCategory(category: string): Promise<ShopItem[]>;
  getAllShopItems(): Promise<ShopItem[]>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;

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

      // Insert default Mincha prayers
      await db.insert(minchaPrayers).values([
        {
          hebrewText: "אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ עוֹד יְהַלְלוּךָ סֶּלָה",
          englishTranslation: "Happy are those who dwell in Your house; they will praise You forever. Selah.",
          transliteration: "Ashrei yoshvei veitecha, od yehallelucha selah.",
          orderIndex: 1
        },
        {
          hebrewText: "אַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ אַשְׁרֵי הָעָם שֶׁה' אֱלֹהָיו",
          englishTranslation: "Happy is the people for whom it is so; happy is the people whose God is the Lord.",
          transliteration: "Ashrei ha'am she'kacha lo, ashrei ha'am she'Adonai Elohav.",
          orderIndex: 2
        },
        {
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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Content methods (stubs for now)
  async getContentByType(type: string): Promise<Content[]> {
    return [];
  }

  async getContentByDate(date: string): Promise<Content[]> {
    return [];
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [created] = await db.insert(content).values(insertContent).returning();
    return created;
  }

  // Jewish Times methods (stubs for now)
  async getJewishTimesByDate(date: string): Promise<JewishTimes | undefined> {
    return undefined;
  }

  async createJewishTimes(insertTimes: InsertJewishTimes): Promise<JewishTimes> {
    const [times] = await db.insert(jewishTimes).values(insertTimes).returning();
    return times;
  }

  // Calendar Events methods (stubs for now)
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return [];
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  // Shop Items methods (stubs for now)
  async getShopItemsByCategory(category: string): Promise<ShopItem[]> {
    return [];
  }

  async getAllShopItems(): Promise<ShopItem[]> {
    return [];
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
}

export const storage = new DatabaseStorage();