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
                  ? (sponsor!['message'] != null ? sponsor!['message'] : "Today has been sponsored by ${sponsor!['name']}")
                  : "Today has been sponsored by the Cohen family - In memory of Sarah bas Avraham",
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
                    appState.jewishTimes?['minchaGedolah'] ?? 'Loading...',
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

// Tzedaka & Donations page
class DonationPage extends StatefulWidget {
  @override
  _DonationPageState createState() => _DonationPageState();
}

class _DonationPageState extends State<DonationPage> {
  // Use default values for immediate display, then load real data
  String campaignTitle = "Sefer Torah for Ezrat Nashim";
  int currentAmount = 85000;
  int goalAmount = 150000;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchCampaignData();
  }

  Future<void> _fetchCampaignData() async {
    try {
      final response = await http.get(
        Uri.parse('YOUR_BACKEND_URL/api/campaigns/active'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data != null) {
          setState(() {
            campaignTitle = data['title'] ?? campaignTitle;
            currentAmount = data['currentAmount'] ?? currentAmount;
            goalAmount = data['goalAmount'] ?? goalAmount;
          });
        }
      }
    } catch (e) {
      // Keep default values if API fails
    }
  }

  double get progressPercentage => (currentAmount / goalAmount * 100).clamp(0, 100);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tzedaka & Donations'),
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF4a4a4a),
        elevation: 1,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              // Header
              _buildHeader(),
              SizedBox(height: 20),
              
              // Campaign Card with Progress Bar
              _buildCampaignCard(),
              SizedBox(height: 20),
              
              // Other Tzedaka Options
              _buildTzedakaOptions(),
              SizedBox(height: 20),
              
              // Community Impact
              _buildCommunityImpact(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite, color: Color(0xFFE8B4B8), size: 24),
            SizedBox(width: 8),
            Text(
              'Tzedaka & Donations',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4a4a4a),
              ),
            ),
          ],
        ),
        SizedBox(height: 8),
        Text(
          'Support meaningful causes in our community',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCampaignCard() {
    return GestureDetector(
      onTap: () => _openCampaignModal(),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Color(0xFFE8B4B8).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.menu_book,
                    color: Color(0xFFE8B4B8),
                    size: 24,
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Campaign',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF4a4a4a),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        campaignTitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.add, color: Colors.grey[400], size: 16),
              ],
            ),
            SizedBox(height: 16),
            
            // Progress Section
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Progress',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      '\$${_formatNumber(currentAmount)} / \$${_formatNumber(goalAmount)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFFE8B4B8),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                
                // Progress Bar
                Container(
                  width: double.infinity,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: progressPercentage / 100,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFFE8B4B8), // Blush color
                            Color(0xFFF5C99B), // Peach color
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  '${progressPercentage.round()}% Complete',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTzedakaOptions() {
    final options = [
      {
        'id': 'causes',
        'icon': Icons.shield,
        'title': 'Causes',
        'description': 'Support our partner causes including fertility support, women\'s abuse prevention, and kollels',
        'color': Color(0xFFF5C99B),
      },
      {
        'id': 'sponsor-day',
        'icon': Icons.favorite,
        'title': 'Sponsor a Day',
        'description': 'Dedicate all Mitzvot done on the app - choose 1 day, 1 week, or 1 month',
        'color': Color(0xFF81C784),
      },
    ];

    return Column(
      children: options.map((option) => Container(
        margin: EdgeInsets.only(bottom: 12),
        child: GestureDetector(
          onTap: () => _openOptionModal(option['id'] as String),
          child: Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (option['color'] as Color).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    option['icon'] as IconData,
                    color: option['color'] as Color,
                    size: 24,
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        option['title'] as String,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF4a4a4a),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        option['description'] as String,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.add, color: Colors.grey[400], size: 16),
              ],
            ),
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildCommunityImpact() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFE8B4B8).withOpacity(0.05),
            Color(0xFFF5C99B).withOpacity(0.05),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            'Community Impact',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildImpactStat('142', 'Days Sponsored', Color(0xFF81C784)),
              _buildImpactStat('3', 'Campaigns Completed', Color(0xFFE8B4B8)),
              _buildImpactStat('\$24,580', 'Total to Causes', Color(0xFFF5C99B)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildImpactStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: color,
          ),
        ),
        SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000) {
      return '${(number / 1000).round()}k';
    }
    return number.toString();
  }

  void _openCampaignModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CampaignModal(
        title: campaignTitle,
        currentAmount: currentAmount,
        goalAmount: goalAmount,
      ),
    );
  }

  void _openOptionModal(String optionId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TzedakaOptionModal(optionId: optionId),
    );
  }
}

// Campaign Modal
class CampaignModal extends StatelessWidget {
  final String title;
  final int currentAmount;
  final int goalAmount;

  const CampaignModal({
    Key? key,
    required this.title,
    required this.currentAmount,
    required this.goalAmount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(Icons.menu_book, color: Color(0xFFE8B4B8), size: 24),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Help us acquire a new Sefer Torah for our women\'s learning center. Every contribution brings us closer to this sacred goal.',
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.6,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                  SizedBox(height: 20),
                  
                  // Donation amounts
                  Text(
                    'Choose an Amount:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                  SizedBox(height: 12),
                  
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: ['\$18', '\$36', '\$72', '\$144', '\$360', 'Custom'].map((amount) => 
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Color(0xFFE8B4B8)),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          amount,
                          style: TextStyle(
                            color: Color(0xFFE8B4B8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ).toList(),
                  ),
                  SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Tzedaka Option Modal
class TzedakaOptionModal extends StatelessWidget {
  final String optionId;

  const TzedakaOptionModal({Key? key, required this.optionId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    optionId == 'causes' ? 'Support Causes' : 'Sponsor a Day',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4a4a4a),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                optionId == 'causes' 
                    ? 'Choose from our partner organizations supporting Jewish women and families.'
                    : 'Dedicate a day, week, or month of mitzvot performed through our app.',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF4a4a4a),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}