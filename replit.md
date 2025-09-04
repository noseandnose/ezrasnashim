# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women to track and complete daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). The app aims to foster consistent spiritual growth through daily engagement with Jewish learning, prayer, and giving. The vision is to facilitate one million mitzvos monthly, serving as a vital tool for spiritual development and community engagement.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation.
Community feedback form: Updated to new Google Forms link.
Text formatting: Database content supports markdown-style formatting - **text** for bold, --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em), [[text]] for grey box content. Footnote formatting automatically converts numbered references (e.g., ". 39 Rashi" or ". - 39 Rashi") to small superscripts for better readability, removing any "- " prefixes.
Compass alignment message: When compass is aligned with Jerusalem, displays "Your heart is in the right place" instead of technical alignment message.
Compass visual enhancements: Center heart doubled in size (w-8 h-8), BH icons 20% bigger (w-8 h-8), both BH Green icon and center heart pulse when aligned.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite for build.
- **Styling**: Tailwind CSS with a feminine color palette (rose blush, ivory, sand gold, muted lavender).
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing with full URL routing system (August 2025) - supports direct linking to all sections (/, /torah, /tefilla, /tzedaka, /life), browser back/forward navigation, and backward compatibility redirect from /table to /life.
- **Design**: Mobile-first responsive design, PWA functionality (Add to Home Screen, service worker for offline caching).
- **Typography**: Playfair Display for headers, Inter for body text, David Libre/Heebo for Hebrew text, Platypi for English text, Koren Siddur for Tefilla content. Font preloading and `font-display: block` for FOUT prevention.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients for top bar and modals.
- **Modals**: Fullscreen overlay system for major content, with consistent headers, font controls, language toggles, and attribution. Direct fullscreen access for key prayers and Tehillim sections.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful, consistent error handling.
- **Session Management**: Express session.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach and Drizzle Kit for migrations.
- **Connection**: Node-postgres (pg) with pooling.
- **Specific Tables**: `tehillim` (ID-based tracking), `after_brochas_prayers`, `pirkei_avot`, `daily_recipes`.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka. Ensures all daily activities reset at local midnight for consistency.
- **Jewish Times Integration**: Real-time zmanim (Jewish prayer times) based on location.
- **Content Management**: Daily Torah (Halacha, Mussar/Emuna, Chizuk), prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio. Dynamic prayer text based on location and Hebrew calendar events.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation, with robust Android support and stabilization.
- **Donation System**: Stripe integration for tzedaka campaigns with frontend-driven payment confirmation for idempotency.
- **Tehillim Global Progress**: Community-wide Tehillim completion tracking and automatic advancement.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, and modal completions.
- **Life Page**: Shabbat countdown, Jewish Date converter (with ICS download), Daily Recipe, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Text Cleaning**: Enhanced Hebrew text cleaning to preserve vowels/cantillation and ensure proper display of newlines.
- **Dynamic Thank You Messages**: Custom thank you messages for daily recipes with markdown link support, replacing hardcoded attributions.
- **Admin Content Management**: Recipe management interface at `/admin/recipes` for creating and managing daily recipes with custom thank you messages.
- **Audio Auto-Completion**: Daily Chizuk and Daily Emuna audio content automatically triggers completion when users finish listening, enhancing user engagement.
- **Mobile App Support**: Enhanced detection and user guidance for mobile app wrappers (FlutterFlow, etc.) with intelligent permission prompts for location, compass, and notifications. Provides step-by-step instructions for enabling native app permissions on iOS/Android.

### Technical Implementations
- **API Communication**: TanStack Query for requests, caching, optimistic updates, with centralized configuration.
- **State Persistence**: Daily completion resets automatically; location cached per session.
- **Audio/Video Playback**: HTML5 audio/video with progress sliders and media proxy.
- **Analytics**: Scalable system tracking essential completion events and session-based user tracking. Google Analytics (G-7S9ND60DR6) integrated for comprehensive user behavior tracking with automatic page view tracking and custom event capabilities.
- **Error Handling**: Consistent error boundaries.
- **Security**: Drizzle ORM for SQL injection prevention.
- **Performance**: Lazy loading, code splitting, gzip/brotli compression, optimized build configuration, optimized Tehillim chain loading.
- **Code Quality**: TypeScript compilation warnings present but non-blocking for production (September 2, 2025).
- **UX Fix**: Resolved dark overlay issue with global tehillim modal - removed auto-redirect behavior for special-tehillim modal (August 28, 2025).
- **Compass Fix**: Fixed "Try Again" button in Kotel compass to properly restart without redirecting users back to tefilla page (September 2, 2025).
- **Production Audit**: Comprehensive audit completed - application confirmed ready for launch with all core features functional (September 2, 2025).
- **Conditional Text Fix**: Fixed ASERET_YEMEI_TESHUVA conditional text processing to properly hide seasonal content when not in that period (September 2, 2025).
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API.
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).