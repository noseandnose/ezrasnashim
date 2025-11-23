# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application designed for Jewish women to engage with and track daily spiritual practices in Torah study, Tefilla (prayer), and Tzedaka (charity). Its core purpose is to foster consistent spiritual growth through daily interaction with Jewish learning, prayer, and giving. The project aims to facilitate one million mitzvos monthly, serving as a significant tool for spiritual development and community involvement.

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
Header layout: Search icon moved from header to hamburger menu to keep logo perfectly centered. Header now shows only hamburger menu (left), centered logo, and message button (right).
Layout fixes (Nov 2025): Fixed bottom nav positioning and header scrolling issues. Bottom nav now defaults to `--nav-offset: 0px` (flush with safe area), with browser UI offset applied only in Safari browser mode via JavaScript detection. Header ensured to stay fixed at top with additional CSS safeguards. Works correctly across Chrome, Safari, and mobile app wrappers.
Button interaction fix (Nov 2025): Fixed critical button freeze bug in FlutterFlow web view environment. Root cause: FlutterFlow's WebView intermittently detaches React's root event delegation listener during background/resume cycles, causing onClick handlers to stop firing while CSS :active still works. Solution: Implemented DOM Event Bridge (dom-event-bridge.ts) - a resilient capture-phase document listener that bypasses React's synthetic event system entirely. Critical buttons (modal close, etc.) use data-action attributes to invoke handlers directly at the DOM level. The bridge re-attaches itself every 5 seconds to survive FlutterFlow's listener removal, and includes diagnostic logging to detect when React delegation fails. Additionally, removed pointer-events manipulation from modal scroll locking (using overflow-only) to eliminate any CSS-based click blocking. This dual approach ensures buttons remain clickable regardless of FlutterFlow's DOM manipulation.
Push notification fix (Nov 2025): Fixed "Registration failed - storage error" exception that occurred when IndexedDB/Cache Storage is unavailable or restricted (e.g., in incognito mode, certain browser settings, or web view environments). Auto-notification prompt now validates storage availability before attempting service worker registration. Permission manager also checks IndexedDB availability before subscription attempts. This prevents errors while allowing notifications to work in environments where storage is available.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite.
- **Styling**: Tailwind CSS with a feminine color palette.
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive, PWA functionality.
- **Typography**: Playfair Display (headers), Inter (body), David Libre/Heebo (Hebrew), Platypi (English), Koren Siddur (Tefilla). VC Koren fonts preloaded with `font-display:swap` for instant prayer text rendering.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients.
- **Modals**: Fullscreen overlay system for major content with consistent headers, font controls, language toggles, and attribution. Prayer fullscreens include a compass button for quick orientation.
- **UI/UX Decisions**: Pure CSS safe area detection (`env(safe-area-inset-*)`) for zero layout shift. Enhanced audio player UI. Lazy section mounting for instant page transitions.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful with consistent error handling.
- **Session Management**: Express session.
- **Development Environment**: Vite dev server runs on port 5173 (frontend) with `host: '0.0.0.0'` for Replit network accessibility, Express runs on port 5000 (backend/API). Replit port mapping uses subdomain pattern: `<repl-id>-00-<slug>.<workspace>.replit.dev` for default port (5173) and `<repl-id>-00-5000-<slug>.<workspace>.replit.dev` for backend port (5000). Frontend axios client automatically constructs correct backend URL by inserting `-5000` after the `-00-` segment when on Replit domains.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach and Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.
- **Specific Tables**: `tehillim`, `after_brochas_prayers`, `pirkei_avot`, `daily_recipes`, `marriage_insights`.

### Object Storage
- **Provider**: AWS S3 with CloudFront CDN.
- **SDK**: AWS SDK v3.
- **Upload Flow**: Admin requests presigned PUT URL → Direct upload to S3 → Set ACL metadata → Return CDN URL.
- **CDN Integration**: Objects served via CDN or Express `/objects/` route.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka.
- **Jewish Times Integration**: Real-time zmanim based on location (Hebcal.com).
- **Content Management**: Daily Torah, prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio; dynamic prayer text.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation.
- **Donation System**: Stripe integration for tzedaka.
- **Tehillim Global Progress**: Community-wide tracking.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, modal completions via Google Analytics. Analytics deferred via whenIdle.
- **Life Page**: Shabbat countdown, Daily Recipe, Marriage Insights, Creative Jewish Living, Community Feedback. Hebrew Date Converter moved to hamburger menu for better accessibility.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Text Cleaning**: Enhanced Hebrew text cleaning and markdown-style formatting.
- **Dynamic Thank You Messages**: Custom messages for daily recipes.
- **Unified Admin Interface**: Comprehensive dashboard at `/admin` for Messages, Recipes, Table Inspirations, Notifications with CRUD and secure image upload.
- **Audio Auto-Completion**: Daily Chizuk and Emuna audio content auto-completes.
- **Marriage Insights**: Daily marriage wisdom content accessible from Life page with Heart icon button. Features fullscreen modal with font controls, completion tracking, search integration with Hebrew/English keywords, and fresh data refetch on window focus.
- **Mobile App Support**: Enhanced detection and user guidance for mobile app wrappers.
- **PWA Enhancements**: Bottom navigation, service worker cache updates, compass haptic feedback, smart install prompts.
- **Hebrew Date Timezone Fix**: Corrected Hebrew date calculation to use user's browser timezone.
- **Performance**: Lazy loading, code splitting, compression, optimized build, optimized Tehillim chain loading, font optimization, splash screen optimization. Server-side in-memory caching for daily Torah, static prayers, Pirkei Avot, and Tehillim text. Re-enabled `refetchOnWindowFocus` and visibility change listener for critical queries to prevent stale state.
- **Security**: Drizzle ORM for SQL injection prevention. HTML Sanitization using DOMPurify for user-generated content.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).
- **Automated Cache Busting**: Automated version control and cache management with build timestamp and `/api/version` endpoint. Service worker uses `stale-while-revalidate`.
- **Aggressive Update Distribution**: Version checking runs on app start (not just window focus), service worker update check on every app launch. When update detected, users get immediate prompt. Refresh button clears all caches and forces hard reload to ensure fresh content. Cache version regenerated automatically via `node scripts/generate-version.js` after code changes to ensure users receive updates. Admin endpoint `/api/regenerate-cache-version` available for manual post-deployment triggers. Critical updates support via env vars (CRITICAL_UPDATE=true, RELEASE_NOTES) with 5-minute auto-refresh countdown.

## External Dependencies
- **Payment Processing**: Stripe (donations, Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).
- **Analytics**: Google Analytics (G-7S9ND60DR6).