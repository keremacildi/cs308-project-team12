from rest_framework import serializers
from .models import (
    Product,  Category,  
     Order, OrderItem,
    Rating, Comment,   )
from django.contrib.auth.models import User
from decimal import Decimal



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id', 'is_staff']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
    
    def update(self, instance, validated_data):
        # Update user fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    stock = serializers.IntegerField(source='quantity_in_stock', read_only=True)
    rating = serializers.FloatField(source='avg_rating', read_only=True)
    total_ratings = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    
    def get_total_ratings(self, obj):
        return Rating.objects.filter(product=obj).count()
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    cost = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'model', 'serial_number', 'description',
            'quantity_in_stock', 'stock', 'price', 'cost', 'warranty_status',
            'distributor_info', 'category', 'category_id',
            'is_available', 'rating', 'total_ratings', 'image', 'image_url'
        ]
    
    def create(self, validated_data):
        # Calculate cost field if price is provided and cost is not
        if 'price' in validated_data and ('cost' not in validated_data or validated_data['cost'] is None):
            validated_data['cost'] = validated_data['price'] * Decimal('0.5')
        
        # Create the product
        product = Product.objects.create(**validated_data)
        return product



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
    user_details = UserSerializer(source='user', read_only=True)
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'product', 'user', 'score', 'created_at', 'user_details', 'product_details']
        read_only_fields = ['created_at', 'user_details', 'product_details']
        extra_kwargs = {
            'user': {'write_only': True},
            'product': {'write_only': True}
        }


class CommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    product_details = ProductSerializer(source='product', read_only=True)
    approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'product', 'user', 'text', 'approved', 'created_at', 'user_details', 'product_details']
        read_only_fields = ['approved', 'created_at', 'user_details', 'product_details']
        extra_kwargs = {
            'user': {'write_only': True},
            'product': {'write_only': True}
        }
