# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application designed for Jewish women to engage with and track daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). The app aims to promote consistent spiritual growth through daily interaction with Jewish learning, prayer, and giving. The overarching goal is to facilitate one million mitzvos monthly, serving as a significant tool for spiritual development and community involvement.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation.
Community feedback form: Updated to new Google Forms link.
Text formatting: Database content supports markdown-style formatting - **text** for bold, ##text## for title text (bigger and bold), --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em), [[text]] for grey box content. All formatting works identically for both English and Hebrew text. Footnote formatting automatically converts numbered references (e.g., ". 39 Rashi" or ". - 39 Rashi") to small superscripts for better readability, removing any "- " prefixes. Individual weekday conditional formatters available ([[MONDAY]], [[TUESDAY]], etc.) for day-specific content display.
Compass alignment message: When compass is aligned with Jerusalem, displays "Your heart is in the right place" instead of technical alignment message.
Compass visual enhancements: Center heart doubled in size (w-8 h-8), BH icons 20% bigger (w-8 h-8), both BH Green icon and center heart pulse when aligned.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite.
- **Styling**: Tailwind CSS with a feminine color palette.
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing, supporting full URL routing and browser navigation.
- **Design**: Mobile-first responsive, PWA functionality (Add to Home Screen, offline caching).
- **Typography**: Playfair Display (headers), Inter (body), David Libre/Heebo (Hebrew), Platypi (English), Koren Siddur (Tefilla). Font preloading for FOUT prevention.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients.
- **Modals**: Fullscreen overlay system for major content with consistent headers, font controls, language toggles, and attribution. Direct fullscreen access for all Tefilla prayers and Tehillim sections.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful with consistent error handling.
- **Session Management**: Express session.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach and Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.
- **Specific Tables**: `tehillim`, `after_brochas_prayers`, `pirkei_avot`, `daily_recipes`.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka, resetting at local midnight.
- **Jewish Times Integration**: Real-time zmanim based on location.
- **Content Management**: Daily Torah, prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio; dynamic prayer text based on location and Hebrew calendar.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation.
- **Donation System**: Stripe integration for tzedaka campaigns with frontend-driven payment confirmation.
- **Tehillim Global Progress**: Community-wide Tehillim completion tracking.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, and modal completions.
- **Life Page**: Shabbat countdown, Jewish Date converter (with ICS download), Daily Recipe, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Text Cleaning**: Enhanced Hebrew text cleaning for vowel/cantillation preservation and newline display.
- **Dynamic Thank You Messages**: Custom thank you messages for daily recipes with markdown link support.
- **Unified Admin Interface**: Comprehensive admin dashboard at `/admin` for Messages, Recipes, Table Inspirations, and Notifications with full CRUD operations, authentication, and security controls.
- **Secure Image Upload System**: Object storage integration with authenticated image upload for recipes and table inspirations, supporting URL input and direct file upload.
- **Audio Auto-Completion**: Daily Chizuk and Daily Emuna audio content auto-completes on listening.
- **Mobile App Support**: Enhanced detection and user guidance for mobile app wrappers with intelligent permission prompts and step-by-step instructions for native app permissions.
- **PWA Enhancements**: Bottom navigation positioning, service worker cache updates, compass haptic feedback on alignment, smart install prompts, and improved service worker reliability.
- **Hebrew Date Timezone Fix**: Corrected Hebrew date calculation to use user's browser timezone.
- **Mobile Hyperlink Spacing Fix**: Addressed unwanted spacing around inline hyperlinks on mobile.
- **Mazal Tov Message Fix**: Corrected congratulations modal display upon daily task completion.
- **Mobile Performance Optimizations**: Enhanced resource loading, improved viewport settings, consolidated Google Fonts, CSS containment, and optimized scroll listeners.
- **Error Boundaries**: Granular error boundaries for main sections for isolated error handling.
- **Push Notification Reliability**: Enhanced push notification system with subscription validation and retry logic.
- **Error Handling**: Robust fallback UI for content sections, user-friendly error messages, loading states, and graceful degradation.
- **Font Loading**: Fixed Hebrew font loading issues with preloading and `font-display:swap`.
- **Database Stability**: Optimized connection pool.
- **Data Prefetching**: Implemented prefetching for prayer modals.
- **Security**: Drizzle ORM for SQL injection prevention.
- **Performance**: Lazy loading, code splitting, compression, optimized build, optimized Tehillim chain loading.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).

## Recent Critical Fixes (October 19, 2025)
- **PWA Cache Busting Fix**: Fixed fundamental issue where service worker file (sw.js) was being cached with 1-year "immutable" header, preventing PWA users from receiving updates. Server now serves sw.js with no-cache headers (`no-store, no-cache, must-revalidate`). Added timestamp query parameter to SW registration (`/sw.js?v=${Date.now()}`) to force browser checks on every page load. Updated SW version to v5.2-20251019. Users now receive updates within 30 seconds of deployment.
- **Header Positioning Fix**: Completely resolved header overlap and content visibility issues. Removed all negative margins (-mt-1) from sections that were pulling content behind header. Removed redundant scroll containers (overflow-y-auto h-full) from sections - content-area now handles all scrolling. Added 20px spacer divs with bg-gradient-soft background to all sections, creating seamless visual connection between header and content while ensuring Hebrew date and all top content fully visible. Header height: max(56px, safe-area-inset-top + 46px). Content properly positioned below header across all pages (Home, Torah, Tefilla, Tzedaka, Life, Statistics) without gaps or overlaps.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).
- **Analytics**: Google Analytics (G-7S9ND60DR6).