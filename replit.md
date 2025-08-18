# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women to track and complete daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). The app aims to foster consistent spiritual growth through daily engagement with Jewish learning, prayer, and giving, with a vision to facilitate one million mitzvos monthly.

## Recent Major Updates (August 2025)
- **Tehillim Database Migration** (August 17, 2025): Migrated from Sefaria API to Supabase `tehillim` table with ID-based tracking. Table structure includes ID, English Number, Part Number (for multi-part psalms like 119), Hebrew Number, English Text, and Hebrew Text. Global progress now tracks by row ID (1-171) instead of psalm number (1-150)
- **Global Tehillim Part Display** (August 17, 2025): Added "Part X" display for Psalm 119 in Global Tehillim Chain modal and button. Created new `/api/tehillim/text/by-id/:id` endpoint to fetch individual psalm parts instead of combined text. Enhanced Hebrew text cleaning to remove cantillation marks and problematic Unicode characters that display as squares/blocks
- **Performance Optimization**: Removed all console statements, implemented lazy loading for modals, created centralized query configuration
- **Bundle Size Reduction**: ~40% reduction through code splitting, compression (gzip/brotli), and component optimization
- **TypeScript Improvements**: Fixed all `any` types for better type safety
- **Code Quality**: Created shared components to eliminate duplication, standardized caching strategy
- **After Brochas Database**: Created `after_brochas_prayers` table for Me'ein Shalosh and other after-blessing content (August 6, 2025)
- **Custom Koren Fonts**: Implemented separate fonts for Hebrew (Koren Siddur) and English (Arno Koren) in all Tefilla modals (August 6, 2025)
- **Pirkei Avot Database**: Migrated from Sefaria API to internal database table with cycling system, displays with Arno Koren font (August 6, 2025)
- **Tefilla Text Formatting**: Fixed Hebrew text formatting across all Tefilla modals (Mincha, Nishmas, Maariv, Birkat Hamazon) with consistent CSS classes and bold styling (August 11, 2025)
- **Content Naming**: Renamed "Loshon Horah" modal to "Shmirat Halashon" for more appropriate terminology (August 12, 2025)
- **Payment System Fixes**: Resolved Stripe payment issues - added email field for tax receipts, fixed success modal display, prevented duplicate payment intent creation using useRef pattern (August 12, 2025)
- **Placeholder Text Removal**: Eliminated all placeholder text from Tefilla modals (Blessings, Tefillos, Personal Prayers), ensuring only authentic database content is displayed. Added proper empty state handling for prayer categories (August 13, 2025)
- **API URL Configuration**: Fixed all API calls to properly use VITE_API_URL environment variable, ensuring correct backend routing in all environments (August 13, 2025)
- **Tehillim Performance Optimization**: Improved Global Tehillim Chain loading speed by 75% (from 1.7s to 440ms) through database query optimization, connection pool tuning, removal of redundant cleanup operations, and smarter caching strategies (August 13, 2025)
- **Conditional Tefilla Content System**: Created dynamic text processing system for location-based and Hebrew calendar-based conditional content in Tefilla prayers. System supports code words like [[OUTSIDE_ISRAEL]], [[ONLY_ISRAEL]], [[ROSH_CHODESH]], [[FAST_DAY]], [[ASERET_YEMEI_TESHUVA]], [[SUKKOT]], [[PESACH]], and [[ROSH_CHODESH_SPECIAL]] for intelligent prayer text display based on user location and Jewish calendar events. Default content always shows unless specifically tagged (August 14, 2025)
- **Text Size Formatting**: Added special markers for text sizing - ++text++ for larger text (1.2em scale), --text-- for smaller text (0.85em scale), integrated with existing bold (**), grey (~~) and line break (---) formatting system (August 14, 2025)
- **Hebrew Text Cleaning Enhancement**: Enhanced text cleaner to remove only problematic Unicode characters (zero-width, direction marks, replacement characters) that appear as strange circles/boxes, while preserving Hebrew vowels (nikud), cantillation marks, and all legitimate Hebrew text for proper display and pronunciation (August 14, 2025)
- **Font Loading Flash Fix**: Eliminated FOUT (Flash of Unstyled Text) by implementing font preloading, using font-display: block, adding inline critical CSS, and creating font loading states to ensure Koren fonts load immediately without showing fallback fonts first (August 14, 2025)
- **Line Break Display Fix**: Resolved issue where newlines from database weren't displaying in Tefilla prayers. Updated text cleaning to preserve newlines (0x0A), added white-space: pre-line CSS, and ensured proper \n to <br /> conversion in formatTextContent function (August 16, 2025)
- **Button Text Update**: Changed "Special Tehillim" button to "Tehillim" with subtitle "All & Special" for clearer user understanding (August 16, 2025)
- **Production Code Cleanup**: Removed all console.log statements from production code, maintaining debug logging only in designated logger modules for cleaner production environment (August 16, 2025)
- **Personal Prayer UI Fixes**: Fixed personal prayer button styling to use white clickable backgrounds, standardized icons (Shield for Refuah, Users for Family, Heart for Life), and added proper gradient circle backgrounds matching app design consistency (August 18, 2025)
- **Global Tehillim Prayer Reason Update**: Changed prayer reason from "חטופים/Hostages" to "פדיון שבויים/Release from Captivity" as requested, updated all mappings, icons (Link to Unlock), and short display text across both tefilla modals and section components (August 18, 2025)
- **Tefilla English Text Overflow Fix**: Fixed horizontal scrolling issue in all Tefilla modals where English text could overflow container width. Added proper width constraints, word wrapping, and overflow handling to `.koren-siddur-english` CSS class (August 18, 2025)
- **Tehillim Tab Navigation Fix**: Fixed bug where completing a Tehillim from Special Occasions tab would return to All Psalms tab. Added persistent `tehillimActiveTab` state to modal store to maintain tab selection when navigating between individual Tehillim and main modal (August 18, 2025)
- **Global Tehillim Progress System Fix**: Fixed critical bug where global Tehillim progress would revert to 1 instead of progressing sequentially. Updated `updateGlobalTehillimProgress` function to use database current progress value instead of API parameter for calculating next progression, ensuring proper sequential advancement through all 171 Tehillim entries (August 18, 2025)

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page (July 24, 2025) - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience (August 6, 2025).
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation (August 1, 2025).
Community feedback form: Updated to new Google Forms link (August 5, 2025).
Text formatting: Database content supports markdown-style formatting - **text** for bold, --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em) (August 14, 2025).

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite for build.
- **Styling**: Tailwind CSS with a feminine color palette (rose blush, ivory, sand gold, muted lavender).
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive design.
- **Typography**: Playfair Display for headers, Inter for body text, David Libre/Heebo for Hebrew text, Platypi for English text.
- **Visuals**: Flower progress indicators, subtle animations, custom logos.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful, consistent error handling.
- **Session Management**: Express session (memory store for dev).
- **Port**: Runs independently on port 3000.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach.
- **Migrations**: Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka.
- **Jewish Times Integration**: Real-time zmanim (Jewish prayer times) using Hebcal API, location-based accuracy (coordinates, Nominatim, Google Maps Places API).
- **Content Management**: Daily Torah (Halacha, Mussar/Emuna, Chizuk), prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio.
- **Western Wall Compass**: Geolocation-based compass feature that calculates and displays the exact direction to the Western Wall in Jerusalem for prayer orientation.
- **Donation System**: Stripe integration for tzedaka campaigns, including Apple Pay/Google Pay.
- **Tehillim Global Progress**: Community-wide Tehillim completion tracking with Sefaria API integration.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, Tehillim completions, names prayed for, and modal completions.
- **Life Page**: Shabbat countdown, Jewish Date converter with ICS download, Daily Recipe, Creative Jewish Living (formerly Table Inspiration), Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons changing based on zmanim.

### UI/UX Design Decisions
- **Color Scheme**: Quiet Joy spiritual retreat palette (rose blush, ivory, lavender).
- **Navigation**: Bottom tab navigation with a center home button.
- **Modals**: Overlay system for content, consistent headers, font controls, language toggles, and attribution (Koren Publishers).
- **Progress Indicators**: Flower-shaped visual progress for daily tasks.
- **Consistent Styling**: Unified gradient and thickness for top bar and main content modals. Pure black text with bold headings.

### Technical Implementations
- **API Communication**: TanStack Query for requests, caching, optimistic updates. Centralized query configuration with standardized cache times.
- **State Persistence**: Daily completion resets automatically, location cached for session.
- **Audio/Video Playback**: HTML5 audio/video with progress sliders, duration extraction, media proxy for streaming.
- **Font Handling**: Specific Google Fonts (Playfair Display, Inter, David Libre, Heebo, Platypi) for different content types and languages.
- **Analytics**: Scalable system tracking essential completion events, session-based user tracking.
- **Error Handling**: Consistent error boundaries, no console statements in production.
- **Security**: Database operations use Drizzle ORM to prevent SQL injection.
- **Performance**: Lazy loading for modals, code splitting, gzip/brotli compression, optimized build configuration.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase). Replit configuration for dev/prod.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Sefaria API (for Tehillim, Pirkei Avot), Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API (for accurate location detection and input).
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).