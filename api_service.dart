import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:geolocator/geolocator.dart';

class ApiService {
  static const String baseUrl = 'YOUR_BACKEND_URL'; // Replace with your actual backend URL
  
  // Headers for all requests
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Generic request handler with error handling
  static Future<Map<String, dynamic>?> _makeRequest(String endpoint, {String method = 'GET', Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse('$baseUrl$endpoint');
      http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: _headers);
          break;
        case 'POST':
          response = await http.post(uri, headers: _headers, body: json.encode(body));
          break;
        case 'PUT':
          response = await http.put(uri, headers: _headers, body: json.encode(body));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: _headers);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(response.body);
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      print('API Request Error: $e');
      return null;
    }
  }

  // Sponsor API calls
  static Future<Map<String, dynamic>?> getDailySponsor(String date) async {
    return await _makeRequest('/api/sponsors/daily/$date');
  }

  static Future<List<Map<String, dynamic>>> getActiveSponsors() async {
    final result = await _makeRequest('/api/sponsors/active');
    return result != null ? List<Map<String, dynamic>>.from(result['sponsors'] ?? []) : [];
  }

  static Future<Map<String, dynamic>?> createSponsor(Map<String, dynamic> sponsorData) async {
    return await _makeRequest('/api/sponsors', method: 'POST', body: sponsorData);
  }

  // Torah content API calls
  static Future<Map<String, dynamic>?> getDailyHalacha(String date) async {
    return await _makeRequest('/api/torah/halacha/$date');
  }

  static Future<Map<String, dynamic>?> getDailyMussar(String date) async {
    return await _makeRequest('/api/torah/mussar/$date');
  }

  static Future<Map<String, dynamic>?> getDailyChizuk(String date) async {
    return await _makeRequest('/api/torah/chizuk/$date');
  }

  static Future<Map<String, dynamic>?> getLoshonHorah(String date) async {
    return await _makeRequest('/api/torah/loshon/$date');
  }

  static Future<Map<String, dynamic>?> createDailyHalacha(Map<String, dynamic> halachaData) async {
    return await _makeRequest('/api/torah/halacha', method: 'POST', body: halachaData);
  }

  static Future<Map<String, dynamic>?> createDailyMussar(Map<String, dynamic> mussarData) async {
    return await _makeRequest('/api/torah/mussar', method: 'POST', body: mussarData);
  }

  static Future<Map<String, dynamic>?> createDailyChizuk(Map<String, dynamic> chizukData) async {
    return await _makeRequest('/api/torah/chizuk', method: 'POST', body: chizukData);
  }

  static Future<Map<String, dynamic>?> createLoshonHorah(Map<String, dynamic> loshonData) async {
    return await _makeRequest('/api/torah/loshon', method: 'POST', body: loshonData);
  }

  // Tehillim API calls
  static Future<List<Map<String, dynamic>>> getTehillimNames() async {
    final result = await _makeRequest('/api/tehillim/names');
    return result != null ? List<Map<String, dynamic>>.from(result['names'] ?? []) : [];
  }

  static Future<Map<String, dynamic>?> addTehillimName(Map<String, dynamic> nameData) async {
    return await _makeRequest('/api/tehillim/names', method: 'POST', body: nameData);
  }

  static Future<Map<String, dynamic>?> getGlobalTehillimProgress() async {
    return await _makeRequest('/api/tehillim/progress');
  }

  static Future<Map<String, dynamic>?> updateTehillimProgress(int currentPerek, String? completedBy) async {
    return await _makeRequest('/api/tehillim/progress', method: 'PUT', body: {
      'currentPerek': currentPerek,
      'completedBy': completedBy,
    });
  }

  // Mincha prayers API calls
  static Future<List<Map<String, dynamic>>> getMinchaPrayers() async {
    final result = await _makeRequest('/api/mincha/prayers');
    return result != null ? List<Map<String, dynamic>>.from(result['prayers'] ?? []) : [];
  }

  static Future<Map<String, dynamic>?> createMinchaPrayer(Map<String, dynamic> prayerData) async {
    return await _makeRequest('/api/mincha/prayers', method: 'POST', body: prayerData);
  }

  // Shabbos content API calls
  static Future<Map<String, dynamic>?> getShabbosRecipe(String week) async {
    return await _makeRequest('/api/shabbos/recipe/$week');
  }

  static Future<Map<String, dynamic>?> getParshaVort(String week) async {
    return await _makeRequest('/api/parsha/vort/$week');
  }

  static Future<Map<String, dynamic>?> createShabbosRecipe(Map<String, dynamic> recipeData) async {
    return await _makeRequest('/api/shabbos/recipe', method: 'POST', body: recipeData);
  }

  static Future<Map<String, dynamic>?> createParshaVort(Map<String, dynamic> vortData) async {
    return await _makeRequest('/api/parsha/vort', method: 'POST', body: vortData);
  }

  // Shop API calls
  static Future<List<Map<String, dynamic>>> getShopItems() async {
    final result = await _makeRequest('/api/shop/items');
    return result != null ? List<Map<String, dynamic>>.from(result['items'] ?? []) : [];
  }

  static Future<Map<String, dynamic>?> getShopItem(int id) async {
    return await _makeRequest('/api/shop/items/$id');
  }

  static Future<Map<String, dynamic>?> createShopItem(Map<String, dynamic> itemData) async {
    return await _makeRequest('/api/shop/items', method: 'POST', body: itemData);
  }

  // Campaign/Donation API calls
  static Future<Map<String, dynamic>?> getActiveCampaign() async {
    return await _makeRequest('/api/campaigns/active');
  }

  static Future<List<Map<String, dynamic>>> getAllCampaigns() async {
    final result = await _makeRequest('/api/campaigns');
    return result != null ? List<Map<String, dynamic>>.from(result['campaigns'] ?? []) : [];
  }

  static Future<Map<String, dynamic>?> createCampaign(Map<String, dynamic> campaignData) async {
    return await _makeRequest('/api/campaigns', method: 'POST', body: campaignData);
  }

  static Future<Map<String, dynamic>?> updateCampaignProgress(int id, double amount) async {
    return await _makeRequest('/api/campaigns/$id/progress', method: 'PUT', body: {
      'amount': amount,
    });
  }

  // Nishmas text API calls
  static Future<Map<String, dynamic>?> getNishmasText(String language) async {
    return await _makeRequest('/api/nishmas/$language');
  }

  static Future<Map<String, dynamic>?> createNishmasText(Map<String, dynamic> textData) async {
    return await _makeRequest('/api/nishmas', method: 'POST', body: textData);
  }

  static Future<Map<String, dynamic>?> updateNishmasText(String language, Map<String, dynamic> textData) async {
    return await _makeRequest('/api/nishmas/$language', method: 'PUT', body: textData);
  }

  // External API calls (Hebcal for Jewish times)
  static Future<Map<String, dynamic>?> getJewishTimes({
    required double latitude,
    required double longitude,
    String? locationId,
  }) async {
    try {
      final params = {
        'cfg': 'json',
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'tzid': 'auto',
        'M': 'on', // Add multiple zmanim
      };

      final queryString = params.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final uri = Uri.parse('https://www.hebcal.com/zmanim?$queryString');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Hebcal API Error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getHebrewDate() async {
    try {
      final today = DateTime.now();
      final params = {
        'cfg': 'json',
        'gy': today.year.toString(),
        'gm': today.month.toString(),
        'gd': today.day.toString(),
        'g2h': '1',
      };

      final queryString = params.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final uri = Uri.parse('https://www.hebcal.com/converter?$queryString');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Hebrew Date API Error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>?> getShabbosData({
    required double latitude,
    required longitude,
  }) async {
    try {
      final params = {
        'cfg': 'json',
        'latitude': latitude.toString(),
        'longitude': longitude.toString(),
        'M': 'on',
        'c': 'on', // Candle lighting
        'havdalah': 'on',
      };

      final queryString = params.entries
          .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final uri = Uri.parse('https://www.hebcal.com/shabbat?$queryString');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Shabbos Times API Error: $e');
    }
    return null;
  }
}

// Location service for getting user's position
class LocationService {
  static Future<Position?> getCurrentPosition() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        print('Location services are disabled.');
        return null;
      }

      // Check location permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          print('Location permissions are denied');
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        print('Location permissions are permanently denied, we cannot request permissions.');
        return null;
      }

      // Get current position
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      );
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  static Future<String> getLocationName(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        return '${placemark.locality}, ${placemark.administrativeArea}';
      }
    } catch (e) {
      print('Error getting location name: $e');
    }
    return 'Unknown Location';
  }
}

// Utility functions for date and time formatting
class DateTimeUtils {
  static String getCurrentDateString() {
    return DateTime.now().toIso8601String().split('T')[0];
  }

  static String getCurrentWeekId() {
    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final daysDifference = now.difference(startOfYear).inDays;
    final weekNumber = (daysDifference / 7).floor() + 1;
    return '${now.year}-W${weekNumber.toString().padLeft(2, '0')}';
  }

  static String formatTime(String? timeString) {
    if (timeString == null) return 'N/A';
    try {
      final time = DateTime.parse('2000-01-01 $timeString');
      final hour = time.hour > 12 ? time.hour - 12 : time.hour == 0 ? 12 : time.hour;
      final minute = time.minute.toString().padLeft(2, '0');
      final period = time.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$minute $period';
    } catch (e) {
      return timeString;
    }
  }

  static String formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date).inDays;
    
    if (difference == 0) return 'today';
    if (difference == 1) return 'yesterday';
    if (difference < 7) return '$difference days ago';
    if (difference < 30) return '${(difference / 7).floor()} weeks ago';
    return '${(difference / 30).floor()} months ago';
  }
}