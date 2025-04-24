from io import BytesIO
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage, send_mail
from django.core.files.base import ContentFile
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.db.models import Q, Avg
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import (
    Product, ShoppingCartItem, Order, OrderItem, Rating,
    Comment, PaymentConfirmation, Delivery, Wishlist, ProductReview
)
from django.contrib.auth.models import User
from .serializers import OrderSerializer, ProductReviewSerializer

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
    avg_rating = Rating.objects.filter(product=product).aggregate(Avg('score'))['score__avg']
    # Only approved comments are shown (managerial approval required)
    comments = Comment.objects.filter(product=product, approved=True)
    return render(request, 'store/product_detail.html', {
        'product': product,
        'avg_rating': avg_rating or 0,
        'comments': comments
    })

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
        # Get cart items for the user
        cart_items = ShoppingCartItem.objects.filter(user=request.user)
        
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check stock availability and calculate total price
        total_price = 0
        order_items = []
        
        for cart_item in cart_items:
            if cart_item.quantity > cart_item.product.quantity_in_stock:
                return Response(
                    {'error': f'Not enough stock for {cart_item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            total_price += cart_item.product.price * cart_item.quantity
            order_items.append({
                'product': cart_item.product,
                'quantity': cart_item.quantity,
                'price_at_purchase': cart_item.product.price
            })
        
        # Create the order
        order = Order.objects.create(
            user=request.user,
            total_price=total_price,
            status='processing'
        )
        
        # Create order items and reduce stock
        for item in order_items:
            OrderItem.objects.create(
                order=order,
                product=item['product'],
                quantity=item['quantity'],
                price_at_purchase=item['price_at_purchase']
            )
            # Reduce stock
            item['product'].quantity_in_stock -= item['quantity']
            item['product'].save()
        
        # Create delivery record
        Delivery.objects.create(
            order=order,
            delivery_address=request.data.get('delivery_address', ''),
            status='processing'
        )
        
        # Clear the cart
        cart_items.delete()
        
        return Response({
            'message': 'Order created successfully',
            'order_id': order.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        product = Product.objects.get(id=product_id)
        reviews = ProductReview.objects.filter(
            product=product,
            is_approved=True  # Only show approved reviews
        ).select_related('user')
        
        # Calculate average rating
        average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        
        serializer = ProductReviewSerializer(reviews, many=True)
        
        return Response({
            'average_rating': round(average_rating, 1),
            'total_reviews': reviews.count(),
            'reviews': serializer.data
        })
        
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
