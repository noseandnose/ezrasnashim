import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { 
  insertCalendarEventSchema, 
  insertTehillimNameSchema,
  insertDailyHalachaSchema,
  insertDailyMussarSchema,
  insertDailyChizukSchema,
  insertLoshonHorahSchema,
  insertShabbatRecipeSchema,
  insertParshaVortSchema,
  insertTableInspirationSchema,
  insertNishmasTextSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {


  // Hebcal Zmanim API proxy route
  app.get("/api/zmanim/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const today = new Date().toISOString().split('T')[0];
      
      // Map coordinates to nearest major city geonameid
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Find closest major Jewish community by distance
      const cities = [
        { name: "New York City, New York, USA", geonameid: 5128581, lat: 40.7128, lng: -74.0060 },
        { name: "Los Angeles, California, USA", geonameid: 5368361, lat: 34.0522, lng: -118.2437 },
        { name: "Chicago, Illinois, USA", geonameid: 4887398, lat: 41.8781, lng: -87.6298 },
        { name: "Philadelphia, Pennsylvania, USA", geonameid: 4560349, lat: 39.9526, lng: -75.1652 },
        { name: "Miami, Florida, USA", geonameid: 4164138, lat: 25.7617, lng: -80.1918 },
        { name: "Boston, Massachusetts, USA", geonameid: 4930956, lat: 42.3601, lng: -71.0589 },
        { name: "Baltimore, Maryland, USA", geonameid: 4347778, lat: 39.2904, lng: -76.6122 },
        { name: "Brooklyn, New York, USA", geonameid: 5110302, lat: 40.6782, lng: -73.9442 },
        { name: "Jerusalem, Israel", geonameid: 281184, lat: 31.7683, lng: 35.2137 },
        { name: "Tel Aviv, Israel", geonameid: 293397, lat: 32.0853, lng: 34.7818 },
        { name: "London, England, UK", geonameid: 2643743, lat: 51.5074, lng: -0.1278 },
        { name: "Toronto, Ontario, Canada", geonameid: 6167865, lat: 43.6532, lng: -79.3832 }
      ];
      
      // Calculate distance and find closest city
      let closestCity = cities[0]; // Default to NYC
      let minDistance = Number.MAX_VALUE;
      
      for (const city of cities) {
        const distance = Math.sqrt(
          Math.pow(latitude - city.lat, 2) + Math.pow(longitude - city.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      }
      
      // Call Hebcal with geonameid
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${closestCity.geonameid}&date=${today}`;
      const response = await fetch(hebcalUrl);
      
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Format times to 12-hour format with AM/PM
      const formatTime = (timeStr: string) => {
        if (!timeStr) return null;
        try {
          // Parse ISO timestamp and extract local time components
          const match = timeStr.match(/T(\d{2}):(\d{2}):/);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = match[2];
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${displayHours}:${minutes} ${period}`;
          }
          return timeStr;
        } catch (error) {
          console.error('Time formatting error:', error, 'for time:', timeStr);
          return timeStr;
        }
      };

      const formattedTimes = {
        sunrise: formatTime(data.times?.sunrise),
        shkia: formatTime(data.times?.sunset),
        tzaitHakochavim: formatTime(data.times?.tzeit7083deg),
        minchaGedolah: formatTime(data.times?.minchaGedola),
        minchaKetanah: formatTime(data.times?.minchaKetana),
        candleLighting: formatTime(data.times?.candleLighting),
        havdalah: formatTime(data.times?.havdalah),
        hebrewDate: data.date || '',
        location: data.location?.title || data.location?.geo || closestCity.name,
        
        // TODO: Add notification/reminder functionality
        // - Can set alerts for specific zmanim times
        // - Push notifications for important times like candle lighting
        
        // TODO: Add minhag customization options
        // - Different calculations for tzait hakochavim (18 min, 42 min, etc.)
        // - Sephardic vs Ashkenazi customs for zmanim
        // - Custom candle lighting time preferences
      };

      res.json(formattedTimes);
    } catch (error) {
      console.error('Error fetching Hebcal zmanim:', error);
      res.status(500).json({ message: "Failed to fetch zmanim from Hebcal API" });
    }
  });

  // Calendar events routes
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create calendar event" });
      }
    }
  });

  // Shop routes
  app.get("/api/shop", async (req, res) => {
    try {
      const items = await storage.getAllShopItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  app.get("/api/shop/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid shop item ID" });
      }
      const item = await storage.getShopItemById(id);
      if (!item) {
        return res.status(404).json({ message: "Shop item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop item" });
    }
  });

  // Hebcal API proxy
  app.get("/api/hebcal/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await fetch(hebcalUrl);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch from Hebcal API" });
    }
  });

  // Table inspiration routes
  app.get("/api/table/inspiration/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const inspiration = await storage.getTableInspirationByDate(date);
      res.json(inspiration || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table inspiration" });
    }
  });

  app.post("/api/table/inspiration", async (req, res) => {
    try {
      const validatedData = insertTableInspirationSchema.parse(req.body);
      const inspiration = await storage.createTableInspiration(validatedData);
      res.json(inspiration);
    } catch (error) {
      res.status(500).json({ message: "Failed to create table inspiration" });
    }
  });

  // Mincha routes
  app.get("/api/mincha/prayers", async (req, res) => {
    try {
      const prayers = await storage.getMinchaPrayers();
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Mincha prayers" });
    }
  });

  // Sponsor routes
  app.get("/api/sponsors/:contentType/:date", async (req, res) => {
    try {
      const { contentType, date } = req.params;
      const sponsor = await storage.getSponsorByContentTypeAndDate(contentType, date);
      res.json(sponsor || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsor" });
    }
  });

  app.get("/api/sponsors/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const sponsor = await storage.getDailySponsor(date);
      res.json(sponsor || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily sponsor" });
    }
  });

  app.get("/api/sponsors", async (req, res) => {
    try {
      const sponsors = await storage.getActiveSponsors();
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post("/api/sponsors", async (req, res) => {
    try {
      const sponsor = await storage.createSponsor(req.body);
      res.json(sponsor);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns/active", async (req, res) => {
    try {
      const campaign = await storage.getActiveCampaign();
      res.json(campaign || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active campaign" });
    }
  });

  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Daily Torah content routes
  app.get("/api/torah/halacha/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const halacha = await storage.getDailyHalachaByDate(date);
      res.json(halacha || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily halacha" });
    }
  });

  app.post("/api/torah/halacha", async (req, res) => {
    try {
      const validatedData = insertDailyHalachaSchema.parse(req.body);
      const halacha = await storage.createDailyHalacha(validatedData);
      res.json(halacha);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily halacha" });
    }
  });

  app.get("/api/torah/mussar/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const mussar = await storage.getDailyMussarByDate(date);
      res.json(mussar || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily mussar" });
    }
  });

  app.post("/api/torah/mussar", async (req, res) => {
    try {
      const validatedData = insertDailyMussarSchema.parse(req.body);
      const mussar = await storage.createDailyMussar(validatedData);
      res.json(mussar);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily mussar" });
    }
  });

  app.get("/api/torah/chizuk/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const chizuk = await storage.getDailyChizukByDate(date);
      res.json(chizuk || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily chizuk" });
    }
  });

  app.post("/api/torah/chizuk", async (req, res) => {
    try {
      const validatedData = insertDailyChizukSchema.parse(req.body);
      const chizuk = await storage.createDailyChizuk(validatedData);
      res.json(chizuk);
    } catch (error) {
      res.status(500).json({ message: "Failed to create daily chizuk" });
    }
  });

  app.get("/api/torah/loshon/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const loshon = await storage.getLoshonHorahByDate(date);
      res.json(loshon || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch loshon horah content" });
    }
  });

  app.post("/api/torah/loshon", async (req, res) => {
    try {
      const validatedData = insertLoshonHorahSchema.parse(req.body);
      const loshon = await storage.createLoshonHorah(validatedData);
      res.json(loshon);
    } catch (error) {
      res.status(500).json({ message: "Failed to create loshon horah content" });
    }
  });

  app.get("/api/torah/pirkei-avot/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const pirkeiAvot = await storage.getPirkeiAvotByDate(date);
      res.json(pirkeiAvot || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Pirkei Avot content" });
    }
  });

  // Weekly Torah content routes
  app.get("/api/table/recipe/:week", async (req, res) => {
    try {
      const { week } = req.params;
      const recipe = await storage.getShabbatRecipeByWeek(week);
      res.json(recipe || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Shabbat recipe" });
    }
  });

  app.post("/api/table/recipe", async (req, res) => {
    try {
      const validatedData = insertShabbatRecipeSchema.parse(req.body);
      const recipe = await storage.createShabbatRecipe(validatedData);
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Shabbat recipe" });
    }
  });

  app.get("/api/table/vort/:week", async (req, res) => {
    try {
      const { week } = req.params;
      const vort = await storage.getParshaVortByWeek(week);
      res.json(vort || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Parsha vort" });
    }
  });

  app.post("/api/table/vort", async (req, res) => {
    try {
      const validatedData = insertParshaVortSchema.parse(req.body);
      const vort = await storage.createParshaVort(validatedData);
      res.json(vort);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Parsha vort" });
    }
  });

  // Zmanim route that returns parsed and adjusted times
  app.get("/api/zmanim/:location?", async (req, res) => {
    try {
      const location = req.params.location || "5128581"; // Default to NYC
      const today = new Date().toISOString().split('T')[0];
      const hebcalUrl = `https://www.hebcal.com/zmanim?cfg=json&geonameid=${location}&date=${today}`;
      
      const response = await fetch(hebcalUrl);
      const data = await response.json();
      
      // Parse the response to extract times
      const times: any = {};
      
      if (data.times) {
        const formatTime = (timeStr: string) => {
          if (!timeStr) return 'N/A';
          const date = new Date(timeStr);
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York'
          });
        };

        const adjustTime = (timeStr: string, adjustmentMinutes: number) => {
          if (!timeStr) return 'N/A';
          try {
            const date = new Date(timeStr);
            date.setMinutes(date.getMinutes() + adjustmentMinutes);
            return date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York'
            });
          } catch {
            return 'N/A';
          }
        };

        times.sunrise = adjustTime(data.times.sunrise, -3); // 3 minutes earlier
        times.shkia = adjustTime(data.times.sunset, -42); // 42 minutes earlier  
        times.tzaitHakochavim = formatTime(data.times.tzeit7083deg);
        times.minchaGedolah = formatTime(data.times.minchaGedola);
        times.minchaKetanah = formatTime(data.times.minchaKetana);
        times.candleLighting = formatTime(data.times.candlelighting);
        times.havdalah = formatTime(data.times.havdalah);
        times.hebrewDate = data.date?.hebrew || '';
        times.location = data.location?.title || 'New York';
      }
      
      res.json(times);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch zmanim data" });
    }
  });

  // Tehillim routes
  app.get("/api/tehillim/progress", async (req, res) => {
    try {
      const progress = await storage.getGlobalTehillimProgress();
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Tehillim progress" });
    }
  });

  app.post("/api/tehillim/complete", async (req, res) => {
    try {
      const { completedBy } = req.body;
      const currentProgress = await storage.getGlobalTehillimProgress();
      const nextPerek = currentProgress.currentPerek + 1;
      const updatedProgress = await storage.updateGlobalTehillimProgress(nextPerek, completedBy);
      res.json(updatedProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete Tehillim perek" });
    }
  });

  app.get("/api/tehillim/current-name", async (req, res) => {
    try {
      const name = await storage.getRandomNameForPerek();
      res.json(name || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current name" });
    }
  });

  app.get("/api/tehillim/names", async (req, res) => {
    try {
      const names = await storage.getActiveNames();
      res.json(names);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Tehillim names" });
    }
  });

  app.post("/api/tehillim/names", async (req, res) => {
    try {
      const validatedData = insertTehillimNameSchema.parse(req.body);
      const name = await storage.createTehillimName(validatedData);
      res.json(name);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid name data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create Tehillim name" });
      }
    }
  });

  // Nishmas text routes
  app.get("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const text = await storage.getNishmasTextByLanguage(language);
      res.json(text || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Nishmas text" });
    }
  });

  app.post("/api/nishmas", async (req, res) => {
    try {
      const validatedData = insertNishmasTextSchema.parse(req.body);
      const text = await storage.createNishmasText(validatedData);
      res.json(text);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Nishmas text" });
    }
  });

  app.put("/api/nishmas/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const validatedData = insertNishmasTextSchema.partial().parse(req.body);
      const text = await storage.updateNishmasText(language, validatedData);
      res.json(text);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Nishmas text" });
    }
  });

  // Inspirational quotes routes
  app.get("/api/quotes/daily/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const quote = await storage.getInspirationalQuoteByDate(date);
      res.json(quote || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspirational quote" });
    }
  });

  // Women's prayer routes
  app.get("/api/womens-prayers/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const prayers = await storage.getWomensPrayersByCategory(category);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch women's prayers" });
    }
  });

  app.get("/api/womens-prayers/prayer/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const prayer = await storage.getWomensPrayerById(parseInt(id));
      res.json(prayer || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayer" });
    }
  });

  // Discount promotion routes
  app.get("/api/discount-promotions/active", async (req, res) => {
    try {
      const promotion = await storage.getActiveDiscountPromotion();
      res.json(promotion || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active discount promotion" });
    }
  });

  // Stripe payment intent creation for donations
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, donationType, metadata } = req.body;
      
      if (!amount || amount < 1) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: ['card'],
        metadata: {
          donationType: donationType || "general",
          ...metadata
        },
        description: `Ezras Nashim Donation - ${donationType || 'General'}`
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create payment intent",
        message: error.message 
      });
    }
  });

  // Donation completion handler
  app.post("/api/donation-complete", async (req, res) => {
    try {
      const { donationType, sponsorName, dedication } = req.body;
      
      // Only create sponsor record for "Sponsor a Day" donations
      if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
        const today = new Date().toISOString().split('T')[0];
        
        // Create sponsor record
        await storage.createSponsor({
          name: sponsorName,
          sponsorshipDate: today,
          message: dedication || null,
          isActive: true
        });
        
        console.log(`Created sponsor record for ${sponsorName} on ${today}`);
        res.json({ success: true, message: 'Sponsor record created' });
      } else {
        res.json({ success: true, message: 'No sponsor record needed' });
      }
    } catch (error: any) {
      console.error('Failed to create sponsor record:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create sponsor record',
        error: error.message 
      });
    }
  });

  // Stripe payment route for donations
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          source: "ezras-nashim-donation"
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount 
      });
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
