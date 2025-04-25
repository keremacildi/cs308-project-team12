from rest_framework import serializers
from .models import (
    Product, Distributor, Category, Brand, Seller,
    ShoppingCartItem, Order, OrderItem,
    Rating, Comment, ProductReview, Wishlist, CustomerProfile
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


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name']


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ['id', 'name']


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ['home_address', 'role']


class UserSerializer(serializers.ModelSerializer):
    profile = CustomerProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile', 'is_staff']
        read_only_fields = ['id', 'is_staff']


class UserCreateSerializer(serializers.ModelSerializer):
    profile = CustomerProfileSerializer(required=False)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'profile']
    
    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        profile_data = validated_data.pop('profile', {})
        
        user = User.objects.create_user(**validated_data)
        
        if profile_data:
            # Update the profile that was automatically created by the signal
            profile = user.profile
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
            
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    profile = CustomerProfileSerializer()
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'profile']
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update user fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile = instance.profile
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
            
        return instance


class ProductSerializer(serializers.ModelSerializer):
    distributor = DistributorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    seller = SellerSerializer(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    stock = serializers.IntegerField(source='quantity_in_stock', read_only=True)
    distributor_id = serializers.PrimaryKeyRelatedField(
        queryset=Distributor.objects.all(),
        source='distributor',
        write_only=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'model', 'serial_number', 'description',
            'quantity_in_stock', 'stock', 'price', 'warranty_status',
            'distributor', 'category', 'brand', 'seller', 'popularity',
            'is_available', 'average_rating', 'distributor_id', 'category_id',
            'image'
        ]


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingCartItem
        fields = ['id', 'product', 'quantity', 'total_price']
        read_only_fields = ['id', 'product', 'total_price']

    def get_total_price(self, obj):
        return obj.product.price * obj.quantity


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


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product']
