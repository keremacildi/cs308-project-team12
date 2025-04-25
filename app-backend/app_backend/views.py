from io import BytesIO
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage, send_mail
from django.core.files.base import ContentFile
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.db.models import Q, Avg, Sum, Count
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from .permissions import IsStaff

from .models import (
    Product, ShoppingCartItem, Order, OrderItem, Rating,
    Comment, PaymentConfirmation, Delivery, Wishlist, ProductReview,
    Category, Brand, Seller
)
from django.contrib.auth.models import User
from .serializers import (
    OrderSerializer, ProductReviewSerializer, ShoppingCartItemSerializer,
    ProductSerializer, RatingSerializer, CommentSerializer, WishlistSerializer,
    CategorySerializer, BrandSerializer, SellerSerializer, UserCreateSerializer,
    UserSerializer, UserUpdateSerializer
)
from django.utils.crypto import get_random_string
from datetime import timedelta

# --- Home View ---
def home(request):
    return HttpResponse("Welcome to the backend API. Everything is running!")

# --- Helper for Cart Items ---
def get_cart_items(request):
    if request.user.is_authenticated:
        return ShoppingCartItem.objects.filter(user=request.user)
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        return ShoppingCartItem.objects.filter(session_key=session_key)

# --- Product Listing ---
def product_list(request):
    query = request.GET.get('q')
    sort_by = request.GET.get('sort')
    products = Product.objects.all()
    if query:
        products = products.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )
    if sort_by == 'price':
        products = products.order_by('price')
    elif sort_by == 'popularity':
        products = products.order_by('-popularity')
    return render(request, 'store/product_list.html', {'products': products})

# --- Product Details ---
def product_detail(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    serializer = ProductSerializer(product)
    return Response(serializer.data)

# --- Cart Operations ---
def add_to_cart(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    if not product.is_available:
        return HttpResponse("Product is out of stock.", status=400)
    if request.user.is_authenticated:
        item, created = ShoppingCartItem.objects.get_or_create(user=request.user, product=product)
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        item, created = ShoppingCartItem.objects.get_or_create(session_key=session_key, product=product)
    item.quantity += 1
    item.save()
    return redirect('view_cart')

def remove_from_cart(request, item_id):
    item = get_object_or_404(ShoppingCartItem, id=item_id)
    item.delete()
    return redirect('view_cart')

def view_cart(request):
    items = get_cart_items(request)
    total = sum(item.product.price * item.quantity for item in items)
    return render(request, 'store/cart.html', {'cart_items': items, 'total': total})

# --- Checkout Process ---
@login_required
def checkout(request):
    cart_items = get_cart_items(request)
    if not cart_items:
        return HttpResponse("Cart is empty.")
    total_price = sum(item.product.price * item.quantity for item in cart_items)
    # Decrease stock for each cart item
    for item in cart_items:
        if item.product.quantity_in_stock < item.quantity:
            return HttpResponse(f"Not enough stock for {item.product.name}.", status=400)
        item.product.quantity_in_stock -= item.quantity
        item.product.save()
    order = Order.objects.create(user=request.user, total_price=total_price)
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )
    # Create delivery record with initial status and set delivery address from customer's profile.
    delivery_address = request.user.profile.home_address if hasattr(request.user, 'profile') else ""
    Delivery.objects.create(order=order, status='processing', delivery_address=delivery_address)
    cart_items.delete()
    PaymentConfirmation.objects.create(order=order, confirmed=True, confirmed_at=timezone.now())
    pdf_buffer = generate_invoice_pdf(order)
    order.invoice_pdf.save(
        f'invoice_order_{order.pk}.pdf',
        ContentFile(pdf_buffer.getvalue())
    )
    send_invoice_email(order)
    return render(request, 'store/checkout_success.html', {'order': order})

# --- Order History ---
@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'store/order_history.html', {'orders': orders})

# --- Rating and Comment Submission ---
@login_required
def submit_rating(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    # Only allow rating if the product was delivered (i.e. in a delivered order)
    has_delivered = OrderItem.objects.filter(
        order__user=request.user,
        order__status='delivered',
        product=product
    ).exists()
    if not has_delivered:
        return HttpResponse("You can only rate a delivered product.", status=403)
    try:
        score = int(request.POST.get('score', 0))
    except ValueError:
        return HttpResponse("Invalid score.", status=400)
    if not (1 <= score <= 5):
        return HttpResponse("Invalid score.", status=400)
    Rating.objects.update_or_create(
        user=request.user,
        product=product,
        defaults={'score': score}
    )
    return redirect('product_detail', product_id=product_id)

@login_required
def submit_comment(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    # Only allow comment if the product was delivered
    has_delivered = OrderItem.objects.filter(
        order__user=request.user,
        order__status='delivered',
        product=product
    ).exists()
    if not has_delivered:
        return HttpResponse("You can only comment on a delivered product.", status=403)
    text = request.POST.get('text', '')
    if not text.strip():
        return HttpResponse("Comment cannot be empty.", status=400)
    # Comments are created as unapproved by default (awaiting manager approval)
    Comment.objects.create(user=request.user, product=product, text=text)
    return redirect('product_detail', product_id=product_id)

# --- PDF Generation and Email Sending ---
def generate_invoice_pdf(order):
    buffer = BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 800, f"Invoice for Order #{order.id}")
    p.drawString(100, 780, f"Customer: {order.user.username}")
    y = 750
    for item in order.items.all():
        p.drawString(100, y, f"{item.product.name} x {item.quantity} - ${item.product.price}")
        y -= 20
    p.drawString(100, y - 20, f"Total: ${order.total_price}")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer

def send_invoice_email(order):
    pdf = generate_invoice_pdf(order)
    email = EmailMessage(
        f"Invoice for Order #{order.id}",
        "Please find your invoice attached.",
        to=[order.user.email]
    )
    email.attach(f"invoice_order_{order.id}.pdf", pdf.read(), "application/pdf")
    email.send()

# --- Merge Cart Items on Login ---
@receiver(user_logged_in)
def merge_cart(sender, request, user, **kwargs):
    session_key = request.session.session_key
    if not session_key:
        return
    session_items = ShoppingCartItem.objects.filter(session_key=session_key)
    for item in session_items:
        existing_item = ShoppingCartItem.objects.filter(user=user, product=item.product).first()
        if existing_item:
            existing_item.quantity += item.quantity
            existing_item.save()
            item.delete()
        else:
            item.user = user
            item.session_key = None
            item.save()

# --- Order Cancellation and Refund ---
@login_required
def cancel_order(request, order_id):
    order = get_object_or_404(Order, pk=order_id, user=request.user)
    if order.status != 'processing':
        return HttpResponse("Order cannot be cancelled.", status=403)
    order.status = 'cancelled'
    order.save()
    return HttpResponse("Order cancelled successfully.")

@login_required
def refund_order(request, order_id):
    order = get_object_or_404(Order, pk=order_id, user=request.user)
    if order.status != 'delivered':
        return HttpResponse("Order cannot be refunded.", status=403)
    
    refunded_amount = 0
    for item in order.items.all():
        item.product.quantity_in_stock += item.quantity
        item.product.save()
        # Use discounted price if available, otherwise fall back to price_at_purchase
        refund_price = item.discounted_price if item.discounted_price else item.price_at_purchase
        refunded_amount += refund_price * item.quantity

    order.status = 'refunded'
    order.save()

    send_mail(
        'Refund Approved',
        f'Your order #{order.id} has been refunded. Refunded Amount: ${refunded_amount:.2f}.',
        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
        [order.user.email]
    )
    return HttpResponse("Order refunded successfully.")

# --- Customer Profile ---
@login_required
def profile(request):
    user = request.user
    profile = user.profile
    return render(request, 'store/profile.html', {'user': user, 'profile': profile})

# --- Wishlist Management ---
@login_required
def add_to_wishlist(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    Wishlist.objects.get_or_create(user=request.user, product=product)
    return redirect('view_wishlist')

@login_required
def view_wishlist(request):
    items = Wishlist.objects.filter(user=request.user)
    return render(request, 'store/wishlist.html', {'wishlist_items': items})

@login_required
def remove_from_wishlist(request, product_id):
    Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
    return redirect('view_wishlist')

# --- Manager Dashboard ---
@staff_member_required
def manager_orders(request):
    orders = Order.objects.filter(status__in=['processing', 'in_transit'])
    return render(request, 'store/manager_orders.html', {'orders': orders})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        print("Received order creation request:", request.data)  # Log the incoming request
        
        # Get order items either from cart or request data
        if 'order_items' in request.data:
            # Direct order creation
            order_items = request.data['order_items']
            delivery_address = request.data.get('delivery_address', '')
            total_price = request.data.get('total_price', 0)
            
            print("Processing direct order with items:", order_items)  # Log order items
            
            # Validate order items
            if not order_items or len(order_items) == 0:
                return Response({'error': 'Order items are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check stock availability
            for item in order_items:
                try:
                    product = Product.objects.get(id=item['product'])
                    if item['quantity'] > product.quantity_in_stock:
                        return Response(
                            {'error': f'Not enough stock for {product.name}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Product.DoesNotExist:
                    return Response(
                        {'error': f'Product with ID {item["product"]} not found'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        else:
            # Cart-based order creation
            cart_items = ShoppingCartItem.objects.filter(user=request.user)
            if not cart_items.exists():
                return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            order_items = []
            total_price = 0
            delivery_address = request.data.get('delivery_address', '')
            
            for cart_item in cart_items:
                if cart_item.quantity > cart_item.product.quantity_in_stock:
                    return Response(
                        {'error': f'Not enough stock for {cart_item.product.name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                total_price += cart_item.product.price * cart_item.quantity
                order_items.append({
                    'product': cart_item.product.id,
                    'quantity': cart_item.quantity,
                    'price_at_purchase': cart_item.product.price
                })
        
        # Create the order
        order = Order.objects.create(
            user=request.user,
            total_price=total_price,
            status='processing'
        )
        
        print("Created order:", order.id)  # Log order creation
        
        # Create order items and reduce stock
        for item in order_items:
            product = Product.objects.get(id=item['product'])
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item['quantity'],
                price_at_purchase=item['price_at_purchase']
            )
            # Reduce stock
            product.quantity_in_stock -= item['quantity']
            product.save()
            print(f"Created order item for product {product.id}, reduced stock to {product.quantity_in_stock}")
        
        # Create delivery record
        Delivery.objects.create(
            order=order,
            delivery_address=delivery_address,
            status='processing'
        )
        
        # Clear the cart if this was a cart-based order
        if 'order_items' not in request.data:
            cart_items.delete()
        
        # Return detailed order information
        return Response({
            'order': {
                'id': order.id,
                'total_price': order.total_price,
                'status': order.status,
                'created_at': order.created_at,
            },
            'message': 'Order created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Order creation error: {str(e)}")  # Add logging
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_history(request):
    try:
        orders = Order.objects.filter(user=request.user).prefetch_related(
            'items__product',
            'delivery'
        ).order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        
        # Check if the user has purchased and received the product
        delivery = Delivery.objects.filter(
            order__user=request.user,
            order__items__product=product,
            status='delivered'
        ).first()
        
        if not delivery:
            return Response(
                {'error': 'You can only review products that have been delivered to you.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has already reviewed this product
        existing_review = ProductReview.objects.filter(
            user=request.user,
            product=product
        ).first()
        
        if existing_review:
            return Response(
                {'error': 'You have already reviewed this product.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the review
        review = ProductReview.objects.create(
            user=request.user,
            product=product,
            rating=request.data.get('rating'),
            comment=request.data.get('comment', ''),
            delivery=delivery,
            is_approved=False  # Comments need approval, ratings don't
        )
        
        return Response({
            'message': 'Review submitted successfully',
            'review_id': review.id
        }, status=status.HTTP_201_CREATED)
        
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_product_reviews(request, product_id):
    try:
        reviews = ProductReview.objects.filter(
            product_id=product_id,
            is_approved=True
        ).select_related('user', 'product')
        
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response({
            'reviews': serializer.data,
            'average_rating': reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsStaff])
def approve_review(request, review_id):
    try:
        review = ProductReview.objects.get(id=review_id)
        review.is_approved = True
        review.save()
        
        return Response({
            'message': 'Review approved successfully'
        })
        
    except ProductReview.DoesNotExist:
        return Response(
            {'error': 'Review not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def cart_view(request):
    try:
        cart_items = get_cart_items(request)
        serializer = ShoppingCartItemSerializer(cart_items, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def add_to_cart(request, product_id):
    try:
        product = get_object_or_404(Product, id=product_id)
        quantity = request.data.get('quantity', 1)
        
        if quantity > product.quantity_in_stock:
            return Response(
                {'error': 'Not enough stock available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart_item, created = ShoppingCartItem.objects.get_or_create(
            product=product,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.session.session_key if not request.user.is_authenticated else None,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = ShoppingCartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def remove_from_cart(request, item_id):
    try:
        cart_item = get_object_or_404(ShoppingCartItem, id=item_id)
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
def update_cart_item(request, item_id):
    try:
        cart_item = get_object_or_404(ShoppingCartItem, id=item_id)
        quantity = request.data.get('quantity')
        
        if quantity is None:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quantity > cart_item.product.quantity_in_stock:
            return Response(
                {'error': 'Not enough stock available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart_item.quantity = quantity
        cart_item.save()
        
        serializer = ShoppingCartItemSerializer(cart_item)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- API Views ---
class ProductListAPIView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()

    def get_queryset(self):
        queryset = Product.objects.all()
        query = self.request.query_params.get('q', None)
        sort_by = self.request.query_params.get('sort', None)
        
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        
        if sort_by == 'price':
            queryset = queryset.order_by('price')
        elif sort_by == 'popularity':
            queryset = queryset.order_by('-popularity')
            
        return queryset

class ProductDetailAPIView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    lookup_field = 'id'

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_products(request):
    """
    Get all products with optional filtering and sorting.
    """
    products = Product.objects.all()
    
    # Apply category filter if provided
    category = request.query_params.get('category', None)
    if category:
        products = products.filter(category__name=category)
    
    # Apply brand filter if provided
    brand = request.query_params.get('brand', None)
    if brand:
        products = products.filter(brand__name=brand)
    
    # Apply seller filter if provided
    seller = request.query_params.get('seller', None)
    if seller:
        products = products.filter(seller__name=seller)
    
    # Apply price range filter if provided
    min_price = request.query_params.get('min_price', None)
    if min_price:
        products = products.filter(price__gte=float(min_price))
    
    max_price = request.query_params.get('max_price', None)
    if max_price:
        products = products.filter(price__lte=float(max_price))
    
    # Apply sorting
    sort_by = request.query_params.get('sort', None)
    if sort_by == 'price_asc':
        products = products.order_by('price')
    elif sort_by == 'price_desc':
        products = products.order_by('-price')
    elif sort_by == 'popularity':
        products = products.order_by('-popularity')
    elif sort_by == 'rating':
        products = products.order_by('-avg_rating')
    
    # Serialize and return
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Login the user
        from django.contrib.auth import login
        login(request, user)
        
        # Get CSRF token
        from django.middleware.csrf import get_token
        csrf_token = get_token(request)
        
        # Get user data using UserSerializer
        user_serializer = UserSerializer(user)
        
        # Return user data and CSRF token
        response = Response({
            'message': 'Login successful',
            'user': user_serializer.data
        })
        
        # Set CSRF cookie
        response.set_cookie(
            'csrftoken',
            csrf_token,
            httponly=False,
            samesite='Lax',
            secure=False
        )
        
        return response
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def search_products(request):
    try:
        # Get query parameters
        query = request.query_params.get('q', '')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        category = request.query_params.get('category')
        brand = request.query_params.get('brand')
        seller = request.query_params.get('seller')
        sort_by = request.query_params.get('sort', 'relevance')

        # Start with base queryset
        products = Product.objects.all()

        # Apply search query
        if query:
            products = products.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )

        # Apply price filters
        if min_price:
            products = products.filter(price__gte=float(min_price))
        if max_price:
            products = products.filter(price__lte=float(max_price))

        # Apply category filter
        if category:
            products = products.filter(category__name=category)
            
        # Apply brand filter
        if brand:
            products = products.filter(brand__name=brand)
            
        # Apply seller filter
        if seller:
            products = products.filter(seller__name=seller)

        # Apply sorting
        if sort_by == 'price_low':
            products = products.order_by('price')
        elif sort_by == 'price_high':
            products = products.order_by('-price')
        elif sort_by == 'popularity':
            products = products.order_by('-popularity')
        elif sort_by == 'rating':
            products = products.order_by('-avg_rating')

        # Calculate pagination
        total_products = products.count()
        total_pages = (total_products + page_size - 1) // page_size
        start = (page - 1) * page_size
        end = start + page_size

        # Get paginated results
        paginated_products = products[start:end]

        # Serialize results
        serializer = ProductSerializer(paginated_products, many=True)

        return Response({
            'products': serializer.data,
            'pagination': {
                'total': total_products,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages
            },
            'filters': {
                'query': query,
                'min_price': min_price,
                'max_price': max_price,
                'category': category,
                'brand': brand,
                'seller': seller,
                'sort_by': sort_by
            }
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate reset token
        token = get_random_string(length=32)
        user.reset_token = token
        user.reset_token_expires = timezone.now() + timedelta(hours=1)
        user.save()

        # Send reset email
        reset_url = f"{request.build_absolute_uri('/')}reset-password?token={token}"
        send_mail(
            'Password Reset Request',
            f'Click the following link to reset your password: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )

        return Response({
            'message': 'Password reset email sent successfully'
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    try:
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response(
                {'error': 'Token and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(reset_token=token)
            if user.reset_token_expires < timezone.now():
                return Response(
                    {'error': 'Reset token has expired'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        user.save()

        return Response({
            'message': 'Password reset successfully'
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_dashboard(request):
    try:
        # Get recent orders
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        
        # Get sales statistics
        total_sales = Order.objects.filter(
            status='delivered',
            created_at__gte=timezone.now() - timedelta(days=30)
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Get product statistics
        product_stats = Product.objects.aggregate(
            total_products=Count('id'),
            low_stock=Count('id', filter=Q(quantity_in_stock__lt=10))
        )
        
        # Get recent reviews
        recent_reviews = ProductReview.objects.select_related(
            'user', 'product'
        ).order_by('-created_at')[:5]
        
        return Response({
            'recent_orders': OrderSerializer(recent_orders, many=True).data,
            'sales': {
                'total_last_30_days': total_sales,
                'total_orders': Order.objects.count(),
                'pending_orders': Order.objects.filter(status='processing').count()
            },
            'products': {
                'total': product_stats['total_products'],
                'low_stock': product_stats['low_stock']
            },
            'recent_reviews': ProductReviewSerializer(recent_reviews, many=True).data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsStaff])
def admin_orders(request):
    try:
        status_filter = request.query_params.get('status')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        orders = Order.objects.select_related('user').all()
        
        if status_filter:
            orders = orders.filter(status=status_filter)
        if date_from:
            orders = orders.filter(created_at__gte=date_from)
        if date_to:
            orders = orders.filter(created_at__lte=date_to)
            
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT', 'POST', 'DELETE'])
@permission_classes([IsStaff])
def admin_products(request, product_id=None):
    try:
        if request.method == 'GET':
            if product_id:
                product = get_object_or_404(Product, id=product_id)
                serializer = ProductSerializer(product)
            else:
                products = Product.objects.all()
                serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
            
        elif request.method == 'PUT':
            product = get_object_or_404(Product, id=product_id)
            serializer = ProductSerializer(product, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'POST':
            serializer = ProductSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            product = get_object_or_404(Product, id=product_id)
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wishlist_view(request):
    try:
        wishlist_items = Wishlist.objects.filter(
            user=request.user
        ).select_related('product')
        
        serializer = WishlistSerializer(wishlist_items, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist(request, product_id):
    try:
        product = get_object_or_404(Product, id=product_id)
        
        # Check if already in wishlist
        if Wishlist.objects.filter(user=request.user, product=product).exists():
            return Response(
                {'error': 'Product already in wishlist'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add to wishlist
        wishlist_item = Wishlist.objects.create(
            user=request.user,
            product=product
        )
        
        serializer = WishlistSerializer(wishlist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_wishlist(request, product_id):
    try:
        wishlist_item = get_object_or_404(
            Wishlist,
            user=request.user,
            product_id=product_id
        )
        wishlist_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    """
    API endpoint for user registration.
    Expects:
    {
        "username": "string",
        "email": "string",
        "password": "string",
        "confirm_password": "string",
        "first_name": "string",
        "last_name": "string",
        "profile": {
            "home_address": "string",
            "role": "customer"
        }
    }
    """
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create a UserSerializer instance to return the user data
        user_serializer = UserSerializer(user)
        return Response({
            'message': 'User registered successfully',
            'user': user_serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    GET: Get the user's profile
    PUT: Update the user's profile
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
        
    elif request.method == 'PUT':
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change the user's password
    Expects:
    {
        "old_password": "string",
        "new_password": "string",
        "confirm_password": "string"
    }
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    # Validate input
    if not old_password or not new_password or not confirm_password:
        return Response({
            'error': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    if new_password != confirm_password:
        return Response({
            'error': 'New passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    # Check old password
    if not user.check_password(old_password):
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({
        'message': 'Password changed successfully'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    """
    Get all product categories.
    """
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_brands(request):
    """
    Get all product brands.
    """
    brands = Brand.objects.all()
    serializer = BrandSerializer(brands, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_sellers(request):
    """
    Get all product sellers.
    """
    sellers = Seller.objects.all()
    serializer = SellerSerializer(sellers, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """
    Logout the current user
    """
    from django.contrib.auth import logout
    logout(request)
    return Response({
        'message': 'Logged out successfully'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """
    Check if the user is authenticated
    """
    if request.user.is_authenticated:
        serializer = UserSerializer(request.user)
        return Response({
            'authenticated': True,
            'user': serializer.data
        })
    return Response({
        'authenticated': False
    })
