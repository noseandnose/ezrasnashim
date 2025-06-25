# Ezras Nashim - Daily Jewish Women's Spiritual App

## Overview

Ezras Nashim is a comprehensive mobile-first web application designed for Jewish women to track and complete their daily spiritual practices. The app focuses on three core areas: Torah study, Tefilla (prayer), and Tzedaka (charity), helping users maintain consistent spiritual growth through daily engagement with Jewish learning, prayer, and giving.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom feminine color palette (rose blush, ivory, sand gold, muted lavender)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: Zustand for client-side state and TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive layout optimized for mobile devices with max-width container

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with consistent error handling
- **Session Management**: Express session with memory store for development
- **Middleware**: Custom logging, JSON parsing, and error handling

### Database Architecture
- **Primary Database**: PostgreSQL (configured for Supabase)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration System**: Drizzle Kit for database migrations
- **Connection**: Node-postgres (pg) with connection pooling
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Core Application Features
1. **Daily Completion Tracking**: Users can complete Torah, Tefilla, and Tzedaka tasks daily
2. **Jewish Times Integration**: Real-time zmanim (Jewish prayer times) using Hebcal API
3. **Content Management**: Daily Torah content (Halacha, Mussar, Chizuk), prayers, and Shabbat resources
4. **Donation System**: Stripe integration for tzedaka campaigns and general donations
5. **Tehillim Global Progress**: Community-wide Tehillim completion tracking
6. **Sponsorship System**: Daily content sponsorship with custom messages

### UI/UX Design
- **Color Scheme**: Quiet Joy spiritual retreat palette with rose blush, ivory, and lavender tones
- **Typography**: Playfair Display serif for headers, Inter for body text
- **Navigation**: Bottom tab navigation with center home button
- **Modals**: Overlay system for detailed content viewing
- **Animations**: Subtle transitions and heart explosion effects for completion celebrations

### Content Types
- **Daily Torah Content**: Halacha, Mussar, Chizuk with text and audio support
- **Weekly Shabbat Content**: Recipes, table inspirations, Parsha vorts
- **Prayer Resources**: Mincha, Nishmas, Tehillim, women's prayers
- **Inspirational Content**: Daily quotes with Hebrew dates

## Data Flow

### Client-Server Communication
1. **API Requests**: TanStack Query handles all server communication with automatic caching
2. **Real-time Updates**: Polling intervals for live data (Tehillim progress, sponsorships)
3. **Error Handling**: Consistent error boundaries with user-friendly messages
4. **Loading States**: Skeleton screens and loading indicators throughout the app

### State Management
1. **Server State**: TanStack Query with optimistic updates and background refetching
2. **Client State**: Zustand stores for modals, daily completion, location, and Hebrew dates
3. **Persistence**: Daily completion resets automatically, location cached for session
4. **Synchronization**: Real-time updates between multiple users for community features

### External API Integration
- **Hebcal API**: Jewish calendar, zmanim, and Hebrew date conversion
- **Geolocation**: Browser API for accurate local times
- **Stripe**: Payment processing for donations with webhook support

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure with React Stripe.js integration
- **Webhook Handling**: Server-side payment confirmation and database updates

### Jewish Calendar Services
- **Hebcal.com**: Comprehensive Jewish calendar API for dates, times, and holidays
- **Coordinate Mapping**: Automatic city detection for accurate zmanim calculation

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Consistent icon library with 450+ icons
- **Tailwind CSS**: Utility-first styling with custom design tokens

### Development Tools
- **ESBuild**: Production bundling for server code
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TypeScript**: Type safety across frontend, backend, and shared schemas

## Deployment Strategy

### Environment Configuration
- **Development**: Hot reload with Vite dev server and tsx for TypeScript execution
- **Production**: Static frontend build with Express server for API and static file serving
- **Database**: Environment variable configuration for PostgreSQL connection strings

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Deployment**: Single container with both static files and API server

### Replit Configuration
- **Modules**: Node.js 20, web server, PostgreSQL 16
- **Ports**: Development on 5000, production on 80
- **Workflows**: Automated startup with npm run dev
- **Autoscale**: Configured for automatic scaling in production

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
- June 24, 2025. Fixed audio player to use real audio files instead of simulation
- June 24, 2025. Resolved database schema mismatches for Torah content APIs
- June 24, 2025. Made hebrew_date optional in all Torah content tables
- June 24, 2025. Added clickable progress bar for audio seeking
- June 24, 2025. Fixed heart explosion animation timing and Torah content loading
- June 24, 2025. Performance optimizations: added query caching, reduced refetch intervals
- June 24, 2025. Removed placeholder data from Torah modals  
- June 24, 2025. Added audio proxy endpoint for Google Drive streaming
- June 24, 2025. Optimized database initialization for faster startup
- June 24, 2025. Fixed Loshon Horah database connectivity with proper schema mapping
- June 24, 2025. Enhanced audio streaming with improved Google Drive proxy
- June 24, 2025. Added accessibility descriptions to all Torah modals
- June 24, 2025. Updated Shabbat table section to display real database content titles
- June 24, 2025. Removed all hebrew_date fields from database schema
- June 24, 2025. Added universal media proxy supporting multiple hosting services
- June 24, 2025. Formatted and stored complete Hebrew Amidah prayer in database with proper section headers and line breaks
- June 25, 2025. Fixed console JSX errors by removing inline style elements and using CSS classes
- June 25, 2025. Optimized Hebrew prayer formatting by removing double line spaces between headers and content
- June 25, 2025. Removed transliteration field from tefilla prayers in database and frontend
- June 25, 2025. Changed tehillim name automatic removal from 7 days to 18 days in backend and frontend
- June 25, 2025. Comprehensive TypeScript audit: Fixed all cacheTime deprecations (replaced with gcTime), added proper type annotations, eliminated 'any' types where possible
- June 25, 2025. Integrated Sefaria API for Tehillim content: Replaced database storage with live API calls, added language support (English/Hebrew), updated completion tracking to include perek number and language preference
- June 25, 2025. Enhanced Sefaria text cleaning: Removed HTML entities (&thinsp;, &nbsp;), Hebrew paragraph markers ({פ}, {ס}), and all English formatting artifacts for pure authentic Hebrew text display
- June 25, 2025. Implemented Tehillim preview showing first line of actual Hebrew text instead of "Perek X" placeholder text
- June 25, 2025. Added complete Pirkei Avot daily inspiration system: 25+ authentic teachings cycling daily, prominently displayed in Torah section with scroll icon and chapter reference
- June 25, 2025. Expanded Pirkei Avot collection to include comprehensive teachings from all 6 chapters with authentic translations
- June 25, 2025. Fixed Tehillim preview loading state: Added skeleton animation while fetching Hebrew text to prevent confusing placeholder flashing
- June 25, 2025. Implemented location-based discount promotions: Added targetLocation field to support different discounts for Israel vs worldwide, using same geolocation system as zmanim times
- June 25, 2025. Applied permanent styling changes: All text is now pure black (#000000) instead of soft gray, with bold headings for improved readability and visual contrast
- June 25, 2025. Added Apple Pay integration to donation checkout: Enhanced Stripe payment system with Apple Pay support, custom Apple Pay button component, and seamless mobile payment experience
- June 25, 2025. Updated home section design: Unified top section with greeting, times, and today info as one cohesive unit; added circular arrow button on Mincha to indicate clickability; applied black text styling with bold headings throughout
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Text styling preference: Pure black text (#000000) with bold headings for better readability.
```