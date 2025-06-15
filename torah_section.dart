import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TorahSection extends StatelessWidget {
  final List<TorahItem> torahItems = [
    TorahItem(
      id: 'halacha',
      icon: Icons.menu_book,
      title: 'Daily Halacha',
      subtitle: 'Laws of Chanukah',
      color: Color(0xFFE8B4B8),
    ),
    TorahItem(
      id: 'mussar',
      icon: Icons.favorite,
      title: 'Daily Mussar',
      subtitle: 'Building Character',
      color: Color(0xFFF5C99B),
    ),
    TorahItem(
      id: 'chizuk',
      icon: Icons.play_circle,
      title: 'Daily Chizuk',
      subtitle: '5 min audio',
      color: Color(0xFFE8B4B8),
    ),
    TorahItem(
      id: 'loshon',
      icon: Icons.shield,
      title: 'Loshon Horah',
      subtitle: 'Guard Your Speech',
      color: Color(0xFFF5C99B),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Sponsorship bar
        _buildSponsorshipBar(),
        
        // Torah content grid
        Expanded(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: GridView.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.1,
              ),
              itemCount: torahItems.length,
              itemBuilder: (context, index) {
                final item = torahItems[index];
                return _buildTorahCard(context, item);
              },
            ),
          ),
        ),
        
        // Bottom padding for navigation
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
              "Today's Torah learning is sponsored by Rachel Goldstein - L'ilui nishmas Rivka bas Moshe",
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

  Widget _buildTorahCard(BuildContext context, TorahItem item) {
    return GestureDetector(
      onTap: () => _openTorahModal(context, item),
      child: Container(
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
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                item.icon,
                size: 32,
                color: item.color,
              ),
              SizedBox(height: 12),
              Text(
                item.title,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: Color(0xFF4a4a4a),
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 4),
              Text(
                item.subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openTorahModal(BuildContext context, TorahItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TorahContentModal(item: item),
    );
  }
}

class TorahItem {
  final String id;
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  TorahItem({
    required this.id,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });
}

class TorahContentModal extends StatefulWidget {
  final TorahItem item;

  const TorahContentModal({Key? key, required this.item}) : super(key: key);

  @override
  _TorahContentModalState createState() => _TorahContentModalState();
}

class _TorahContentModalState extends State<TorahContentModal> {
  Map<String, dynamic>? content;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchContent();
  }

  Future<void> _fetchContent() async {
    try {
      final date = DateTime.now().toIso8601String().split('T')[0];
      final response = await http.get(
        Uri.parse('YOUR_BACKEND_URL/api/torah/${widget.item.id}/$date'),
      );
      
      if (response.statusCode == 200) {
        setState(() {
          content = json.decode(response.body);
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
                Icon(
                  widget.item.icon,
                  color: widget.item.color,
                  size: 24,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    widget.item.title,
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
          
          // Content
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (content == null) {
      return Center(
        child: Text(
          'Content not available',
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey[600],
          ),
        ),
      );
    }

    if (widget.item.id == 'chizuk' && content!['audioUrl'] != null) {
      return AudioPlayerWidget(
        title: content!['title'] ?? widget.item.title,
        duration: content!['duration'] ?? '5:00',
        audioUrl: content!['audioUrl'],
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (content!['title'] != null)
            Text(
              content!['title'],
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4a4a4a),
              ),
            ),
          SizedBox(height: 16),
          if (content!['content'] != null)
            Text(
              content!['content'],
              style: TextStyle(
                fontSize: 16,
                height: 1.6,
                color: Color(0xFF4a4a4a),
              ),
            ),
          if (content!['hebrewText'] != null) ...[
            SizedBox(height: 20),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                content!['hebrewText'],
                style: TextStyle(
                  fontSize: 18,
                  height: 1.8,
                  color: Color(0xFF4a4a4a),
                ),
                textAlign: TextAlign.right,
              ),
            ),
          ],
          SizedBox(height: 40),
        ],
      ),
    );
  }
}

// Audio Player Widget for Chizuk content
class AudioPlayerWidget extends StatefulWidget {
  final String title;
  final String duration;
  final String audioUrl;

  const AudioPlayerWidget({
    Key? key,
    required this.title,
    required this.duration,
    required this.audioUrl,
  }) : super(key: key);

  @override
  _AudioPlayerWidgetState createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  bool isPlaying = false;
  double playbackSpeed = 1.0;
  String currentTime = '0:00';
  double progress = 0.0;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(20),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8B4B8), Color(0xFFF5C99B)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Title and duration
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  widget.title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              Text(
                widget.duration,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          
          // Controls row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              SizedBox(width: 60), // Spacer
              
              // Play/Pause button
              GestureDetector(
                onTap: () => setState(() => isPlaying = !isPlaying),
                child: Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isPlaying ? Icons.pause : Icons.play_arrow,
                    size: 28,
                    color: Colors.white,
                  ),
                ),
              ),
              
              // Speed control
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<double>(
                  value: playbackSpeed,
                  dropdownColor: Color(0xFF4a4a4a),
                  style: TextStyle(color: Colors.white, fontSize: 12),
                  underline: SizedBox(),
                  icon: Icon(Icons.arrow_drop_down, color: Colors.white, size: 16),
                  items: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) {
                    return DropdownMenuItem(
                      value: speed,
                      child: Text('${speed}x'),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => playbackSpeed = value!),
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          
          // Progress bar
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    currentTime,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                  Text(
                    widget.duration,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.white.withOpacity(0.3),
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ],
          ),
        ],
      ),
    );
  }
}