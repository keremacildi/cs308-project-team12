from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Product, ShoppingCart, CartItem, Order, OrderItem
from .serializers import ProductSerializer, ShoppingCartSerializer, CartItemSerializer, OrderSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ShoppingCartViewSet(viewsets.ViewSet):
    def list(self, request):
        cart, created = ShoppingCart.objects.get_or_create(user=request.user if request.user.is_authenticated else None)
        serializer = ShoppingCartSerializer(cart)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        cart, created = ShoppingCart.objects.get_or_create(user=request.user if request.user.is_authenticated else None)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        cart_item.quantity += 1
        cart_item.save()

        return Response({"message": "Product added to cart"}, status=status.HTTP_201_CREATED)

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        cart = ShoppingCart.objects.get(user=request.user)
        if not cart.items.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        total_price = sum(item.quantity * item.product.price for item in cart.items.all())
        order = Order.objects.create(user=request.user, total_price=total_price)

        for item in cart.items.all():
            OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity, price=item.product.price)
            item.product.quantity_in_stock -= item.quantity
            item.product.save()

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        if new_status in dict(Order.OrderStatus.choices):
            order.status = new_status
            order.save()
            return Response({"message": "Order status updated"}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
