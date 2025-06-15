# Flutter/FlutterFlow Conversion Guide
## Jewish Women's Daily App

This guide provides a complete conversion from the existing React/TypeScript app to Flutter/FlutterFlow.

## Project Overview
The app is a comprehensive daily Jewish women's app with the following features:
- Daily Torah content (Halacha, Mussar, Chizuk, Loshon Horah)
- Prayer services (Tehillim, Mincha, Women's prayers)
- Donation platform (Tzedaka)
- Shabbos content and recipes
- Shopping marketplace
- Jewish time calculations
- Sponsorship system
- Audio player for content

## App Structure

### Main Navigation
- **Bottom Navigation Bar** with 5 sections:
  1. Torah (Daily learning content)
  2. Tefilla (Prayer services)
  3. Home (Dashboard - center button)
  4. Shabbos (Table/Shabbos content)
  5. Shop (Marketplace)

### Color Scheme (Pastel Design)
- Primary: Blush/Peach gradients
- Secondary: Sage green
- Background: White with soft shadows
- Text: Dark gray (#4a4a4a)

## FlutterFlow Project Setup

### 1. Create New FlutterFlow Project
- Choose "Mobile App" template
- Set app name: "Jewish Women's Daily"
- Configure primary colors to match pastel theme

### 2. Required Dependencies
Add these to your FlutterFlow project:
```yaml
dependencies:
  http: ^0.13.5
  shared_preferences: ^2.1.1
  audioplayers: ^4.1.0
  geolocator: ^9.0.2
  url_launcher: ^6.1.12
  intl: ^0.18.1
  provider: ^6.0.5
```

## Page Structure

### 1. Main Container Page (main_page.dart)
```dart
// Main page with bottom navigation
// Contains:
// - AppBar with Hebrew date
// - PageView for different sections
// - Bottom navigation bar
// - Global state management
```

### 2. Home Section (home_section.dart)
```dart
// Dashboard with:
// - Today's sponsor banner
// - Current Jewish times (Shkia, Mincha)
// - Quick action buttons for Torah and Tefilla
// - Daily inspiration quote
```

### 3. Torah Section (torah_section.dart)
```dart
// 2x2 grid layout:
// - Daily Halacha
// - Daily Mussar  
// - Daily Chizuk (with audio)
// - Loshon Horah
```

### 4. Tefilla Section (tefilla_section.dart)
```dart
// Prayer services:
// - Tehillim with names list
// - Mincha prayers
// - Women's specific prayers
// - Audio player integration
```

### 5. Shabbos Section (shabbos_section.dart)
```dart
// Shabbos content:
// - Weekly Parsha insights
// - Shabbos recipes
// - Candle lighting times
// - Havdalah times
```

### 6. Shop Section (shop_section.dart)
```dart
// Marketplace:
// - Featured items grid
// - Categories
// - Item details with purchase links
```

### 7. Donation Page (donation_page.dart)
```dart
// Tzedaka platform:
// - Active campaigns
// - Donation amounts
// - Payment integration
// - Success/failure handling
```

## Key Components

### Custom Widgets Needed:

#### 1. AudioPlayer Widget
```dart
class AudioPlayerWidget extends StatefulWidget {
  final String title;
  final String duration;
  final String audioUrl;
  
  // Playback controls with speed adjustment
  // Progress bar
  // Play/pause functionality
}
```

#### 2. GradientCard Widget
```dart
class GradientCard extends StatelessWidget {
  final Widget child;
  final List<Color> colors;
  
  // Reusable card with gradient backgrounds
  // Rounded corners and shadows
}
```

#### 3. SponsorshipBar Widget
```dart
class SponsorshipBar extends StatelessWidget {
  final String sponsorName;
  final String? message;
  
  // Displays daily sponsor information
  // Heart icon with sponsor details
}
```

#### 4. JewishTimesWidget
```dart
class JewishTimesWidget extends StatefulWidget {
  // Fetches and displays:
  // - Current Hebrew date
  // - Shkia (sunset)
  // - Mincha times
  // - Shabbos times when applicable
}
```

### State Management
Use Provider for global state:

```dart
class AppState extends ChangeNotifier {
  // Current section
  int currentIndex = 2; // Start on home
  
  // Location data
  String? userLocation;
  double? latitude;
  double? longitude;
  
  // Hebrew date
  String? hebrewDate;
  
  // Jewish times
  Map<String, String>? jewishTimes;
  
  // Modal state
  String? activeModal;
}
```

## API Integration

### 1. Backend Routes (Keep existing Express server)
The current backend with PostgreSQL will remain the same. Flutter will make HTTP requests to:

- `/api/sponsors/daily/:date` - Daily sponsors
- `/api/torah/halacha/:date` - Daily Halacha
- `/api/torah/mussar/:date` - Daily Mussar  
- `/api/torah/chizuk/:date` - Daily Chizuk
- `/api/torah/loshon/:date` - Loshon Horah
- `/api/tehillim/names` - Active Tehillim names
- `/api/mincha/prayers` - Mincha prayers
- `/api/campaigns/active` - Active donation campaigns
- `/api/shop/items` - Shop items

### 2. External APIs
- **Hebcal API**: Jewish calendar and times
- **Stripe API**: Payment processing (if implementing donations)

### 3. HTTP Service Class
```dart
class ApiService {
  static const String baseUrl = 'YOUR_BACKEND_URL';
  
  Future<Map<String, dynamic>> getDailySponsor(String date);
  Future<Map<String, dynamic>> getDailyHalacha(String date);
  Future<List<dynamic>> getTehillimNames();
  Future<Map<String, dynamic>> getJewishTimes(double lat, double lng);
  // ... other API methods
}
```

## FlutterFlow Implementation Steps

### Phase 1: Basic Structure
1. Create main page with bottom navigation
2. Set up 5 section pages
3. Implement basic navigation between sections
4. Configure color scheme and fonts

### Phase 2: Home Section
1. Create sponsor banner widget
2. Add Jewish times display
3. Implement quick action buttons
4. Add daily inspiration text

### Phase 3: Torah Section  
1. Create 2x2 grid layout
2. Add modal dialogs for each Torah category
3. Implement audio player for Chizuk
4. Connect to backend APIs

### Phase 4: Tefilla Section
1. Create Tehillim interface with names
2. Add Mincha prayers display
3. Implement audio playback
4. Add prayer completion tracking

### Phase 5: Additional Sections
1. Complete Shabbos section with recipes and times
2. Implement shop with item grid and details
3. Add donation page with payment integration
4. Test all API connections

### Phase 6: Polish & Features
1. Add loading states and error handling
2. Implement offline caching
3. Add push notifications for daily content
4. Test on both iOS and Android

## Design Guidelines

### Colors (HSL format for consistency)
```dart
// Primary Colors
static const Color blushPrimary = Color(0xFFE8B4B8);
static const Color peachPrimary = Color(0xFFF5C99B);
static const Color sagePrimary = Color(0xFFB5C99A);

// Gradients
static const List<Color> blushPeachGradient = [
  Color(0xFFE8B4B8),
  Color(0xFFF5C99B),
];

static const List<Color> sageGradient = [
  Color(0xFFB5C99A),
  Color(0xFFC5D49A),
];
```

### Typography
- Headers: Bold, 16-18px
- Body: Regular, 14px  
- Captions: Regular, 12px
- Font: Use system default or Roboto

### Spacing
- Card padding: 16px
- Section margins: 12px
- Button height: 56px (for accessibility)
- Icon sizes: 24px (small), 32px (medium), 40px (large)

## Testing Checklist

### Functionality
- [ ] Navigation between all sections works
- [ ] Audio player controls function properly
- [ ] Location services work for Jewish times
- [ ] All API calls return expected data
- [ ] Donation flow completes successfully
- [ ] Modal dialogs open and close properly

### UI/UX
- [ ] All text is readable and properly sized
- [ ] Gradients display correctly
- [ ] Loading states show during API calls
- [ ] Error messages are user-friendly
- [ ] App works on different screen sizes
- [ ] Accessibility features are functional

### Performance
- [ ] App launches quickly
- [ ] Scrolling is smooth
- [ ] Audio playback doesn't lag
- [ ] Network requests don't block UI
- [ ] Memory usage is reasonable

## Deployment Preparation

### App Store Requirements
1. Configure app icons (multiple sizes)
2. Create app store screenshots
3. Write app description emphasizing Jewish learning
4. Set appropriate age rating
5. Configure privacy policy for location/audio access

### Backend Hosting
- Keep existing Express/PostgreSQL backend
- Ensure HTTPS endpoints for mobile access
- Configure CORS for mobile app domain
- Set up proper error logging

This conversion guide provides a complete roadmap for transforming your React app into a native Flutter/FlutterFlow mobile application while maintaining all current functionality and design aesthetics.