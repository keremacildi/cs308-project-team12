from rest_framework import serializers
from .models import Product, Review, Category, Order, OrderItem, User

class ProductSerializer(serializers.ModelSerializer):
    sale_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2)
    cost_price = serializers.DecimalField(source='cost', max_digits=10, decimal_places=2)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'sale_price', 'cost_price']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    created_at = serializers.ReadOnlyField()

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class OrderItemAdminSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name')
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'quantity', 'purchase_price']

class OrderAdminSerializer(serializers.ModelSerializer):
    items = OrderItemAdminSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.username')
    
    class Meta:
        model = Order
        fields = ['id', 'customer_name', 'order_date', 'status', 'delivery_address', 
                 'total_price', 'items']

class ProductAdminSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'model', 'serial_number', 'description', 
                 'quantity_in_stock', 'price', 'cost', 'warranty_status', 
                 'distributor_info', 'category', 'category_name', 'is_active']

class DashboardStatsSerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    recent_orders = OrderAdminSerializer(many=True)
