import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class HomeSection extends StatefulWidget {
  @override
  _HomeSectionState createState() => _HomeSectionState();
}

class _HomeSectionState extends State<HomeSection> {
  Map<String, dynamic>? sponsor;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDailySponsor();
  }

  Future<void> _fetchDailySponsor() async {
    try {
      final date = DateTime.now().toIso8601String().split('T')[0];
      final response = await http.get(
        Uri.parse('YOUR_BACKEND_URL/api/sponsors/daily/$date'),
      );
      
      if (response.statusCode == 200) {
        setState(() {
          sponsor = json.decode(response.body);
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        return SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Today's Sponsor Banner
              _buildSponsorBanner(),
              SizedBox(height: 12),
              
              // Today's Times Card
              _buildTodayCard(appState),
              SizedBox(height: 16),
              
              // Main Action Buttons
              _buildTorahButton(),
              SizedBox(height: 12),
              _buildTefillaButton(),
              SizedBox(height: 12),
              _buildTzedakaButton(),
              
              // Bottom padding for navigation
              SizedBox(height: 100),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSponsorBanner() {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFDF2F8), Color(0xFFFEF7FF)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE8B4B8).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.favorite,
            color: Color(0xFFE8B4B8),
            size: 16,
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              isLoading 
                ? "Loading today's sponsor..."
                : sponsor != null
                  ? "Today is sponsored by ${sponsor!['name']}${sponsor!['message'] != null ? ' - ${sponsor!['message']}' : ''}"
                  : "Today is sponsored by the Cohen family - In memory of Sarah bas Avraham",
              style: TextStyle(
                fontSize: 12,
                color: Color(0xFF92400E),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayCard(AppState appState) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.access_time,
                color: Color(0xFFB5C99A),
                size: 16,
              ),
              SizedBox(width: 8),
              Text(
                'Today',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Color(0xFF4a4a4a),
                ),
              ),
              SizedBox(width: 8),
              Text(
                '• ${appState.hebrewDate ?? "Loading..."}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Shkia:',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    appState.jewishTimes?['shkia'] ?? 'Loading...',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Mincha:',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    appState.jewishTimes?['minchaKetanah'] ?? 'Loading...',
                    style: TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 12),
          Text(
            '"May your day be filled with Torah learning, meaningful tefillah, and acts of chesed."',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontStyle: FontStyle.italic,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTorahButton() {
    return GestureDetector(
      onTap: () {
        Provider.of<AppState>(context, listen: false).setCurrentIndex(0);
      },
      child: Container(
        height: 72,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFE8B4B8), Color(0xFFF5C99B)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Color(0xFFE8B4B8).withOpacity(0.3),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              Icons.menu_book,
              size: 28,
              color: Color(0xFF4a4a4a),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Torah',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                  Text(
                    'Daily Halacha, Mussar & Chizuk',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4a4a4a).withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTefillaButton() {
    return GestureDetector(
      onTap: () {
        Provider.of<AppState>(context, listen: false).setCurrentIndex(1);
      },
      child: Container(
        height: 72,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFB5C99A), Color(0xFFC5D49A)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Color(0xFFB5C99A).withOpacity(0.3),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(
              Icons.favorite_border,
              size: 28,
              color: Color(0xFF4a4a4a),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Tefilla',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                  Text(
                    'Tehillim, Mincha & Women\'s Prayers',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4a4a4a).withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTzedakaButton() {
    return GestureDetector(
      onTap: () {
        // Navigate to donation page or open tzedaka section
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => DonationPage()),
        );
      },
      child: Container(
        height: 56,
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Color(0xFFE8B4B8).withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.volunteer_activism,
              size: 24,
              color: Color(0xFFE8B4B8),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Tzedaka - Give with Heart',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 14,
                  color: Color(0xFF4a4a4a),
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}

// Placeholder for donation page
class DonationPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tzedaka'),
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF4a4a4a),
        elevation: 1,
      ),
      body: Center(
        child: Text('Donation page coming soon...'),
      ),
    );
  }
}