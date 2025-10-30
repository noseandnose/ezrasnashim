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

### Object Storage
- **Provider**: AWS S3 with CloudFront CDN.
- **SDK**: AWS SDK v3 (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner).
- **Upload Directory**: `uploads/` (hardcoded constant in server/objectStorage.ts).
- **Upload Flow**: Admin requests presigned PUT URL → Direct upload to S3 → Set ACL metadata → Return CDN URL.
- **CDN Integration**: Objects served via CDN when CDN_BASE_URL is configured, otherwise via Express /objects/ route.
- **Required Environment Variables**:
  - `AWS_S3_BUCKET`: S3 bucket name
  - `AWS_ACCESS_KEY_ID`: AWS access key ID (standard AWS credential)
  - `AWS_SECRET_ACCESS_KEY`: AWS secret access key (standard AWS credential)
  - `AWS_REGION`: AWS region (defaults to us-east-1)
  - `CDN_BASE_URL`: Base URL for CDN (optional, e.g., https://cdn.example.com)

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

## Recent Updates (October 21, 2025)
- **AWS S3 Object Storage Migration**: Migrated from Google Cloud Storage to AWS S3 for production deployment. Implemented presigned URL upload system with CDN integration. Objects stored in S3 bucket with configurable CDN serving. ACL metadata system preserved using S3 object metadata. Upload directory hardcoded as `uploads/`. Full environment variable configuration for AWS credentials and bucket settings.
- **Mobile Hyperlink Fix**: Fixed hyperlink click issues on mobile devices by removing restrictive CSS (`-webkit-touch-callout: none`, `user-select: none`) from body element. Links now properly allow touch callout and selection while buttons maintain optimized touch behavior.

## Recent Critical Fixes (October 30, 2025)
- **PWA Audio Playback & Version Check Fix**: Fixed two critical PWA issues: (1) Audio player not working in installed PWA mode (stayed at 0:00, play button unresponsive) - service worker was intercepting audio streaming requests and returning cached HTML on transient failures. (2) Version check error "SyntaxError: Unexpected token '<'" - /api/version endpoint was being cached by service worker and serving stale HTML. Solution: Updated service worker to bypass caching entirely for audio/video requests (destination checks, media extensions, range headers, /api/media-proxy/ paths) and /api/version endpoint. Removed /api/version from CRITICAL_API_PATTERNS. Updated cache version to v1.0.1-1761803468677 to force cache refresh. Audio now streams directly to network without interference, version checks always fetch fresh JSON.

## Previous Critical Fixes (October 29, 2025)
- **PWA iOS Safe Area Fix with Zero Layout Shift**: Resolved critical issue where header covered content in iOS PWA mode, and eliminated visible layout shift on page load. Header uses `position: fixed; top: 0` with `padding-top: calc(var(--safe-area-top-resolved) + 0.625rem)`. The `--safe-area-top-resolved` CSS variable is set via `useLayoutEffect` (before first paint) using `window.visualViewport.offsetTop` for immediate access to safe-area values, with 44px fallback for iOS standalone mode when measurements are near zero. This prevents the previous issue where `env(safe-area-inset-top)` resolved asynchronously causing visible jump. Content padding dynamically reads header's computed height and ResizeObserver tracks changes to keep layout synchronized. This ensures zero layout shift on load and all content remains visible across all device modes (PWA, browser, webview, notch/no-notch).

## Previous Critical Fixes (October 19, 2025)
- **Automated Cache Busting System**: Implemented comprehensive automated version control and cache management to eliminate stale content issues. Auto-generates CACHE_VERSION with build timestamp via `scripts/generate-version.js`, ensuring every deployment gets unique cache keys. Added `/api/version` endpoint with no-cache headers for update detection. Service worker now uses stale-while-revalidate strategy for unversioned assets (manifest.json, icons) while maintaining cache-first for versioned bundles. Client-side version checking in main.tsx polls `/api/version` every 60 seconds, automatically clearing caches and reloading when new version detected. Server serves manifest/icons with 1-hour max-age + 24-hour stale-while-revalidate headers. Build script must run `node scripts/generate-version.js` before deployment to update version.json and sw.js CACHE_VERSION.
- **Fullscreen Modal Header Fix**: Fixed header positioning in fullscreen prayer modals (Mincha, Maariv, etc.) by updating paddingTop to use `env(safe-area-inset-top)` instead of hardcoded `var(--safe-area-top)`, ensuring header and close buttons are visible and clickable on all devices including those with notches.
- **Header Positioning Fix**: Completely resolved header overlap and content visibility issues. Removed all negative margins (-mt-1) from sections that were pulling content behind header. Removed redundant scroll containers (overflow-y-auto h-full) from sections - content-area now handles all scrolling. Added 20px spacer divs with bg-gradient-soft background to all sections, creating seamless visual connection between header and content while ensuring Hebrew date and all top content fully visible. Header height: max(56px, safe-area-inset-top + 46px). Content properly positioned below header across all pages (Home, Torah, Tefilla, Tzedaka, Life, Statistics) without gaps or overlaps.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).
- **Analytics**: Google Analytics (G-7S9ND60DR6).