from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Product, Review, Order
from .serializers import ProductSerializer, ReviewSerializer

@api_view(['GET'])
def list_products(request):
    """
    Retrieve a list of products with optional filtering and sorting.
    
    Query parameters:
      - q: Optional search term to filter products by name or description.
      - sort_by: Sort criteria. Acceptable values:
          • 'price' (ascending) or '-price' (descending),
          • 'popularity' (most popular first) or '-popularity' (least popular first).
    """
    query = request.GET.get('q', '')
    sort_by = request.GET.get('sort_by', '')
    
    products = Product.objects.all()
    
    if query:
        products = products.filter(name__icontains=query) | products.filter(description__icontains=query)
    
    if sort_by:
        if sort_by == 'price':
            products = products.order_by('price')
        elif sort_by == '-price':
            products = products.order_by('-price')
        elif sort_by == 'popularity':
            # Annotate with count of related order items (popularity) and order descending (most popular first)
            products = products.annotate(popularity=Count('ordered_items')).order_by('-popularity')
        elif sort_by == '-popularity':
            products = products.annotate(popularity=Count('ordered_items')).order_by('popularity')
    
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """
    Cancel an order. An order can only be cancelled if its status is 'processing'.
    """
    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or not owned by user'}, status=status.HTTP_404_NOT_FOUND)
    
    if order.status != 'processing':
        return Response({'error': 'Order cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
    
    order.status = 'cancelled'
    order.save()
    return Response({'message': 'Order cancelled successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_order(request, order_id):
    """
    Process a refund request for an order.
    An order is refundable only if its status is 'delivered'.
    The refund amount is calculated using the purchase price stored for each order item.
    This ensures that if a discount campaign was in effect at purchase time, the refund reflects that discounted amount.
    """
    try:
        order = Order.objects.get(id=order_id, customer=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found or not owned by user'}, status=status.HTTP_404_NOT_FOUND)
    
    if order.status != 'delivered':
        return Response({'error': 'Order is not eligible for refund'}, status=status.HTTP_400_BAD_REQUEST)
    
    refund_amount = 0
    for item in order.items.all():
        refund_amount += item.purchase_price * item.quantity
    
    return Response({'refund_amount': refund_amount}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Retrieve the profile information of the authenticated user.
    Returns the user's name, email address, and delivery address.
    """
    user = request.user
    profile_data = {
        'name': user.get_full_name() or user.username,
        'email': user.email,
        'delivery_address': user.home_address,
    }
    return Response(profile_data, status=status.HTTP_200_OK)


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

    # Ensure the user has purchased the product (pseudo-code; adjust based on your Order model)
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
