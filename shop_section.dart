import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

class ShopSection extends StatefulWidget {
  @override
  _ShopSectionState createState() => _ShopSectionState();
}

class _ShopSectionState extends State<ShopSection> {
  List<Map<String, dynamic>> shopItems = [];
  bool isLoading = true;
  String selectedCategory = 'All';

  final List<String> categories = [
    'All',
    'Books',
    'Judaica',
    'Jewelry',
    'Home & Kitchen',
    'Clothing',
  ];

  @override
  void initState() {
    super.initState();
    _fetchShopItems();
  }

  Future<void> _fetchShopItems() async {
    try {
      final response = await http.get(
        Uri.parse('YOUR_BACKEND_URL/api/shop/items'),
      );
      
      if (response.statusCode == 200) {
        setState(() {
          shopItems = List<Map<String, dynamic>>.from(json.decode(response.body));
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  List<Map<String, dynamic>> get filteredItems {
    if (selectedCategory == 'All') {
      return shopItems;
    }
    return shopItems.where((item) => item['category'] == selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header and categories
        _buildHeader(),
        
        // Shop content
        Expanded(
          child: isLoading
              ? Center(child: CircularProgressIndicator())
              : _buildShopGrid(),
        ),
        
        // Bottom padding
        SizedBox(height: 80),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sponsorship bar
          Container(
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
                    "Shop with purpose - Supporting Jewish businesses and artisans",
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF92400E),
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 20),
          
          // Title
          Text(
            'Jewish Marketplace',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4a4a4a),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Discover beautiful items from trusted sellers',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 16),
          
          // Category filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: categories.map((category) => _buildCategoryChip(category)).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String category) {
    final isSelected = selectedCategory == category;
    
    return GestureDetector(
      onTap: () => setState(() => selectedCategory = category),
      child: Container(
        margin: EdgeInsets.only(right: 8),
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Color(0xFFE8B4B8) : Colors.grey[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Color(0xFFE8B4B8) : Colors.grey[300]!,
          ),
        ),
        child: Text(
          category,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : Color(0xFF4a4a4a),
          ),
        ),
      ),
    );
  }

  Widget _buildShopGrid() {
    final items = filteredItems;
    
    if (items.isEmpty) {
      return _buildEmptyState();
    }

    return GridView.builder(
      padding: EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) => _buildShopItem(items[index]),
    );
  }

  Widget _buildShopItem(Map<String, dynamic> item) {
    return GestureDetector(
      onTap: () => _openItemDetails(item),
      child: Container(
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
            // Image
            Expanded(
              flex: 3,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                  color: Colors.grey[100],
                ),
                child: item['imageUrl'] != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                        child: Image.network(
                          item['imageUrl'],
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(),
                        ),
                      )
                    : _buildImagePlaceholder(),
              ),
            ),
            
            // Content
            Expanded(
              flex: 2,
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title'] ?? 'Product Name',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF4a4a4a),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),
                    Text(
                      item['storeName'] ?? 'Store Name',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (item['price'] != null)
                          Text(
                            '\$${item['price']}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFE8B4B8),
                            ),
                          ),
                        Icon(
                          Icons.arrow_forward_ios,
                          size: 14,
                          color: Colors.grey[400],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
      child: Icon(
        Icons.image,
        size: 40,
        color: Colors.grey[400],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_bag_outlined,
            size: 64,
            color: Colors.grey[300],
          ),
          SizedBox(height: 16),
          Text(
            selectedCategory == 'All' 
                ? 'No items available'
                : 'No items in $selectedCategory',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Check back soon for new products!',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  void _openItemDetails(Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ItemDetailsModal(item: item),
    );
  }
}

class ItemDetailsModal extends StatelessWidget {
  final Map<String, dynamic> item;

  const ItemDetailsModal({Key? key, required this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
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
                    item['title'] ?? 'Product Details',
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
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  if (item['imageUrl'] != null)
                    Container(
                      height: 250,
                      width: double.infinity,
                      margin: EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.grey[100],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          item['imageUrl'],
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Icon(
                            Icons.image,
                            size: 60,
                            color: Colors.grey[400],
                          ),
                        ),
                      ),
                    ),
                  
                  Padding(
                    padding: EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Store info
                        Container(
                          padding: EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.store,
                                size: 20,
                                color: Color(0xFFE8B4B8),
                              ),
                              SizedBox(width: 8),
                              Text(
                                item['storeName'] ?? 'Store Name',
                                style: TextStyle(
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF4a4a4a),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 16),
                        
                        // Price
                        if (item['price'] != null) ...[
                          Text(
                            '\$${item['price']}',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFE8B4B8),
                            ),
                          ),
                          SizedBox(height: 16),
                        ],
                        
                        // Description
                        if (item['description'] != null) ...[
                          Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF4a4a4a),
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            item['description'],
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF4a4a4a),
                              height: 1.5,
                            ),
                          ),
                          SizedBox(height: 20),
                        ],
                        
                        // Features
                        if (item['features'] != null) ...[
                          Text(
                            'Features',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF4a4a4a),
                            ),
                          ),
                          SizedBox(height: 12),
                          ...item['features'].map<Widget>((feature) => Padding(
                            padding: EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 16,
                                  color: Colors.green[600],
                                ),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    feature,
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
                          SizedBox(height: 20),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom action buttons
          Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Column(
              children: [
                if (item['purchaseUrl'] != null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _launchUrl(item['purchaseUrl']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFFE8B4B8),
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Visit Store',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                
                if (item['contactEmail'] != null) ...[
                  SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => _launchUrl('mailto:${item['contactEmail']}'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Color(0xFF4a4a4a),
                        side: BorderSide(color: Colors.grey[300]!),
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Contact Seller',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}