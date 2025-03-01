from rest_framework import serializers
from .models import Product, Review, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'quantity_in_stock', 'category', 'is_active']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    created_at = serializers.ReadOnlyField()

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'is_approved', 'created_at']
        read_only_fields = ['is_approved']  # Prevent users from modifying approval status

    def validate_rating(self, value):
        # Ensure rating is either 1-5 or 1-10
        if value < 1 or value > 10:
            raise serializers.ValidationError("Rating must be between 1 and 10.")
        return value
