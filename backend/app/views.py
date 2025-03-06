from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML
import uuid
import os
from .models import (
    Product, Review, Order, AnonymousCart, AnonymousCartItem,
    Cart, CartItem, Payment, Invoice, OrderItem
)
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


class AnonymousCartViewSet(viewsets.ViewSet):
    def get_or_create_cart(self, request):
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        
        cart, created = AnonymousCart.objects.get_or_create(session_key=session_key)
        return cart

    def list(self, request):
        cart = self.get_or_create_cart(request)
        items = cart.items.all()
        data = [{
            'id': item.id,
            'product': {
                'id': item.product.id,
                'name': item.product.name,
                'price': str(item.product.price)
            },
            'quantity': item.quantity
        } for item in items]
        return Response(data)

    def create(self, request):
        cart = self.get_or_create_cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = AnonymousCartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({'message': 'Item added to cart'}, status=status.HTTP_201_CREATED)


class ProductManagerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def pending_deliveries(self, request):
        if request.user.role != 'product_manager':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.filter(status='processing')
        data = [{
            'order_id': order.id,
            'customer': order.customer.username,
            'delivery_address': order.delivery_address,
            'items': [{
                'product': item.product.name,
                'quantity': item.quantity
            } for item in order.items.all()]
        } for order in orders]
        return Response(data)

    @action(detail=False, methods=['get'])
    def invoices(self, request):
        if request.user.role != 'product_manager':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        invoices = Invoice.objects.all().order_by('-generated_at')
        data = [{
            'invoice_number': invoice.invoice_number,
            'order_id': invoice.order.id,
            'customer': invoice.order.customer.username,
            'amount': str(invoice.order.total_price),
            'generated_at': invoice.generated_at,
            'pdf_url': invoice.pdf_file.url if invoice.pdf_file else None
        } for invoice in invoices]
        return Response(data)


def generate_invoice_pdf(order):
    invoice = Invoice.objects.create(
        order=order,
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
        sent_to_email=order.customer.email
    )

    # Generate HTML content for the invoice
    context = {
        'order': order,
        'invoice': invoice,
        'company_name': 'Your Company Name',
        'company_address': 'Your Company Address'
    }
    html_content = render_to_string('invoice_template.html', context)

    # Convert HTML to PDF
    pdf_file = HTML(string=html_content).write_pdf()
    
    # Save PDF to file
    file_path = f'invoices/invoice_{invoice.invoice_number}.pdf'
    os.makedirs('media/invoices', exist_ok=True)
    with open(f'media/{file_path}', 'wb') as f:
        f.write(pdf_file)
    
    invoice.pdf_file = file_path
    invoice.save()

    # Send email with PDF attachment
    send_mail(
        subject=f'Invoice #{invoice.invoice_number} for your order',
        message='Please find attached the invoice for your recent order.',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.customer.email],
        html_message=html_content,
        fail_silently=False,
    )

    invoice.is_sent = True
    invoice.save()
    
    return invoice


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def merge_carts(request):
    """
    Merge anonymous cart with user's cart upon login
    """
    session_key = request.session.session_key
    if not session_key:
        return Response({'message': 'No anonymous cart to merge'})

    try:
        anonymous_cart = AnonymousCart.objects.get(session_key=session_key)
    except AnonymousCart.DoesNotExist:
        return Response({'message': 'No anonymous cart to merge'})

    user_cart, _ = Cart.objects.get_or_create(customer=request.user)

    # Merge items
    for anon_item in anonymous_cart.items.all():
        cart_item, created = CartItem.objects.get_or_create(
            cart=user_cart,
            product=anon_item.product,
            defaults={'quantity': anon_item.quantity}
        )
        if not created:
            cart_item.quantity += anon_item.quantity
            cart_item.save()

    # Delete anonymous cart
    anonymous_cart.delete()

    return Response({'message': 'Carts merged successfully'})


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        product = self.get_object()
        reviews = Review.objects.filter(product=product)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class ShoppingCartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(customer=self.request.user)
        return Product.objects.filter(cart_items__cart=cart)

    def create(self, request):
        cart, _ = Cart.objects.get_or_create(customer=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        return Response({'message': 'Item added to cart'}, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        cart = Cart.objects.get(customer=request.user)
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=pk)
            cart_item.delete()
            return Response({'message': 'Item removed from cart'}, status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)

    def create(self, request):
        cart, _ = Cart.objects.get_or_create(customer=request.user)
        cart_items = cart.items.all()

        if not cart_items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Create order
        order = Order.objects.create(
            customer=request.user,
            delivery_address=request.user.home_address,
            total_price=sum(item.product.price * item.quantity for item in cart_items)
        )

        # Create order items
        for cart_item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                purchase_price=cart_item.product.price
            )

        # Clear cart
        cart_items.delete()

        # Generate invoice and send email
        generate_invoice_pdf(order)

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != 'processing':
            return Response({'error': 'Order cannot be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'cancelled'
        order.save()
        return Response({'message': 'Order cancelled successfully'})

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        order = self.get_object()
        if order.status != 'delivered':
            return Response({'error': 'Order is not eligible for refund'}, status=status.HTTP_400_BAD_REQUEST)
        
        refund_amount = sum(item.purchase_price * item.quantity for item in order.items.all())
        return Response({'refund_amount': refund_amount})
