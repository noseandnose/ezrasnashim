import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ShabbosSection extends StatefulWidget {
  @override
  _ShabbosSectionState createState() => _ShabbosSectionState();
}

class _ShabbosSectionState extends State<ShabbosSection> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? shabbosData;
  Map<String, dynamic>? parshaVort;
  Map<String, dynamic>? recipe;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchShabbosData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchShabbosData() async {
    try {
      final weekId = _getCurrentWeekId();
      
      final futures = await Future.wait([
        http.get(Uri.parse('YOUR_BACKEND_URL/api/shabbos/times')),
        http.get(Uri.parse('YOUR_BACKEND_URL/api/parsha/vort/$weekId')),
        http.get(Uri.parse('YOUR_BACKEND_URL/api/shabbos/recipe/$weekId')),
      ]);

      if (futures[0].statusCode == 200) {
        shabbosData = json.decode(futures[0].body);
      }
      
      if (futures[1].statusCode == 200) {
        parshaVort = json.decode(futures[1].body);
      }
      
      if (futures[2].statusCode == 200) {
        recipe = json.decode(futures[2].body);
      }

      setState(() {
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  String _getCurrentWeekId() {
    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final daysDifference = now.difference(startOfYear).inDays;
    final weekNumber = (daysDifference / 7).floor() + 1;
    return '${now.year}-W${weekNumber.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Sponsorship bar
        _buildSponsorshipBar(),
        
        // Shabbos times card
        _buildShabbosTimesCard(),
        
        // Tab bar
        Container(
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              color: Color(0xFFE8B4B8),
              borderRadius: BorderRadius.circular(10),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: Color(0xFF4a4a4a),
            labelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: [
              Tab(text: 'Times'),
              Tab(text: 'Parsha'),
              Tab(text: 'Recipe'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTimesTab(),
              _buildParshaTab(),
              _buildRecipeTab(),
            ],
          ),
        ),
        
        // Bottom padding
        SizedBox(height: 80),
      ],
    );
  }

  Widget _buildSponsorshipBar() {
    return Container(
      margin: EdgeInsets.all(16),
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
              "This week's Shabbos content is sponsored by David & Esther Klein - In honor of their daughter's engagement",
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

  Widget _buildShabbosTimesCard() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(20),
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
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.local_fire_department,
                color: Colors.white,
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'This Shabbos',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Candle Lighting',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                  Text(
                    shabbosData?['candleLighting'] ?? '7:15 PM',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Havdalah',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                  Text(
                    shabbosData?['havdalah'] ?? '8:20 PM',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.book,
                  color: Colors.white,
                  size: 16,
                ),
                SizedBox(width: 8),
                Text(
                  'Parshas ${shabbosData?['parsha'] ?? 'Vayeira'}',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimesTab() {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    final timeItems = [
      {'title': 'Plag Hamincha', 'time': shabbosData?['plagHamincha'] ?? '6:15 PM'},
      {'title': 'Candle Lighting', 'time': shabbosData?['candleLighting'] ?? '7:15 PM'},
      {'title': 'Sunset (Shkia)', 'time': shabbosData?['shkia'] ?? '7:33 PM'},
      {'title': 'Nightfall', 'time': shabbosData?['nightfall'] ?? '8:05 PM'},
      {'title': 'Havdalah', 'time': shabbosData?['havdalah'] ?? '8:20 PM'},
    ];

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shabbos Schedule',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 16),
          
          ...timeItems.map((item) => Container(
            margin: EdgeInsets.only(bottom: 12),
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  item['title']!,
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF4a4a4a),
                  ),
                ),
                Text(
                  item['time']!,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF4a4a4a),
                  ),
                ),
              ],
            ),
          )).toList(),
          
          SizedBox(height: 20),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.info,
                      color: Colors.blue[700],
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Reminder',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Colors.blue[700],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Text(
                  'Light candles 18 minutes before sunset. Times may vary by location.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.blue[700],
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParshaTab() {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            parshaVort?['title'] ?? 'Parshas Vayeira',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Weekly Torah Insight',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 20),
          
          if (parshaVort?['summary'] != null) ...[
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Color(0xFFFDF2F8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Color(0xFFE8B4B8).withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'This Week\'s Message',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF92400E),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    parshaVort!['summary'],
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFF4a4a4a),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
          ],
          
          if (parshaVort?['content'] != null) ...[
            Text(
              parshaVort!['content'],
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF4a4a4a),
                height: 1.6,
              ),
            ),
            SizedBox(height: 20),
          ],
          
          if (parshaVort?['questions'] != null) ...[
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Discussion Questions',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Colors.blue[700],
                    ),
                  ),
                  SizedBox(height: 8),
                  ...parshaVort!['questions'].map<Widget>((question) => Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '• ',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.blue[700],
                          ),
                        ),
                        Expanded(
                          child: Text(
                            question,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.blue[700],
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )).toList(),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRecipeTab() {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            recipe?['title'] ?? 'Traditional Challah',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'This Week\'s Shabbos Recipe',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 20),
          
          if (recipe?['description'] != null) ...[
            Text(
              recipe!['description'],
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF4a4a4a),
                height: 1.5,
              ),
            ),
            SizedBox(height: 20),
          ],
          
          if (recipe?['ingredients'] != null) ...[
            Text(
              'Ingredients',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4a4a4a),
              ),
            ),
            SizedBox(height: 12),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: recipe!['ingredients'].map<Widget>((ingredient) => Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '• ',
                        style: TextStyle(
                          fontSize: 16,
                          color: Color(0xFF4a4a4a),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          ingredient,
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF4a4a4a),
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                )).toList(),
              ),
            ),
            SizedBox(height: 20),
          ],
          
          if (recipe?['instructions'] != null) ...[
            Text(
              'Instructions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4a4a4a),
              ),
            ),
            SizedBox(height: 12),
            ...recipe!['instructions'].asMap().entries.map<Widget>((entry) {
              final index = entry.key;
              final instruction = entry.value;
              return Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: Color(0xFFE8B4B8),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        instruction,
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF4a4a4a),
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
          
          if (recipe?['tips'] != null) ...[
            SizedBox(height: 20),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb,
                        color: Colors.amber[700],
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Tips',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Colors.amber[700],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    recipe!['tips'],
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.amber[700],
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}