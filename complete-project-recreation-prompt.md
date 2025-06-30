# Ezras Nashim - Complete Jewish Women's Spiritual App Recreation

## Project Overview
Create a comprehensive mobile-first web application for Jewish women to track daily spiritual practices including Torah study, Tefilla (prayer), and Tzedaka (charity). The app features authentic Jewish content, prayer times, donation tracking, and beautiful heart reward animations.

## Tech Stack & Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: Wouter for lightweight client routing
- **Styling**: Tailwind CSS with custom spiritual color palette
- **UI Components**: Radix UI primitives + shadcn/ui
- **State Management**: Zustand for client state, TanStack Query v5 for server state
- **HTTP Client**: Axios with comprehensive request/response logging
- **Fonts**: Heebo for Hebrew text, Poppins for English, Playfair Display for headers

### Backend
- **Runtime**: Node.js 20 + Express.js + TypeScript (ES modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Session**: Express session with memory store
- **Payment**: Stripe integration for donations
- **External APIs**: Hebcal for Jewish times, Sefaria for Torah content

### Database Schema (PostgreSQL + Drizzle)

```typescript
// Core Tables
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  gregorianDate: text("gregorian_date").notNull(),
  recurring: boolean("recurring").default(true),
  years: integer("years").default(20),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  couponCode: text("coupon_code"),
  backgroundImageUrl: text("background_image_url").notNull(),
  externalUrl: text("external_url"),
  isActive: boolean("is_active").default(true),
});

// Tehillim System
export const tehillimNames = pgTable("tehillim_names", {
  id: serial("id").primaryKey(),
  hebrewName: text("hebrew_name").notNull(),
  reason: text("reason").notNull(),
  reasonEnglish: text("reason_english"),
  dateAdded: timestamp("date_added").defaultNow(),
  expiresAt: timestamp("expires_at"), // 18 days from dateAdded
  userId: integer("user_id"),
});

export const globalTehillimProgress = pgTable("global_tehillim_progress", {
  id: serial("id").primaryKey(),
  currentPerek: integer("current_perek").default(1).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  completedBy: text("completed_by"),
});

// Prayer Tables
export const minchaPrayers = pgTable("mincha_prayers", {
  id: serial("id").primaryKey(),
  prayerType: text("prayer_type").notNull(),
  hebrewText: text("hebrew_text").notNull(),
  englishTranslation: text("english_translation").notNull(),
  orderIndex: integer("order_index").default(0),
});

export const nishmasText = pgTable("nishmas_text", {
  id: serial("id").primaryKey(),
  language: text("language").notNull(), // 'hebrew' or 'english'
  fullText: text("full_text").notNull(),
  transliteration: text("transliteration"),
  source: text("source").default("Nishmas.net"),
  version: text("version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const womensPrayers = pgTable("womens_prayers", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // 'refuah', 'family', 'life'
  prayerName: text("prayer_name").notNull(),
  hebrewText: text("hebrew_text"),
  englishTranslation: text("english_translation"),
  transliteration: text("transliteration"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily Torah Content
export const dailyHalacha = pgTable("daily_halacha", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  audioUrl: text("audio_url"),
  duration: text("duration"),
  speaker: text("speaker"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyEmuna = pgTable("daily_emuna", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  audioUrl: text("audio_url"),
  duration: text("duration"),
  speaker: text("speaker"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyChizuk = pgTable("daily_chizuk", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  audioUrl: text("audio_url"),
  duration: text("duration"),
  speaker: text("speaker"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loshonHorah = pgTable("loshon_horah", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  halachicSource: text("halachic_source"),
  practicalTip: text("practical_tip"),
  speakerName: text("speaker_name"),
  speakerWebsite: text("speaker_website"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Shabbat Content
export const shabbatRecipes = pgTable("shabbat_recipes", {
  id: serial("id").primaryKey(),
  week: date("week").notNull(),
  hebrewDate: text("hebrew_date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  ingredients: text("ingredients").notNull(), // JSON array as text
  instructions: text("instructions").notNull(),
  servings: text("servings"),
  prepTime: text("prep_time"),
  cookTime: text("cook_time"),
  difficulty: text("difficulty"),
  imageUrl: text("image_url"),
  tags: text("tags"), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
});

export const parshaVorts = pgTable("parsha_vorts", {
  id: serial("id").primaryKey(),
  week: date("week").notNull(),
  parsha: text("parsha").notNull(),
  hebrewParsha: text("hebrew_parsha").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  audioUrl: text("audio_url").notNull(),
  duration: text("duration"),
  speaker: text("speaker").notNull(),
  source: text("source"),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tableInspirations = pgTable("table_inspirations", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl1: text("image_url_1"),
  imageUrl2: text("image_url_2"),
  imageUrl3: text("image_url_3"),
  imageUrl4: text("image_url_4"),
  imageUrl5: text("image_url_5"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pirkei Avot System
export const pirkeiAvotProgress = pgTable("pirkei_avot_progress", {
  id: serial("id").primaryKey(),
  currentChapter: integer("current_chapter").notNull().default(1),
  currentVerse: integer("current_verse").notNull().default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Sponsorship & Campaigns
export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hebrewName: text("hebrew_name"),
  sponsorshipDate: text("sponsorship_date").notNull(),
  message: text("message"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  goalAmount: integer("goal_amount").notNull(),
  currentAmount: integer("current_amount").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Discount Promotions
export const discountPromotions = pgTable("discount_promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  logoUrl: text("logo_url").notNull(),
  linkUrl: text("link_url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Key Features & Functionality

### Core Daily Tracking System
- **Three Main Sections**: Torah, Tefilla, Tzedaka with heart completion rewards
- **Heart Explosion Animation**: Beautiful particle animation when completing tasks
- **Daily Reset**: Progress resets automatically each day
- **Completion Celebrations**: Visual feedback with gradient hearts and animations

### Jewish Times Integration
- **Hebcal API**: Real-time zmanim (prayer times) based on user location
- **Smart City Mapping**: Automatically maps coordinates to nearest Jewish community
- **Times Display**: Sunrise, Shkia, Tzait Hakochavim, Mincha times
- **Location Awareness**: Different content/promotions based on Israel vs worldwide

### Torah Content System
- **Daily Content**: Halacha, Emuna (Faith), Chizuk (Inspiration), Loshon Horah
- **Audio Support**: Full audio playback with custom player controls
- **Speaker Attribution**: Thank you sections with speaker names and website links
- **Pirkei Avot Daily**: Sequential progression through authentic Sefaria API content
- **Text & Audio**: Supports both written content and audio-only content

### Tefilla (Prayer) System
- **Mincha Prayer**: Complete Hebrew text with English translation
- **Nishmas**: Full prayer text stored in database
- **Women's Prayers**: Categorized prayers (Refuah, Family, Life)
- **Special Tehillim**: 26 categories (Bris milah, Cemetery, Children's success, etc.)
- **Tehillim Global Progress**: Community tracking through all 150 chapters
- **Sefaria Integration**: Real-time Hebrew Tehillim text with Unicode cleaning

### Shabbat Table Content
- **Weekly Recipes**: Complete Shabbat recipe collection
- **Table Inspirations**: Daily inspirational content with multiple images
- **Parsha Vorts**: Weekly Torah insights with audio

### Tzedaka System
- **Stripe Integration**: Secure donation processing
- **Campaign Tracking**: Goal-based fundraising campaigns
- **Multiple Amounts**: Quick donation buttons ($5, $10, $25, $50, Custom)
- **Progress Display**: Visual campaign progress bars

### Special Features
- **Sponsorship System**: Daily content sponsorship with custom messages
- **Discount Promotions**: Location-based exclusive deals
- **Hebrew Font Support**: Heebo font for authentic Hebrew text rendering
- **Mobile-First Design**: Optimized for mobile with max-width container
- **Offline Content**: Database-stored content for reliability

## Design System & Styling

### Color Palette (Quiet Joy - Spiritual Retreat)
```css
:root {
  --background: hsl(42, 78%, 97%); /* Ivory background */
  --foreground: hsl(0, 0%, 0%); /* Pure black text */
  --primary: hsl(345, 55%, 82%); /* Rose blush */
  --accent: hsl(262, 40%, 88%); /* Muted lavender */
  --rose-blush: hsl(350, 45%, 85%);
  --sand-gold: hsl(40, 35%, 80%);
  --muted-lavender: hsl(260, 30%, 85%);
}

/* Force all text to be pure black */
*, *::before, *::after {
  color: #000000 !important;
}

/* Make titles bold and black */
h1, h2, h3, h4, h5, h6,
.font-semibold, .font-bold, .font-extrabold {
  color: #000000 !important;
  font-weight: bold !important;
}
```

### Typography
- **Headers**: Playfair Display (serif)
- **Body Text**: Inter (sans-serif)
- **Hebrew Text**: Heebo font with RTL support
- **Pure Black Text**: All text forced to #000000 for maximum readability

### Layout Structure
- **Mobile Container**: max-width: 448px (28rem), centered with shadow
- **App Header**: Fixed top bar with gradient and rounded bottom corners
- **Bottom Navigation**: 5 tabs with center home button
- **Seamless Design**: Top sections flow directly from navigation bar
- **Modal System**: Overlay modals for detailed content

### Heart Animation System
```css
.heart-explosion {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  z-index: 9999;
}

.heart-particle {
  position: absolute;
  width: 16px;
  height: 16px;
  color: #E8B4CB;
  animation: heartExplode 0.5s ease-out forwards;
}
```

## Key API Routes

### Core Data APIs
- `GET /api/calendar-events` - Jewish calendar events
- `GET /api/shop-items` - Shop promotions
- `GET /api/zmanim/:lat/:lng` - Jewish prayer times via Hebcal
- `GET /api/sponsors/daily/:date` - Daily sponsorships
- `GET /api/discount-promotions/active` - Active discount promotions

### Torah Content APIs
- `GET /api/daily-halacha/:date` - Daily Halacha content
- `GET /api/daily-emuna/:date` - Daily Emuna content
- `GET /api/daily-chizuk/:date` - Daily Chizuk inspiration
- `GET /api/loshon-horah/:date` - Daily Loshon Horah content
- `GET /api/pirkei-avot/current` - Current Pirkei Avot teaching
- `POST /api/pirkei-avot/advance` - Advance to next teaching

### Tefilla APIs
- `GET /api/mincha-prayers` - Mincha prayer texts
- `GET /api/nishmas/:language` - Nishmas prayer text
- `GET /api/womens-prayers/:category` - Women's prayers by category
- `GET /api/special-tehillim/categories` - Special Tehillim categories
- `GET /api/tehillim/:perek/:language` - Individual Tehillim via Sefaria
- `GET /api/tehillim/progress` - Global Tehillim progress
- `POST /api/tehillim/complete` - Complete current Tehillim

### Shabbat Content APIs
- `GET /api/shabbat-recipes/current` - Current week's recipe
- `GET /api/parsha-vorts/current` - Current week's Parsha vort
- `GET /api/table-inspirations/:date` - Daily table inspiration

### Tzedaka APIs
- `GET /api/campaigns/active` - Active fundraising campaigns
- `POST /api/campaigns/:id/donate` - Process donation
- `POST /api/stripe/create-payment-intent` - Create Stripe payment

### Media & External APIs
- `GET /api/media-proxy` - Universal media proxy for audio streaming
- Sefaria API integration for authentic Torah content
- Hebcal API integration for Jewish calendar data

## External Dependencies & Integrations

### Required Environment Variables
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NODE_ENV=production
PORT=5000
```

### Package.json Dependencies
```json
{
  "dependencies": {
    "@radix-ui/react-*": "Latest versions for UI primitives",
    "@stripe/stripe-js": "^7.4.0",
    "@stripe/react-stripe-js": "^3.7.0",
    "@tanstack/react-query": "^5.60.5",
    "axios": "^1.10.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "lucide-react": "^0.453.0",
    "react": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "stripe": "^18.2.1",
    "tailwindcss": "^3.4.17",
    "wouter": "^3.3.5",
    "zod": "^3.24.2",
    "zustand": "^5.0.5"
  }
}
```

## Implementation Instructions

### 1. Project Setup
```bash
# Initialize with Node.js 20 + TypeScript + Vite
npm create vite@latest ezras-nashim -- --template react-ts
cd ezras-nashim

# Install all dependencies from package.json above
npm install

# Set up PostgreSQL database
# Configure Drizzle ORM with schema.ts
# Run database migrations: npm run db:push
```

### 2. Database Configuration
- Set up PostgreSQL connection with environment variables
- Create all tables using Drizzle schema definitions
- Initialize with default data (prayers, initial progress, etc.)
- Set up proper indexes for date-based queries

### 3. Frontend Structure
```
client/src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── sections/ (main app sections)
│   ├── modals/ (content modals)
│   └── audio-player.tsx
├── hooks/ (custom React hooks)
├── lib/ (utilities, axios client)
├── pages/ (main routes)
└── App.tsx
```

### 4. Backend Structure
```
server/
├── index.ts (main server)
├── routes.ts (API routes)
├── storage.ts (database layer)
└── axiosClient.ts (external APIs)
```

### 5. Key Features Implementation

#### Heart Animation System
- Create heart particle animation CSS
- Implement completion celebration component
- Trigger animations on daily task completion

#### Audio Player
- Custom controls with progress bar
- Seeking functionality with click-to-jump
- Media proxy for external audio streaming
- Support for Google Drive and other hosting services

#### Jewish Times Integration
- Geolocation-based city mapping
- Hebcal API integration with error handling
- 12-hour time formatting with AM/PM

#### Sefaria API Integration
- Hebrew text fetching with Unicode cleaning
- Remove HTML entities and formatting artifacts
- Support for Tehillim and Pirkei Avot content

#### Tehillim Global Progress
- Community-wide tracking system
- Sequential progression through 150 chapters
- Name submission with 18-day expiration
- Random name selection for completed chapters

### 6. Deployment Configuration
```toml
# replit.deployment.toml
[app]
build = "vite build && node build-production.mjs"
run = "node production-server.js"

[[ports]]
port = 80
transport = "http"

[env]
NODE_ENV = "production"
```

### 7. Production Build Process
- Frontend: Vite build to `dist/public/`
- Backend: ESBuild bundle to `dist/index.js`
- Static file serving in production mode
- Proper environment variable configuration

## Critical Implementation Notes

### Data Integrity
- All Torah content via authentic Sefaria API
- Jewish times via verified Hebcal API  
- No mock or placeholder data allowed
- Proper error handling for API failures

### Hebrew Text Handling
- Use Heebo font for clean Hebrew rendering
- Implement comprehensive Unicode cleaning
- Remove directional marks and formatting artifacts
- Support RTL text direction

### Mobile Optimization
- Touch-friendly interface design
- Responsive layout with mobile-first approach
- Proper viewport meta tags
- Optimized for thumb navigation

### Security & Performance
- Secure Stripe payment integration
- SQL injection prevention with Drizzle ORM
- API rate limiting and error handling
- Efficient database queries with proper indexes

This comprehensive specification covers all aspects needed to recreate the Ezras Nashim application with identical functionality, styling, and user experience.