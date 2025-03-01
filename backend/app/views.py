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
    products = Product.objects.filter(name__icontains=query) | Product.objects.filter(description__icontains=query)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)
