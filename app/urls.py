from rest_framework import viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Count
from .models import Product, Order, Category, Cart
from .serializers import ProductSerializer, OrderSerializer, CartSerializer
import uuid

# List products grouped by category (shows available stock via product.quantity_in_stock).
@api_view(['GET'])
def list_products(request):
    categories = Category.objects.prefetch_related('products').all()
    data = {}
    for category in categories:
        products = category.products.filter(is_active=True)
        serializer = ProductSerializer(products, many=True)
        data[category.name] = serializer.data
    return Response(data)

# Place order – requires user authentication.
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def place_order(request):
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# Search and sort products by name/description, price, or popularity.
@api_view(['GET'])
def search_products(request):
    query = request.GET.get('q', '')
    sort_by = request.GET.get('sort_by', '')

    # Filter products matching query in name or description.
    products = Product.objects.filter(name__icontains=query) | Product.objects.filter(description__icontains=query)

    # Apply sorting if provided.
    if sort_by:
        if sort_by == 'price':
            products = products.order_by('price')
        elif sort_by == '-price':
            products = products.order_by('-price')
        elif sort_by == 'popularity':
            # Popularity is defined as the number of order items for the product.
            products = products.annotate(order_count=Count('order_items')).order_by('-order_count')
        elif sort_by == '-popularity':
            products = products.annotate(order_count=Count('order_items')).order_by('order_count')

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

# Anonymous cart viewset – allows adding products without login.
class AnonymousCartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [AllowAny]
    queryset = Cart.objects.filter(user__isnull=True)

    def get_queryset(self):
        session_key = self.request.query_params.get('session_key')
        if session_key:
            return self.queryset.filter(session_key=session_key)
        return self.queryset.none()

    def create(self, request, *args, **kwargs):
        if not request.data.get('session_key'):
            request.data['session_key'] = str(uuid.uuid4())
        return super().create(request, *args, **kwargs)

# Shopping cart viewset – for authenticated users.
class ShoppingCartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Admin viewset – for product management tasks.
class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]  # Optionally, check for a managerial role here.

    # GET /manager/products/ – List all products.
    def products(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    # POST /manager/products/ – Add a new product.
    def add_product(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    # PUT /manager/products/<pk>/ – Update an existing product.
    def update_product(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
