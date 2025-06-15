import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TefillaSection extends StatefulWidget {
  @override
  _TefillaSectionState createState() => _TefillaSectionState();
}

class _TefillaSectionState extends State<TefillaSection> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> tehillimNames = [];
  List<Map<String, dynamic>> minchaPrayers = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchTefillaData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchTefillaData() async {
    try {
      final futures = await Future.wait([
        http.get(Uri.parse('YOUR_BACKEND_URL/api/tehillim/names')),
        http.get(Uri.parse('YOUR_BACKEND_URL/api/mincha/prayers')),
      ]);

      if (futures[0].statusCode == 200) {
        tehillimNames = List<Map<String, dynamic>>.from(json.decode(futures[0].body));
      }
      
      if (futures[1].statusCode == 200) {
        minchaPrayers = List<Map<String, dynamic>>.from(json.decode(futures[1].body));
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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Sponsorship bar
        _buildSponsorshipBar(),
        
        // Tab bar
        Container(
          margin: EdgeInsets.symmetric(horizontal: 16),
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
              Tab(text: 'Tehillim'),
              Tab(text: 'Mincha'),
              Tab(text: 'Women\'s'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTehillimTab(),
              _buildMinchaTab(),
              _buildWomensTab(),
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
              "Today's prayers are sponsored by Miriam Levy - For refuah shleimah for Chaim ben Sarah",
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

  Widget _buildTehillimTab() {
    if (isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Global progress card
          _buildGlobalProgressCard(),
          SizedBox(height: 20),
          
          // Add name button
          _buildAddNameButton(),
          SizedBox(height: 20),
          
          // Active names list
          Text(
            'Current Participants',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 12),
          
          if (tehillimNames.isEmpty)
            _buildEmptyState('No participants yet. Be the first to join!')
          else
            ...tehillimNames.map((name) => _buildNameCard(name)).toList(),
        ],
      ),
    );
  }

  Widget _buildGlobalProgressCard() {
    return Container(
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
                Icons.book,
                color: Colors.white,
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Global Tehillim Progress',
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
                    'Current Perek',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                  Text(
                    '47', // This would come from API
                    style: TextStyle(
                      fontSize: 24,
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
                    'Completed by',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                  Text(
                    'Sarah L.',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 12),
          LinearProgressIndicator(
            value: 47 / 150, // Progress through Tehillim
            backgroundColor: Colors.white.withOpacity(0.3),
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildAddNameButton() {
    return GestureDetector(
      onTap: () => _showAddNameDialog(),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Color(0xFFE8B4B8).withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.add_circle,
              color: Color(0xFFE8B4B8),
              size: 24,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Add Name for Tehillim',
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
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

  Widget _buildNameCard(Map<String, dynamic> name) {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name['name'] ?? '',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Color(0xFF4a4a4a),
                  ),
                ),
              ),
              if (name['isUrgent'] == true)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Urgent',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.red[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
          ),
          if (name['description'] != null) ...[
            SizedBox(height: 4),
            Text(
              name['description'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
          SizedBox(height: 8),
          Text(
            'Added ${_formatDate(name['createdAt'])}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMinchaTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mincha Prayers',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 16),
          
          if (minchaPrayers.isEmpty)
            _buildEmptyState('No mincha prayers available')
          else
            ...minchaPrayers.map((prayer) => _buildPrayerCard(prayer)).toList(),
        ],
      ),
    );
  }

  Widget _buildWomensTab() {
    final womensPrayers = [
      {
        'title': 'Tefilas Haderech',
        'subtitle': 'Traveler\'s Prayer',
        'description': 'For safe journeys',
      },
      {
        'title': 'Hadlakas Neiros',
        'subtitle': 'Shabbos Candles',
        'description': 'Light kindling blessing',
      },
      {
        'title': 'Tefilas Nashim',
        'subtitle': 'Women\'s Prayers',
        'description': 'Special prayers for women',
      },
    ];

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Women\'s Prayers',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 16),
          
          ...womensPrayers.map((prayer) => _buildPrayerCard(prayer)).toList(),
        ],
      ),
    );
  }

  Widget _buildPrayerCard(Map<String, dynamic> prayer) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () => _openPrayerModal(prayer),
        child: Container(
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
            children: [
              Icon(
                Icons.article,
                color: Color(0xFFB5C99A),
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      prayer['title'] ?? '',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        color: Color(0xFF4a4a4a),
                      ),
                    ),
                    if (prayer['subtitle'] != null) ...[
                      SizedBox(height: 2),
                      Text(
                        prayer['subtitle'],
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    if (prayer['description'] != null) ...[
                      SizedBox(height: 4),
                      Text(
                        prayer['description'],
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ],
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
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: EdgeInsets.all(32),
      child: Column(
        children: [
          Icon(
            Icons.library_books,
            size: 64,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _showAddNameDialog() {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    bool isUrgent = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Add Name for Tehillim'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Name',
                  hintText: 'e.g., Chaim ben Sarah',
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: InputDecoration(
                  labelText: 'Prayer request (optional)',
                  hintText: 'e.g., For refuah shleimah',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              SizedBox(height: 16),
              CheckboxListTile(
                title: Text('Urgent'),
                value: isUrgent,
                onChanged: (value) => setState(() => isUrgent = value ?? false),
                controlAffinity: ListTileControlAffinity.leading,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (nameController.text.trim().isNotEmpty) {
                  _submitName(
                    nameController.text.trim(),
                    descriptionController.text.trim(),
                    isUrgent,
                  );
                  Navigator.pop(context);
                }
              },
              child: Text('Add'),
            ),
          ],
        ),
      ),
    );
  }

  void _submitName(String name, String description, bool isUrgent) async {
    try {
      final response = await http.post(
        Uri.parse('YOUR_BACKEND_URL/api/tehillim/names'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'description': description.isEmpty ? null : description,
          'isUrgent': isUrgent,
        }),
      );

      if (response.statusCode == 201) {
        _fetchTefillaData(); // Refresh the list
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Name added successfully')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add name')),
      );
    }
  }

  void _openPrayerModal(Map<String, dynamic> prayer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              margin: EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      prayer['title'] ?? '',
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
                child: Text(
                  prayer['content'] ?? 'Prayer content would be displayed here.',
                  style: TextStyle(
                    fontSize: 16,
                    height: 1.6,
                    color: Color(0xFF4a4a4a),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date).inDays;
      
      if (difference == 0) return 'today';
      if (difference == 1) return 'yesterday';
      return '$difference days ago';
    } catch (e) {
      return dateString;
    }
  }
}