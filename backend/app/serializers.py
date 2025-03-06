from rest_framework import serializers
from .models import Product, Review

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
