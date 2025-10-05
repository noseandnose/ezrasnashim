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
Text formatting: Database content supports markdown-style formatting - **text** for bold, ##text## for title text (bigger and bold), --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em), [[text]] for grey box content. All formatting works identically for both English and Hebrew text. Footnote formatting automatically converts numbered references (e.g., ". 39 Rashi" or ". - 39 Rashi") to small superscripts for better readability, removing any "- " prefixes. Individual weekday conditional formatters available ([[MONDAY]], [[TUESDAY]], etc.) for day-specific content display.
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
- **Modals**: Fullscreen overlay system for major content, with consistent headers, font controls, language toggles, and attribution. Direct fullscreen access for all Tefilla prayers (Morning Brochas/Shacharis, Maariv) and Tehillim sections - no intermediate modals.

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
- **Unified Admin Interface**: Complete admin dashboard at `/admin` with secure authentication featuring four main tabs: Messages (daily inspiration messages), Recipes (daily recipe management with image upload), Table Inspirations (table setting content with multiple image support), and Notifications (push notification history). All content management includes full CRUD operations with proper validation and security controls.
- **Secure Image Upload System**: Object storage integration with authenticated image upload functionality for both recipes and table inspirations, supporting both URL input and direct file upload with proper access control.
- **Audio Auto-Completion**: Daily Chizuk and Daily Emuna audio content automatically triggers completion when users finish listening, enhancing user engagement.
- **Mobile App Support**: Enhanced detection and user guidance for mobile app wrappers (FlutterFlow, etc.) with intelligent permission prompts for location, compass, and notifications. Provides step-by-step instructions for enabling native app permissions on iOS/Android.

### Recent Maintenance (October 5, 2025)
- **Console Log Cleanup**: Fixed critical infinite recursion bug in logger.ts. Wrapped all development debug logs with environment checks (import.meta.env.DEV for client, process.env.NODE_ENV for server) to reduce production noise while preserving all error logging. Cleaned up verbose API request/response logs, calendar generation debug logs, and recipe creation logs.
- **TODO Cleanup**: Removed inline TODO comments from server/routes.ts (notification/reminder and minhag customization feature suggestions). These items are documented as future enhancements in audit reports.
- **Error Boundaries**: Added granular error boundaries around all main sections (HomeSection, TorahSection, TefillaSection, TzedakaSection, TableSection) for isolated error handling. If one section fails, users can still navigate to and use other sections.
- **Performance Optimization**: Implemented lazy loading for all section components (home.tsx, torah-section.tsx, tefilla-section.tsx, tzedaka-section.tsx, table-section.tsx), reducing home bundle by 58.65 KB (14.71 KB gzipped) - from 449 KB to 391 KB. Fixed Suspense/ErrorBoundary nesting order to properly handle lazy loading promises.
- **Cache Persistence**: Added React Query cache persistence to localStorage with 24-hour retention, reducing subsequent page load times. Includes robust storage availability checks for privacy mode/disabled storage, smart filtering to exclude sensitive data (user/admin/progress/statistics/auth/session/notification/subscription endpoints), and graceful degradation if persistence fails.
- **Push Notification Reliability**: Enhanced push notification system with subscription validation before sending, reducing 17% failure rate. Implemented conservative error handling that only removes subscriptions on terminal errors (400/404/410) while preserving valid subscriptions during transient issues (401/403/429/5xx). Added retry logic with exponential backoff for failed sends.
- **Code Quality**: Zero TypeScript errors maintained. All changes conservative to preserve functionality.

### Recent Bug Fixes (September 17, 2025)
- **Error Handling**: Added robust fallback UI for Torah/Tefilla content sections to prevent blank screens when API calls fail
- **Font Loading**: Fixed Hebrew font loading issues (VC-Koren-Light, Koren Siddur) with proper preloading and font-display:swap
- **Database Stability**: Optimized connection pool from 100 to 15 connections with min 0 to prevent Supabase free tier exhaustion
- **User Experience**: Added user-friendly error messages for failed API calls with specific HTTP status handling
- **Data Prefetching**: Implemented prefetching for prayer modals (Mincha, Maariv, Nishmas, Morning Prayers) to prevent empty content
- **Error Recovery**: Added error states with "Temporarily unavailable" messages instead of blank screens
- **Progressive Enhancement**: Content sections now show loading states and gracefully degrade on errors

## Technical Implementations
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