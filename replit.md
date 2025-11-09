# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women to engage with and track daily spiritual practices in Torah study, Tefilla (prayer), and Tzedaka (charity). Its purpose is to promote consistent spiritual growth through daily interaction with Jewish learning, prayer, and giving. The project's ambition is to facilitate one million mitzvos monthly, serving as a significant tool for spiritual development and community involvement.

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
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive, PWA functionality (Add to Home Screen, offline caching).
- **Typography**: Playfair Display (headers), Inter (body), David Libre/Heebo (Hebrew), Platypi (English), Koren Siddur (Tefilla). Font preloading with font-display:optional strategy to prevent FOUC (Flash of Unstyled Content) and layout shift. All fonts loaded via single source in index.html with system font fallbacks.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients.
- **Modals**: Fullscreen overlay system for major content with consistent headers, font controls, language toggles, and attribution. Direct fullscreen access for all Tefilla prayers and Tehillim sections.
- **UI/UX Decisions**: Pure CSS safe area detection (`env(safe-area-inset-*)`) for zero layout shift and optimal performance across devices, replacing JavaScript-based solutions. Enhanced audio player UI with precise positioning and improved drag responsiveness. Navigation arrows for media items are consistently positioned and fully functional in fullscreen mode. Lazy section mounting strategy for instant page transitions - sections mount on first visit and stay mounted for zero-delay navigation on subsequent visits.

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

### Object Storage
- **Provider**: AWS S3 with CloudFront CDN.
- **SDK**: AWS SDK v3.
- **Upload Flow**: Admin requests presigned PUT URL → Direct upload to S3 → Set ACL metadata → Return CDN URL.
- **CDN Integration**: Objects served via CDN or Express /objects/ route.
- **Required Environment Variables**: `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `CDN_BASE_URL`.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka.
- **Jewish Times Integration**: Real-time zmanim based on location.
- **Content Management**: Daily Torah, prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio; dynamic prayer text.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation.
- **Donation System**: Stripe integration for tzedaka.
- **Tehillim Global Progress**: Community-wide tracking.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, modal completions.
- **Life Page**: Shabbat countdown, Jewish Date converter, Daily Recipe, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Text Cleaning**: Enhanced Hebrew text cleaning.
- **Dynamic Thank You Messages**: Custom messages for daily recipes.
- **Unified Admin Interface**: Comprehensive dashboard at `/admin` for Messages, Recipes, Table Inspirations, Notifications with CRUD.
- **Secure Image Upload System**: Object storage integration with authenticated image upload.
- **Audio Auto-Completion**: Daily Chizuk and Emuna audio content auto-completes.
- **Mobile App Support**: Enhanced detection and user guidance for mobile app wrappers.
- **PWA Enhancements**: Bottom navigation, service worker cache updates, compass haptic feedback, smart install prompts.
- **Hebrew Date Timezone Fix**: Corrected Hebrew date calculation to use user's browser timezone.
- **Performance**: Lazy loading, code splitting, compression, optimized build, optimized Tehillim chain loading.
- **Security**: Drizzle ORM for SQL injection prevention.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).
- **Automated Cache Busting**: Automated version control and cache management with build timestamp and `/api/version` endpoint. Service worker uses stale-while-revalidate for unversioned assets and bypasses caching for audio/API endpoints (`/api/version`, `/api/media-proxy/`).
- **Non-Intrusive Version Checks**: Version checking disabled during active sessions to prevent interrupting users during audio or prayers. Updates only check once every 24 hours and only prompt for critical updates. Regular updates apply automatically on next app launch.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).
- **Analytics**: Google Analytics (G-7S9ND60DR6).

## Known Platform Issues
- **Replit Cartographer Warnings**: The `@replit/vite-plugin-cartographer` plugin (v0.4.2) generates "TypeError: traverse is not a function" warnings during development builds due to an internal plugin bug. These warnings are cosmetic only and do not affect application functionality. The warnings appear because the plugin has an internal issue with its @babel/traverse dependency loading. This is a known Replit platform issue that cannot be resolved without modifying forbidden configuration files (vite.config.ts). The application builds and runs correctly despite these warnings.