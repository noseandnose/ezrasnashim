import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Main App Structure for Flutter
class JewishWomensApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState(),
      child: MaterialApp(
        title: 'Jewish Women\'s Daily',
        theme: ThemeData(
          primarySwatch: MaterialColor(0xFFE8B4B8, {
            50: Color(0xFFFDF5F5),
            100: Color(0xFFFAE6E7),
            200: Color(0xFFF2C4C7),
            300: Color(0xFFEAA2A7),
            400: Color(0xFFE8B4B8),
            500: Color(0xFFE8B4B8),
            600: Color(0xFFD19B9F),
            700: Color(0xFFB8828F),
            800: Color(0xFF9F697F),
            900: Color(0xFF86506F),
          }),
          fontFamily: 'Roboto',
          scaffoldBackgroundColor: Colors.white,
        ),
        home: MainPage(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AppState extends ChangeNotifier {
  int _currentIndex = 2; // Start on home
  String? _userLocation;
  double? _latitude;
  double? _longitude;
  String? _hebrewDate;
  Map<String, String>? _jewishTimes;
  String? _activeModal;

  // Getters
  int get currentIndex => _currentIndex;
  String? get userLocation => _userLocation;
  double? get latitude => _latitude;
  double? get longitude => _longitude;
  String? get hebrewDate => _hebrewDate;
  Map<String, String>? get jewishTimes => _jewishTimes;
  String? get activeModal => _activeModal;

  // Setters
  void setCurrentIndex(int index) {
    _currentIndex = index;
    notifyListeners();
  }

  void setLocation(String location, double lat, double lng) {
    _userLocation = location;
    _latitude = lat;
    _longitude = lng;
    notifyListeners();
  }

  void setHebrewDate(String date) {
    _hebrewDate = date;
    notifyListeners();
  }

  void setJewishTimes(Map<String, String> times) {
    _jewishTimes = times;
    notifyListeners();
  }

  void openModal(String modalId) {
    _activeModal = modalId;
    notifyListeners();
  }

  void closeModal() {
    _activeModal = null;
    notifyListeners();
  }
}

class MainPage extends StatelessWidget {
  final List<Widget> _pages = [
    TorahSection(),
    TefillaSection(),
    HomeSection(),
    ShabbosSection(),
    ShopSection(),
  ];

  final List<BottomNavigationBarItem> _navItems = [
    BottomNavigationBarItem(
      icon: Icon(Icons.menu_book),
      label: 'Torah',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.favorite_border),
      label: 'Tefilla',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.favorite),
      label: 'Home',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.local_fire_department),
      label: 'Shabbos',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.shopping_bag),
      label: 'Shop',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(
              appState.hebrewDate ?? 'Loading...',
              style: TextStyle(
                color: Color(0xFF4a4a4a),
                fontWeight: FontWeight.w600,
              ),
            ),
            backgroundColor: Colors.white,
            elevation: 1,
            centerTitle: true,
          ),
          body: IndexedStack(
            index: appState.currentIndex,
            children: _pages,
          ),
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: appState.currentIndex,
            onTap: appState.setCurrentIndex,
            items: _navItems,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: Color(0xFFE8B4B8),
            unselectedItemColor: Color(0xFF4a4a4a),
            backgroundColor: Colors.white,
            elevation: 8,
          ),
        );
      },
    );
  }
}