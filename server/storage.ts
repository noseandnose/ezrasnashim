import { 
  users, 
  content, 
  jewishTimes, 
  calendarEvents, 
  shopItems,
  tehillimNames,
  globalTehillimProgress,
  minchaPrayers,
  type User, 
  type InsertUser,
  type Content,
  type InsertContent,
  type JewishTimes,
  type InsertJewishTimes,
  type CalendarEvent,
  type InsertCalendarEvent,
  type ShopItem,
  type InsertShopItem,
  type TehillimName,
  type InsertTehillimName,
  type GlobalTehillimProgress,
  type InsertGlobalTehillimProgress,
  type MinchaPrayer,
  type InsertMinchaPrayer
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private content: Map<number, Content>;
  private jewishTimes: Map<string, JewishTimes>;
  private calendarEvents: Map<number, CalendarEvent>;
  private shopItems: Map<number, ShopItem>;
  private tehillimNames: Map<number, TehillimName>;
  private globalProgress: GlobalTehillimProgress;
  private minchaPrayers: Map<number, MinchaPrayer>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.jewishTimes = new Map();
    this.calendarEvents = new Map();
    this.shopItems = new Map();
    this.tehillimNames = new Map();
    this.minchaPrayers = new Map();
    this.globalProgress = {
      id: 1,
      currentPerek: 1,
      lastUpdated: new Date(),
      completedBy: null
    };
    this.currentId = 1;
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample content
    const todayHebrewDate = "כ״ט כסלו תשפ״ה";
    const today = new Date().toISOString().split('T')[0];

    // Sample content for today
    this.createContent({
      type: 'halacha',
      title: 'Laws of Chanukah',
      content: 'On the third night of Chanukah, we light three candles. The newest candle (third) is lit first, followed by the second, then the first.',
      date: todayHebrewDate,
      category: 'daily'
    });

    this.createContent({
      type: 'mussar',
      title: 'Building Character',
      content: 'Today\'s lesson focuses on developing patience and understanding in our daily interactions.',
      date: todayHebrewDate,
      category: 'daily'
    });

    this.createContent({
      type: 'chizuk',
      title: 'Finding Light in Darkness',
      content: 'A daily dose of inspiration and strength.',
      audioUrl: '/audio/chizuk-daily.mp3',
      date: todayHebrewDate,
      category: 'daily'
    });

    this.createContent({
      type: 'loshon',
      title: 'Guard Your Speech',
      content: 'Daily reminder about the importance of proper speech and avoiding loshon horah.',
      date: todayHebrewDate,
      category: 'daily'
    });

    this.createContent({
      type: 'recipe',
      title: 'Honey Glazed Challah',
      content: 'A special Shabbas recipe with step-by-step instructions for a beautiful, sweet challah.',
      date: todayHebrewDate,
      category: 'shabbas'
    });

    this.createContent({
      type: 'inspiration',
      title: 'Chanukah Table Setting',
      content: 'Beautiful ideas for creating a festive and meaningful Chanukah table.',
      date: todayHebrewDate,
      category: 'table'
    });

    this.createContent({
      type: 'parsha',
      title: 'Parshas Vayeshev',
      content: 'Weekly Torah portion insights and commentary.',
      audioUrl: '/audio/parsha-vayeshev.mp3',
      date: todayHebrewDate,
      category: 'weekly'
    });

    // Sample Jewish times for today
    this.createJewishTimes({
      date: today,
      location: 'New York, NY',
      sunrise: '7:12 AM',
      sunset: '4:32 PM',
      candleLighting: '4:18 PM',
      havdalah: '5:33 PM',
      hebrewDate: todayHebrewDate
    });

    // Sample shop items
    const shopCategories = [
      { category: 'judaica', items: ['Menorah', 'Mezuzah', 'Kiddush Cup', 'Havdalah Set'] },
      { category: 'books', items: ['Siddur', 'Tehillim', 'Jewish Cookbook', 'Parenting Guide'] },
      { category: 'kitchen', items: ['Kosher Cookbook', 'Shabbas Hot Plate', 'Challah Board', 'Salt Shaker'] },
      { category: 'jewelry', items: ['Star of David Necklace', 'Hamsa Bracelet', 'Chai Pendant', 'Jewish Ring'] }
    ];

    shopCategories.forEach(({ category, items }) => {
      items.forEach(name => {
        this.createShopItem({
          name,
          category,
          description: `Beautiful ${name.toLowerCase()} for Jewish home`,
          price: '$29.99',
          imageUrl: `/images/${category}/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          externalUrl: `https://example-jewish-store.com/${category}/${name.toLowerCase().replace(/\s+/g, '-')}`
        });
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getContentByType(type: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.type === type
    );
  }

  async getContentByDate(date: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.date === date
    );
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = this.currentId++;
    const content: Content = { ...insertContent, id };
    this.content.set(id, content);
    return content;
  }

  async getJewishTimesByDate(date: string): Promise<JewishTimes | undefined> {
    return this.jewishTimes.get(date);
  }

  async createJewishTimes(insertTimes: InsertJewishTimes): Promise<JewishTimes> {
    const id = this.currentId++;
    const times: JewishTimes = { ...insertTimes, id };
    this.jewishTimes.set(insertTimes.date, times);
    return times;
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.currentId++;
    const event: CalendarEvent = { ...insertEvent, id };
    this.calendarEvents.set(id, event);
    return event;
  }

  async getShopItemsByCategory(category: string): Promise<ShopItem[]> {
    return Array.from(this.shopItems.values()).filter(
      (item) => item.category === category
    );
  }

  async getAllShopItems(): Promise<ShopItem[]> {
    return Array.from(this.shopItems.values());
  }

  async createShopItem(insertItem: InsertShopItem): Promise<ShopItem> {
    const id = this.currentId++;
    const item: ShopItem = { ...insertItem, id };
    this.shopItems.set(id, item);
    return item;
  }

  // Tehillim methods
  async getActiveNames(): Promise<TehillimName[]> {
    await this.cleanupExpiredNames();
    return Array.from(this.tehillimNames.values());
  }

  async createTehillimName(insertName: InsertTehillimName): Promise<TehillimName> {
    const id = this.currentId++;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const name: TehillimName = {
      ...insertName,
      id,
      dateAdded: now,
      expiresAt,
      userId: null
    };
    
    this.tehillimNames.set(id, name);
    return name;
  }

  async cleanupExpiredNames(): Promise<void> {
    const now = new Date();
    for (const [id, name] of this.tehillimNames.entries()) {
      if (name.expiresAt && name.expiresAt < now) {
        this.tehillimNames.delete(id);
      }
    }
  }

  async getGlobalTehillimProgress(): Promise<GlobalTehillimProgress> {
    return this.globalProgress;
  }

  async updateGlobalTehillimProgress(currentPerek: number, completedBy?: string): Promise<GlobalTehillimProgress> {
    this.globalProgress = {
      ...this.globalProgress,
      currentPerek: currentPerek > 150 ? 1 : currentPerek, // Reset to 1 after 150
      lastUpdated: new Date(),
      completedBy: completedBy || null
    };
    return this.globalProgress;
  }

  async getRandomNameForPerek(): Promise<TehillimName | undefined> {
    await this.cleanupExpiredNames();
    const activeNames = Array.from(this.tehillimNames.values());
    if (activeNames.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * activeNames.length);
    return activeNames[randomIndex];
  }

  async getMinchaPrayers(): Promise<MinchaPrayer[]> {
    return Array.from(this.minchaPrayers.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async createMinchaPrayer(insertPrayer: InsertMinchaPrayer): Promise<MinchaPrayer> {
    const id = this.currentId++;
    const prayer: MinchaPrayer = { 
      ...insertPrayer, 
      id, 
      orderIndex: insertPrayer.orderIndex || 0,
      transliteration: insertPrayer.transliteration || null
    };
    this.minchaPrayers.set(id, prayer);
    return prayer;
  }
}

export const storage = new MemStorage();
