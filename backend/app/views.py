from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import get_object_or_404
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer
from django.db.models import Count  # add this import at the top
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import get_object_or_404
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer



@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def place_order(request):
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
def search_products(request):
    query = request.GET.get('q', '')
    sort_by = request.GET.get('sort_by', '')  # new query parameter for sorting
    
    # Filter products by matching query in name or description
    products = Product.objects.filter(name__icontains=query) | Product.objects.filter(description__icontains=query)
    
    # Apply sorting if requested
    if sort_by:
        if sort_by == 'price':  # sort by price ascending
            products = products.order_by('price')
        elif sort_by == '-price':  # sort by price descending
            products = products.order_by('-price')
        elif sort_by == 'popularity':  
            # Sorting by popularity: assuming that higher popularity means more orders.
            # This requires that the Order model has a foreign key to Product with a related name of 'orders'.
            products = products.annotate(order_count=Count('orders')).order_by('-order_count')
        elif sort_by == '-popularity':
            products = products.annotate(order_count=Count('orders')).order_by('order_count')
    
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

