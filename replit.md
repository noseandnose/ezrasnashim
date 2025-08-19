# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application designed for Jewish women to engage with and track daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). Its core purpose is to foster consistent spiritual growth through daily interaction with Jewish learning, prayer, and giving. The overarching vision is to facilitate one million mitzvos (good deeds) monthly, enhancing spiritual consistency and community engagement.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page - temporary reversible changes applied.
Tefilla font: All prayer content in Tefilla modals now uses Koren Siddur font for authentic prayer experience.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation.
Community feedback form: Updated to new Google Forms link.
Text formatting: Database content supports markdown-style formatting - **text** for bold, --- for line breaks, ~~text~~ for greyed out text, ++text++ for larger text (1.2em), --text-- for smaller text (0.85em).

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript, Vite for build.
- **Styling**: Tailwind CSS with a feminine color palette (rose blush, ivory, sand gold, muted lavender).
- **UI Components**: Radix UI primitives and shadcn/ui.
- **State Management**: Zustand for client state, TanStack Query for server state.
- **Routing**: Wouter for lightweight client-side routing.
- **Design**: Mobile-first responsive design, PWA functionality with add-to-home-screen feature.
- **Typography**: Playfair Display for headers, Inter for body text, David Libre/Heebo for Hebrew text, Platypi for English text, custom Koren fonts for Tefilla.
- **Visuals**: Flower progress indicators, subtle animations, custom logos, consistent gradients and styling for UI elements.
- **UI/UX Decisions**: Bottom tab navigation with a center home button, overlay modals with consistent headers, font controls, language toggles, and attribution. Fullscreen viewing capability for major text modals.

### Backend
- **Runtime**: Node.js 20 with Express.js.
- **Language**: TypeScript with ES modules.
- **API**: RESTful, with consistent error handling.
- **Port**: Runs independently on port 3000.

### Database
- **Primary**: PostgreSQL (Supabase configured).
- **ORM**: Drizzle ORM with schema-first approach.
- **Migrations**: Drizzle Kit.
- **Connection**: Node-postgres (pg) with pooling.
- **Content Management**: Internal database tables for Tehillim, Pirkei Avot, After Brochas prayers, and Daily Recipes, migrating from external APIs where beneficial.

### Core Application Features
- **Daily Completion Tracking**: Torah, Tefilla, Tzedaka.
- **Jewish Times Integration**: Real-time zmanim (Jewish prayer times) using location-based data.
- **Content Management**: Daily Torah (Halacha, Mussar/Emuna, Chizuk), prayers (Mincha, Nishmas, Tehillim, Morning Brochas, Birkat Hamazon, Maariv), Shabbat resources, Pirkei Avot. Supports text and audio. Dynamic text processing system for location and Hebrew calendar-based conditional content in prayers.
- **Western Wall Compass**: Geolocation-based compass for prayer orientation.
- **Donation System**: Integrated for tzedaka campaigns.
- **Tehillim Global Progress**: Community-wide Tehillim completion tracking, including specific part display for multi-part psalms.
- **Sponsorship System**: Daily content sponsorship.
- **Analytics**: Tracking of daily/total users, page views, and completions.
- **Life Page**: Shabbat countdown, Jewish Date converter, Daily Recipe, Creative Jewish Living, Community Feedback.
- **Time-based Prayer System**: Dynamic prayer buttons based on zmanim.
- **Performance Optimizations**: Lazy loading for modals, code splitting, compression, optimized build, database query optimization, connection pooling, and caching strategies.
- **Text Formatting**: Robust text cleaning to preserve Hebrew vowels and legitimate characters while removing problematic Unicode, support for markdown-style formatting and line breaks.
- **Font Handling**: Font preloading and `font-display: block` to eliminate FOUT.
- **Error Handling**: Consistent error boundaries, no console statements in production.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Sefaria API (for historical Tehillim/Pirkei Avot data during migration), Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API (for accurate location detection and input).
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).