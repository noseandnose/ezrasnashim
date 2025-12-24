# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women, focusing on daily spiritual practices in Torah study, Tefilla (prayer), and Tzedaka (charity). Its primary goal is to foster consistent spiritual growth and facilitate one million mitzvos monthly, serving as a tool for spiritual development and community involvement.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation.
Community feedback form: Updated to new Google Forms link.
Text formatting: Database content supports markdown-style formatting - **text** for bold, ##text## for title text (bigger and bold), --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em), [[text]] for grey box content, [link text](url) for hyperlinks. All formatting works identically for both English and Hebrew text. Footnote formatting automatically converts numbered references (e.g., ". 39 Rashi" or ". - 39 Rashi") to small superscripts for better readability, removing any "- " prefixes. Individual weekday conditional formatters available ([[MONDAY]], [[TUESDAY]], etc.) for day-specific content display.
Tefilla conditional formatting: Holiday-specific content using [[CHANUKA]]content[[/CHANUKA]], [[PURIM]]content[[/PURIM]], [[PESACH]]content[[/PESACH]], [[SUKKOT]]content[[/SUKKOT]], [[ROSH_CHODESH]]content[[/ROSH_CHODESH]]. The [[SPECIAL_REMOVE]]content[[/SPECIAL_REMOVE]] tag HIDES content during ANY special day (Rosh Chodesh, Pesach, Sukkot, Chanuka, or Purim). Other conditions: [[FAST_DAY]], [[ASERET_YEMEI_TESHUVA]], [[ONLY_ISRAEL]], [[OUTSIDE_ISRAEL]].
Compass alignment message: When compass is aligned with Jerusalem, displays "Your heart is in the right place" instead of technical alignment message.
Compass visual enhancements: Center heart doubled in size (w-8 h-8), BH icons 20% bigger (w-8 h-8), both BH Green icon and center heart pulse when aligned.
Header layout: Search icon placed next to hamburger menu for quick access. Header shows hamburger menu + search button (left), centered logo, and message button (right). Both sides balanced with flex-1 to keep logo centered.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite.
- **Styling**: Tailwind CSS with a feminine color palette.
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive, PWA functionality.
- **Typography**: Playfair Display (headers), Inter (body), David Libre/Heebo (Hebrew), Platypi (English), Koren Siddur (Tefilla). VC Koren fonts preloaded.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients.
- **Modals**: Fullscreen overlay system with consistent headers, font controls, language toggles, and attribution. Prayer fullscreens include a compass button.
- **UI/UX Decisions**: Pure CSS safe area detection, enhanced audio player UI, lazy section mounting for instant page transitions. Enhanced WebView resume handler (visibilitychange, pageshow, focus events with 5-second threshold) for mobile app support. Implemented AudioContext resume logic for PWA audio fix. Double-click protection on modal close buttons to prevent freezing during rapid interactions.
- **Error Recovery**: Automatic chunk load error detection and recovery - clears caches, unregisters service workers, and reloads to fix white screen issues in mobile apps.
- **Halachic Date Utilities**: getHalachicDateString and isAfterShkia functions for accurate Jewish day boundaries based on sunset.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful with consistent error handling.
- **Session Management**: Express session.
- **Development Environment**: Vite dev server (frontend) on 5173, Express (backend) on 5000. Replit port mapping handled automatically.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach and Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.
- **Specific Tables**: `tehillim`, `after_brochas_prayers`, `pirkei_avot`, `daily_recipes`, `marriage_insights`, `torah_classes`.

### Object Storage
- **Provider**: AWS S3 with CloudFront CDN.
- **SDK**: AWS SDK v3.
- **Upload Flow**: Presigned PUT URLs for direct S3 uploads.
- **CDN Integration**: Objects served via CDN or Express `/objects/` route.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka tracked with offline support.
- **Jewish Times Integration**: Real-time zmanim (Hebcal.com).
- **Content Management**: Daily Torah, prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot, Torah Classes.
- **Torah Classes**: Daily Torah classes section with series content from multiple providers, displayed conditionally when content exists for the day, using date range filtering (fromDate/untilDate) to support scheduled content series.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation, with Android WebView fixes.
- **Donation System**: Stripe integration.
- **Personal Tehillim Chains**: Individual prayer chains with create/find, stats, and shareable links.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking daily/total users, page views, Tehillim completions, names prayed for, modal completions. In-app analytics dashboard, offline queue support with idempotency, and Google Analytics.
- **Life Page**: Shabbat countdown, Daily Recipe, Marriage Insights, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Text Cleaning**: Enhanced Hebrew text cleaning and markdown-style formatting.
- **Unified Admin Interface**: Comprehensive dashboard for content management (Messages, Recipes, Table Inspirations, Notifications) with CRUD and secure image upload.
- **Audio Auto-Completion**: Daily Chizuk and Emuna audio content.
- **Marriage Insights**: Daily wisdom content with search, font controls, and completion tracking.
- **Mobile App Support**: Enhanced detection for mobile app wrappers.
- **PWA Enhancements**: Bottom navigation, service worker cache updates, haptic feedback, smart install prompts.
- **Performance**: Lazy loading, code splitting, compression, optimized build, font optimization, splash screen optimization, server-side in-memory caching.
- **Security**: Drizzle ORM for SQL injection prevention, DOMPurify for HTML sanitization. Admin authentication uses JWT tokens (24h expiry) with bcrypt password hashing. Rate limiting on login endpoint (10 attempts per 15 minutes).
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).
- **Automated Cache Busting**: Version control and cache management with build timestamp, `/api/version` endpoint, and `stale-while-revalidate` service worker. Aggressive update distribution with immediate user prompts and forced hard reloads for critical updates. Push notification registration error handling for restricted environments.

## External Dependencies
- **Payment Processing**: Stripe (donations, Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).
- **Analytics**: Google Analytics (G-7S9ND60DR6).