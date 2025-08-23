# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women to track and complete daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). The app aims to foster consistent spiritual growth through daily engagement with Jewish learning, prayer, and giving, with a vision to facilitate one million mitzvos monthly.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation.
Community feedback form: Updated to new Google Forms link.
Text formatting: Database content supports markdown-style formatting - **text** for bold, --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em), [[text]] for grey box content.
Compass alignment message: When compass is aligned with Jerusalem, displays "Your heart is in the right place" instead of technical alignment message.
Compass visual enhancements: Center heart doubled in size (w-8 h-8), BH icons 20% bigger (w-8 h-8), both BH Green icon and center heart pulse when aligned.

## Recent Changes (August 23, 2025)
### Comprehensive Android Compass System Overhaul (August 23, 2025)
- **MAJOR REWRITE**: Complete Android compass system rebuilt from ground up to fix all critical issues
- **Universal Android Support**: Fixed compass for Android 4.x through modern versions across all browsers (Chrome, Firefox, Samsung Internet)
- **Direction Accuracy**: Implemented proper magnetic heading calculation specific to each Android version and browser type
- **Location Stability**: Enhanced 15-minute caching system prevents location jumping, validates coordinates, caches location names
- **Smart Event Handling**: Comprehensive event listener selection (deviceorientationabsolute vs deviceorientation) based on device capabilities
- **Enhanced Buffering**: 12-reading buffer with circular mean calculation and exponential decay weighting for stable compass readings
- **Robust Error Recovery**: Multiple fallback systems ensure compass works even with permission/hardware issues
- **Android UX**: Added device-specific calibration tips and optimized geolocation timeouts for Android reliability
- **Performance**: 40ms updates, validated heading ranges, enhanced cleanup for memory efficiency

## Previous Changes (August 22, 2025)
### Comprehensive Pre-Launch Audit (August 22, 2025)
- **Code Quality**: Enhanced TypeScript with strict mode, fixed 247+ errors, removed 164+ console statements
- **Performance**: Added performance monitoring, enhanced service worker, production build optimization
- **Reliability**: Implemented global ErrorBoundary, network resilience with retry logic, comprehensive error handling
- **Security**: Fixed multiple npm audit vulnerabilities, enhanced input sanitization verification
- **Accessibility**: Added accessibility manager, focus trap implementation, reduced motion support
- **Daily Progress**: Verified robust state management with single source of truth and midnight reset
- **Feature Verification**: All regression tests passing - Tehillim, progress bars, compass, Shabbos features
- **Production Ready**: Enhanced Vite configuration, compression, source maps, bundle optimization

## Previous Changes (August 22, 2025)
### Comprehensive Worldwide Timezone Detection (August 22, 2025)
- **Global Timezone Coverage**: Replaced basic coordinate-based timezone detection with comprehensive worldwide system using geo-tz library
- **Accurate Detection**: Now properly detects timezones for all countries and regions worldwide including India, China, Brazil, Australia, Africa, etc.
- **Previous Issue**: South Africa was incorrectly using Europe/London instead of Africa/Johannesburg causing 1+ hour prayer time errors
- **Enhanced Fallback**: Ocean areas use intelligent UTC offset calculation when exact timezone unavailable
- **Performance**: Fast timezone lookup with detailed logging for debugging and verification

### Hebrew Date Calculator Fullscreen Conversion (August 22, 2025)
- **Fullscreen Experience**: Converted Hebrew Date Calculator from modal to fullscreen display for better usability
- **Enhanced Design**: Larger text, improved spacing, better visual hierarchy with same functionality
- **Consistent UI**: Matches other fullscreen modals with proper background gradient and responsive design
- **Accessibility**: Larger touch targets and clearer labels for mobile users
- **Fixed Button Trigger**: Updated Life page button to trigger correct fullscreen modal instead of old modal
- **Compact Layout**: Hebrew Date display now shows label and date on same line to save space
- **Better Date Selection**: Restored separate month/day/year dropdowns for easier year selection instead of single date input

## Recent Changes (August 21, 2025)
### Launch Preparation Optimizations
- **Compass Stabilization**: Enhanced with weighted averaging (5-reading buffer), time-based throttling (100ms intervals), and smoother CSS transitions (0.8s cubic-bezier). Eliminates jumping and floating issues.
- **Compass Simplification**: Removed magnetic declination, smoothing filters, and tilt compensation. Now uses native device heading only with Jerusalem fallback (31.7767, 35.2345).
- **Modal System**: All major content modals migrated to fullscreen. Translation buttons now conditionally shown only when translations exist.
- **Performance**: Implemented lazy loading for all routes, added PWA service worker for offline support, optimized event handlers with debouncing.
- **Bug Fixes**: Fixed Personal Prayers JSON parsing error, resolved TypeScript compilation issues.

### Women's Prayers Completion Tracking Fix (August 21, 2025)
- **Fixed Critical Bug**: Resolved issue where all Women's Prayers were marking each other as complete
- **Unique Prayer Tracking**: Each individual prayer now uses unique ID-based keys (`womens-prayer-${id}`) instead of shared category keys
- **Individual Tracking**: Every prayer tracks its completion status completely independently
- **LocalStorage Persistence**: Modal completions persist across page refreshes and navigation with date-based tracking
- **Automatic Reset**: All completions automatically reset at midnight for the new day
- **Data Cleanup**: Added automatic cleanup of stale completion data older than yesterday
- **Verified Working**: User confirmed all prayers now track completion independently as expected

### UI Enhancements (August 21, 2025)
- **Mazel Tov Modal**: Text now bold with improved visibility using font-bold class and pure black color
- **Share Modal Browser Detection**: iPhone users now see browser-specific instructions - Safari shows "at the bottom of the screen", Chrome shows "at the top right corner of your screen"
- **Console Cleanup**: Removed all debug console.log statements, fixed deprecated meta tag warning

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite for build.
- **Styling**: Tailwind CSS with a feminine color palette (rose blush, ivory, sand gold, muted lavender).
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive design.
- **Typography**: Playfair Display for headers, Inter for body text, David Libre/Heebo for Hebrew text, Platypi for English text. Koren Siddur font for all Tefilla content.
- **Visuals**: Flower progress indicators, subtle animations, custom logos.
- **PWA Functionality**: Add to Home Screen feature with service worker for offline caching and manifest.json.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful, consistent error handling.
- **Session Management**: Express session.
- **Port**: Runs independently on port 3000.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach.
- **Migrations**: Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.
- **Specific Tables**: `tehillim` (ID-based tracking for 1-171), `after_brochas_prayers`, `pirkei_avot`, `daily_recipes`.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka.
- **Jewish Times Integration**: Real-time zmanim (Jewish prayer times) using Hebcal API, location-based accuracy.
- **Content Management**: Daily Torah (Halacha, Mussar/Emuna, Chizuk), prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio.
- **The Kotel Compass**: Geolocation-based compass for prayer orientation.
- **Donation System**: Stripe integration for tzedaka campaigns.
- **Tehillim Global Progress**: Community-wide Tehillim completion tracking with internal database management.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, and modal completions.
- **Life Page**: Shabbat countdown, Jewish Date converter with ICS download, Daily Recipe, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons changing based on zmanim.
- **Conditional Tefilla Content System**: Dynamic text processing based on location (Israel/Outside Israel) and Hebrew calendar events (Rosh Chodesh, Fast Day, etc.) for intelligent prayer text display.
- **Fullscreen Modals**: Fullscreen viewing capability for major text modals in Torah and Tefilla sections.
- **Direct Fullscreen Prayer Access**: Prayer modals (Morning Brochas, Mincha, Maariv, Nishmas) and Tehillim selections open directly in fullscreen mode when clicked from home page, bypassing regular modal view.
- **Global Tehillim Chain Integration**: Global Tehillim chain opens directly in fullscreen with proper completion tracking and automatic advancement to next psalm in sequence.

### UI/UX Design Decisions
- **Color Scheme**: Quiet Joy spiritual retreat palette (rose blush, ivory, lavender).
- **Navigation**: Bottom tab navigation with a center home button.
- **Modals**: Overlay system for content, consistent headers, font controls, language toggles, and attribution.
- **Progress Indicators**: Flower-shaped visual progress for daily tasks.
- **Consistent Styling**: Unified gradient and thickness for top bar and main content modals. Pure black text with bold headings.
- **Font Display**: Eliminated FOUT (Flash of Unstyled Text) through font preloading and `font-display: block`.

### Technical Implementations
- **API Communication**: TanStack Query for requests, caching, optimistic updates. Centralized query configuration with standardized cache times.
- **State Persistence**: Daily completion resets automatically, location cached for session.
- **Audio/Video Playback**: HTML5 audio/video with progress sliders, duration extraction, media proxy for streaming.
- **Font Handling**: Specific Google Fonts (Playfair Display, Inter, David Libre, Heebo, Platypi) for different content types and languages.
- **Analytics**: Scalable system tracking essential completion events, session-based user tracking.
- **Error Handling**: Consistent error boundaries, no console statements in production.
- **Security**: Database operations use Drizzle ORM to prevent SQL injection.
- **Performance**: Lazy loading for modals, code splitting, gzip/brotli compression, optimized build configuration, optimized Tehillim chain loading.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase).
- **Text Cleaning**: Enhanced Hebrew text cleaning to remove problematic Unicode characters while preserving vowels and cantillation marks. Ensures newlines from database are preserved and displayed correctly.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API (for accurate location detection and input).
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).