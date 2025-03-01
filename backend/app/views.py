from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Review
from .serializers import ProductSerializer, ReviewSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if user has already reviewed the product
    if Review.objects.filter(user=request.user, product=product).exists():
        return Response({'error': 'You have already reviewed this product'}, status=status.HTTP_400_BAD_REQUEST)

    # Ensure user has purchased the product (pseudo-code, modify based on your Order model)
    if not request.user.orders.filter(items__product=product).exists():
        return Response({'error': 'You can only review products you have purchased'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user, product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_reviews(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    reviews = Review.objects.filter(product=product)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)
