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