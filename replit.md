# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview
Ezras Nashim is a mobile-first web application for Jewish women to track and complete daily spiritual practices across Torah study, Tefilla (prayer), and Tzedaka (charity). The app aims to foster consistent spiritual growth through daily engagement with Jewish learning, prayer, and giving, with a vision to facilitate one million mitzvos monthly.

## User Preferences
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
Font testing: Currently testing Platypi serif font as potential replacement for English text on home page (July 24, 2025) - temporary reversible changes applied.
Reading time display: User requested reading time estimation for text content, implemented for Halacha content using 200 words per minute calculation (August 1, 2025).
Community feedback form: Updated to new Google Forms link (August 5, 2025).

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
- **API Communication**: TanStack Query for requests, caching, optimistic updates.
- **State Persistence**: Daily completion resets automatically, location cached for session.
- **Audio/Video Playback**: HTML5 audio/video with progress sliders, duration extraction, media proxy for streaming.
- **Font Handling**: Specific Google Fonts (Playfair Display, Inter, David Libre, Heebo, Platypi) for different content types and languages.
- **Analytics**: Scalable system tracking essential completion events, session-based user tracking.
- **Error Handling**: Consistent error boundaries.
- **Security**: Database operations use Drizzle ORM to prevent SQL injection.
- **Deployment**: Static frontend (S3), backend (ECS), PostgreSQL (Supabase). Replit configuration for dev/prod.

## External Dependencies
- **Payment Processing**: Stripe (for donations, including Apple Pay/Google Pay).
- **Jewish Calendar Services**: Hebcal.com (for dates, times, holidays, zmanim, Hebrew date conversion).
- **Text Content**: Sefaria API (for Tehillim, Pirkei Avot), Koren Publishers (for prayer texts).
- **Geolocation**: Browser Geolocation API, OpenStreetMap Nominatim API, Google Maps Places API (for accurate location detection and input).
- **UI Libraries**: Radix UI (component primitives), Lucide React (icons), Tailwind CSS (styling).