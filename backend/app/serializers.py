from rest_framework import serializers
from .models import Product, Rating, Comment

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "description", "price", "stock", "is_available"]

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ["user", "product", "score"]

    def validate_score(self, value):
        if not (1 <= value <= 5 or 1 <= value <= 10):
            raise serializers.ValidationError("Rating must be between 1-5 or 1-10 points.")
        return value

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["user", "product", "text", "is_approved"]
        read_only_fields = ["is_approved"]
