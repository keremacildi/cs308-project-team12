from rest_framework import serializers
from .models import (
    Product, Distributor, Category,
    ShoppingCartItem, Order, OrderItem,
    Rating, Comment, ProductReview
)
from django.contrib.auth.models import User


class DistributorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distributor
        fields = ['id', 'name', 'contact_info']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    distributor = DistributorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'model', 'serial_number', 'description',
            'quantity_in_stock', 'price', 'warranty_status',
            'distributor', 'category', 'popularity', 'is_available', 'average_rating'
        ]


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = ShoppingCartItem
        fields = ['id', 'product', 'product_id', 'quantity']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price_at_purchase']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status = serializers.CharField(read_only=True)
    invoice_pdf = serializers.FileField(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'created_at', 'status', 'total_price', 'items', 'invoice_pdf']


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'product', 'score', 'created_at']
        read_only_fields = ['created_at']


class CommentSerializer(serializers.ModelSerializer):
    approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'product', 'text', 'approved', 'created_at']
        read_only_fields = ['approved', 'created_at']


class ProductReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ['id', 'user', 'product', 'rating', 'comment', 'is_approved', 'created_at']
        read_only_fields = ['user', 'is_approved', 'created_at']
