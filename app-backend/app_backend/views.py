from io import BytesIO
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage, send_mail
from django.core.files.base import ContentFile
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, FileResponse
from django.db.models import Q, Avg, Sum, Count
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.authentication import SessionAuthentication
from .permissions import IsStaff
from django.db import models, transaction
from django.views.decorators.csrf import csrf_exempt
from .models import (
    Product,  Order, OrderItem, Rating,
    Comment,    
    Category,   RefundRequest, SensitiveData
)
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .serializers import (
    OrderSerializer,  
    ProductSerializer,   
    CategorySerializer,   UserCreateSerializer,
    UserSerializer, UserUpdateSerializer,RatingSerializer,CommentSerializer,
    SensitiveDataSerializer, RefundRequestSerializer
)
from django.utils.crypto import get_random_string
from datetime import timedelta
import os
from decimal import Decimal
import smtplib
from dotenv import load_dotenv
from django.core.cache import cache
from django.core.exceptions import ValidationError
import logging
from .utils import (
    validate_email, validate_username, validate_password,
    validate_text_input, validate_numeric_input, validate_id
)
from rest_framework.parsers import JSONParser

load_dotenv()

logger = logging.getLogger(__name__)

# --- Home View ---
def home(request):
    return HttpResponse("Welcome to the backend API. Everything is running!")

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_products(request):
    """
    Get all products.
    """
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_detail(request, id):
    """
    Get details for a specific product by ID.
    """
    try:
        product = Product.objects.get(id=id)
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    """
    Get all product categories.
    """
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

# --- PDF Generation and Email Sending ---
def generate_invoice_pdf(order):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=(595, 842))  # A4 size
    
    # Add logo and header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 800, "CS308 Store")
    p.setFont("Helvetica", 10)
    p.drawString(50, 780, "Invoice")
    
    # Add invoice information
    p.setFont("Helvetica-Bold", 12)
    p.drawString(400, 800, f"Invoice #{order.id}")
    p.setFont("Helvetica", 10)
    p.drawString(400, 780, f"Date: {order.created_at.strftime('%Y-%m-%d')}")
    p.drawString(400, 765, f"Order Status: {order.get_status_display()}")
    
    # Add customer information
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 730, "Bill To:")
    p.setFont("Helvetica", 10)
    p.drawString(50, 715, f"{order.user.first_name} {order.user.last_name}")
    p.drawString(50, 700, f"Username: {order.user.username}")
    p.drawString(50, 685, f"Email: {order.user.email}")
    
    
    # Add table headers
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, 630, "Item")
    p.drawString(300, 630, "Quantity")
    p.drawString(370, 630, "Unit Price")
    p.drawString(450, 630, "Total")
    
    # Add horizontal line
    p.line(50, 620, 550, 620)
    
    # Add table data
    y = 600
    total = 0
    p.setFont("Helvetica", 10)
    
    for item in order.items.all():
        if y < 100:  # Start a new page if we run out of space
            p.showPage()
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, 800, "Item")
            p.drawString(300, 800, "Quantity")
            p.drawString(370, 800, "Unit Price")
            p.drawString(450, 800, "Total")
            p.line(50, 790, 550, 790)
            p.setFont("Helvetica", 10)
            y = 770
        
        item_total = item.price_at_purchase * item.quantity
        total += item_total
        
        p.drawString(50, y, item.product.title)
        p.drawString(300, y, str(item.quantity))
        p.drawString(370, y, f"${item.price_at_purchase:.2f}")
        p.drawString(450, y, f"${item_total:.2f}")
        
        y -= 20
    
    # Add totals
    p.line(50, y - 10, 550, y - 10)
    p.drawString(350, y - 30, "Subtotal:")
    p.drawString(450, y - 30, f"${total:.2f}")
    
    # Calculate tax (8%)
    tax = total * Decimal('0.08')
    p.drawString(350, y - 50, "Tax (8%):")
    p.drawString(450, y - 50, f"${tax:.2f}")
    
    # Shipping - simplified, using fixed amount
    shipping = Decimal('5.99')
    p.drawString(350, y - 70, "Shipping:")
    p.drawString(450, y - 70, f"${shipping:.2f}")
    
    # Final total
    p.line(350, y - 80, 550, y - 80)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(350, y - 100, "Total:")
    p.drawString(450, y - 100, f"${order.total_price:.2f}")
    
    # Add footer
    p.setFont("Helvetica", 8)
    p.drawString(50, 50, "Thank you for your purchase!")
    p.drawString(50, 35, "If you have any questions, please contact customer support.")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
import smtplib
from django.core.mail import EmailMessage

def send_invoice_email(pdf, order):
    pdf.seek(0)
    email = EmailMessage(
        subject=f"Invoice for Order #{order.id}",
        body="Please find your invoice attached.",
        from_email="postmaster@sandbox0769910aa82f4c699d5b1ff8211a21a1.mailgun.org",
        to=["batuhan.baykalhhh@gmail.com"],
    )
    email.attach(
        f"invoice_order_{order.id}.pdf",
        pdf.read(),
        "application/pdf"
    )

    # This gives you an email.message.Message instance
    std_msg = email.message()  

    with smtplib.SMTP("smtp.mailgun.org", 2525) as server:
        server.set_debuglevel(1)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(
            "postmaster@sandbox0769910aa82f4c699d5b1ff8211a21a1.mailgun.org",
            os.getenv("mailgun")
        )
        # Send the *standard* message, not the Django wrapper
        server.send_message(std_msg)

    print(f"Email sent successfully for order {order.id}")
    return True



    # Send email via ProtonMail SMTP

@api_view(['GET'])
@permission_classes([AllowAny])
def download_invoice(request, order_id):
    try:
        # Get user ID from request data
        user_id = request.data.get('user') or request.query_params.get('user')
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'User with ID {user_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Try to convert string order_id to integer if needed
        try:
            if isinstance(order_id, str):
                if order_id.startswith('ORD-'):
                    order_id = order_id.replace('ORD-', '')
                order_id = int(order_id)
        except (ValueError, TypeError):
            # If conversion fails, we'll proceed with the original order_id
            # and let the 404 handler take care of it
            pass
            
        # Get the order, ensuring it belongs to the requesting user
        order = get_object_or_404(Order, id=order_id, user=user)
        
        # Check if invoice already exists
        if order.invoice_pdf and order.invoice_pdf.name:
            # Return existing invoice if it exists
            response = HttpResponse(order.invoice_pdf.open(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_order_{order.id}.pdf"'
            return response
        
        # Generate new invoice
        buffer = generate_invoice_pdf(order)
        
        # Save invoice to model for future use
        order.invoice_pdf.save(f"invoice_order_{order.id}.pdf", ContentFile(buffer.read()))
        buffer.seek(0)  # Reset buffer position after reading
        
        # Return the PDF as a response
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_order_{order.id}.pdf"'
        return response
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Order Cancellation and Refund ---
@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_order(request, order_id):
    # Get user ID from request data
    user_id = request.data.get('user')
    if not user_id:
        return Response(
            {'error': 'User ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': f'User with ID {user_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    order = get_object_or_404(Order, pk=order_id, user=user)
    if order.status != 'processing':
        return Response(
            {'error': 'Order cannot be cancelled.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    order.status = 'cancelled'
    order.save()
    return Response({'message': 'Order cancelled successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def refund_order(request, order_id):
    # Get user ID from request data
    user_id = request.data.get('user')
    if not user_id:
        return Response(
            {'error': 'User ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': f'User with ID {user_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    order = get_object_or_404(Order, pk=order_id, user=user)
    if order.status != 'delivered':
        return Response(
            {'error': 'Order cannot be refunded.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
    return Response({'message': 'Order refunded successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
    """
    Create a new order with items.
    Expected format:
    {
        "user": user_id,
        "delivery_address": "address string",
        "order_items": [
            {
                "product": product_id,
                "quantity": quantity,
                "price_at_purchase": price
            },
            ...
        ],
        "total_price": total_price
    }
    """
    try:
        print("Received order creation request:", request.data)
        
        # Get user from request data
        user_id = request.data.get('user')
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'User with ID {user_id} not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get delivery address
        delivery_address = request.data.get('delivery_address', '')
        if not delivery_address:
            return Response(
                {'error': 'Delivery address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order items
        order_items = request.data.get('order_items', [])
        if not order_items or len(order_items) == 0:
            return Response(
                {'error': 'Order items are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get total price or calculate it
        total_price = request.data.get('total_price', 0)
        if not total_price:
            # Calculate total if not provided
            total_price = 0
            for item in order_items:
                price = float(item.get('price_at_purchase', 0))
                quantity = int(item.get('quantity', 0))
                total_price += price * quantity
        
        # Check stock availability for all items before creating the order
        for item in order_items:
            product_id = item.get('product')
            quantity = int(item.get('quantity', 0))
            
            try:
                product = Product.objects.get(id=product_id)
                if quantity > product.quantity_in_stock:
                    return Response(
                        {'error': f'Not enough stock for {product.title}. Available: {product.quantity_in_stock}, Requested: {quantity}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Product.DoesNotExist:
                return Response(
                    {'error': f'Product with ID {product_id} not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create the order
        order = Order.objects.create(
            user=user,
            total_price=total_price,
            status='processing'
        )
        
        print(f"Created order: {order.id}")
        
        # Create order items and reduce stock
        for item in order_items:
            product_id = item.get('product')
            quantity = int(item.get('quantity', 0))
            price_at_purchase = item.get('price_at_purchase')
            
            # Convert price string to Decimal if needed
            if isinstance(price_at_purchase, str):
                price_at_purchase = Decimal(price_at_purchase)
            
            product = Product.objects.get(id=product_id)
            
            # Create order item
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price_at_purchase=price_at_purchase
            )
            
            # Reduce product stock
            product.quantity_in_stock -= quantity
            product.save()
            
            print(f"Added item: {product.title} x{quantity} to order {order.id}")
            print(f"Updated stock for product {product.id} to {product.quantity_in_stock}")
        
        
        # Try to send invoice email
        try:
            pdf = generate_invoice_pdf(order)
            order.invoice_pdf.save(f'invoice_order_{order.id}.pdf', ContentFile(pdf.read()))
            # Save PDF to media folder
            media_path = os.path.join('media', 'invoices')
            os.makedirs(media_path, exist_ok=True)
            
            file_path = os.path.join(media_path, f'invoice_order_{order.id}.pdf')
            with open(file_path, 'wb') as f:
                f.write(pdf.read())
            send_invoice_email(pdf,order)
            print(f"Invoice email sent for order {order.id}")
        except Exception as email_error:
            print(f"Failed to send invoice email: {str(email_error)}")
        
        # Return order details
        return Response({
            'order': {
                'id': order.id,
                'total_price': float(order.total_price),
                'status': order.status,
                'created_at': order.created_at,
            },
            'message': 'Order created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Order creation error: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def order_history(request):
    try:
        # Get user ID from request data
        user_id = request.data.get('user') or request.query_params.get('user')
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'User with ID {user_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        orders = Order.objects.filter(user=user).prefetch_related(
            'items__product'
        ).order_by('-created_at')
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    """
    API endpoint for user login.
    """
    # Get credentials from request data
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Validate input data
    if not email or not password:
        return Response(
            {'error': 'Please provide both email and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate email format
    try:
        validate_email(email)
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Rate limiting check (prevent brute force attacks)
    client_ip = request.META.get('REMOTE_ADDR')
    cache_key = f"login_attempts:{client_ip}"
    login_attempts = cache.get(cache_key, 0)
    
    # If too many attempts, block temporarily
    if login_attempts >= 5:  # 5 attempts allowed
        return Response(
            {'error': 'Too many login attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Try to authenticate
    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        # Increment failed attempts
        cache.set(cache_key, login_attempts + 1, 300)  # 5 minutes timeout
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Authenticate with username and password
    user = authenticate(request, username=user_obj.username, password=password)
    if user is None:
        # Increment failed attempts
        cache.set(cache_key, login_attempts + 1, 300)  # 5 minutes timeout
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Reset login attempts on successful login
    cache.delete(cache_key)
    
    # Log the user in (creates a session)
    login(request, user)
    
    # Get a fresh CSRF token
    csrf_token = get_token(request)
    
    # Create response
    resp = Response({
        'message': 'Login successful',
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)
    
    # Set CSRF cookie with secure settings
    resp.set_cookie(
        'csrftoken',
        csrf_token,
        httponly=False,   # Allow JS to read for X-CSRFToken header
        samesite='Lax',
        secure=settings.CSRF_COOKIE_SECURE,  # True in production
        max_age=3600 * 24 * 7  # 7 days
    )
    
    # Set session cookie with secure settings
    resp.set_cookie(
        'sessionid',
        request.session.session_key,
        httponly=True,    # Prevent JavaScript access
        samesite='Lax',
        secure=settings.SESSION_COOKIE_SECURE,  # True in production
        max_age=3600 * 24 * 1  # 1 day
    )
    
    # Log successful login
    logger.info(f"User {user.username} logged in successfully from {client_ip}")
    
    return resp

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

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    """
    API endpoint for user registration.
    """
    # Rate limiting check
    client_ip = request.META.get('REMOTE_ADDR')
    cache_key = f"register_attempts:{client_ip}"
    register_attempts = cache.get(cache_key, 0)
    
    # If too many attempts, block temporarily
    if register_attempts >= 3:  # 3 attempts allowed
        return Response(
            {'error': 'Too many registration attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Validate input data using serializer
    serializer = UserCreateSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create the user
            user = serializer.save()
            
            # Reset registration attempts on success
            cache.delete(cache_key)
            
            # Create a UserSerializer instance to return the user data
            user_serializer = UserSerializer(user)
            
            # Log successful registration
            logger.info(f"New user {user.username} registered from {client_ip}")
            
            return Response({
                'message': 'User registered successfully',
                'user': user_serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Log the error
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            
            # Increment failed attempts
            cache.set(cache_key, register_attempts + 1, 300)  # 5 minutes timeout
            
            return Response(
                {'error': 'An error occurred during registration'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Increment failed attempts on validation error
    cache.set(cache_key, register_attempts + 1, 300)  # 5 minutes timeout
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def user_profile(request):
    """
    GET: Get the user's profile
    PUT: Update the user's profile
    """
    # Get user ID from request data
    user_id = request.data.get('user') or request.query_params.get('user')
    if not user_id:
        return Response(
            {'error': 'User ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': f'User with ID {user_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
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
@permission_classes([AllowAny])
def change_password(request):
    """
    Change the user's password
    Expects:
    {
        "user": user_id,
        "old_password": "string",
        "new_password": "string",
        "confirm_password": "string"
    }
    """
    # Get user ID from request data
    user_id = request.data.get('user')
    if not user_id:
        return Response(
            {'error': 'User ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': f'User with ID {user_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        
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

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_api(request):
    """
    Logout the current user
    Expects:
    {
        "user": user_id
    }
    """
    # Get user ID from request data
    user_id = request.data.get('user')
    if not user_id:
        return Response(
            {'error': 'User ID is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': f'User with ID {user_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # We don't actually need to do anything here since we're no longer using sessions
    return Response({
        'message': 'Logged out successfully'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    """
    Check if a user exists
    """
    # Get user ID from request data
    user_id = request.data.get('user') or request.query_params.get('user')
    if not user_id:
        return Response({
            'authenticated': False,
            'error': 'User ID is required'
        })
            
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response({
            'authenticated': True,
            'user': serializer.data
        })
    except User.DoesNotExist:
        return Response({
            'authenticated': False,
            'error': f'User with ID {user_id} not found'
        })


# Media files serving view
def serve_media_file(request, filename):
    """
    Custom view to serve media files directly
    """
    # Clean the filename to prevent directory traversal attacks
    clean_filename = os.path.basename(filename)
    
    # Build the full path to the file in the media directory
    file_path = os.path.join(settings.MEDIA_ROOT, 'products', clean_filename)
    
    # Check if the file exists
    if not os.path.exists(file_path):
        return HttpResponse("File not found", status=404)
    
    # Serve the file directly
    return FileResponse(open(file_path, 'rb'))

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ratings_api(request):
    """
    GET: Get all ratings
    POST: Create a new rating
    """
    if request.method == 'GET':
        # Get user ID from query parameters
        user_id = request.query_params.get('user')
        product_id = request.query_params.get('product')
        
        # Validate IDs if provided
        if user_id:
            try:
                user_id = validate_id(user_id, "User ID")
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        if product_id:
            try:
                product_id = validate_id(product_id, "Product ID")
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter ratings
        ratings = Rating.objects.all()
        if user_id:
            ratings = ratings.filter(user_id=user_id)
        if product_id:
            ratings = ratings.filter(product_id=product_id)
        
        # Serialize and return
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Get authenticated user
        user = request.user
        
        # Get product ID from request data
        product_id = request.data.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate product ID
        try:
            product_id = validate_id(product_id, "Product ID")
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has already rated this product
        if Rating.objects.filter(user=user, product=product).exists():
            # Update existing rating
            rating = Rating.objects.get(user=user, product=product)
            serializer = RatingSerializer(rating, data=request.data)
        else:
            # Create new rating
            serializer = RatingSerializer(data=request.data)
        
        # Validate and save
        if serializer.is_valid():
            # Set user if not provided
            if 'user' not in serializer.validated_data:
                serializer.validated_data['user'] = user
            
            # Save the rating
            serializer.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def comments_api(request):
    """
    GET: Get all comments
    POST: Create a new comment
    """
    if request.method == 'GET':
        # Get query parameters
        user_id = request.query_params.get('user')
        product_id = request.query_params.get('product')
        approved = request.query_params.get('approved')
        
        # Validate IDs if provided
        if user_id:
            try:
                user_id = validate_id(user_id, "User ID")
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        if product_id:
            try:
                product_id = validate_id(product_id, "Product ID")
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filter comments
        comments = Comment.objects.all()
        if user_id:
            comments = comments.filter(user_id=user_id)
        if product_id:
            comments = comments.filter(product_id=product_id)
        
        # Filter by approval status
        if approved is not None:
            approved_bool = approved.lower() == 'true'
            comments = comments.filter(approved=approved_bool)
        
        # Serialize and return
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Get authenticated user
        user = request.user
        
        # Get product ID from request data
        product_id = request.data.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate product ID
        try:
            product_id = validate_id(product_id, "Product ID")
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get product
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate comment text
        text = request.data.get('text')
        try:
            validate_text_input(text, field_name="Comment text", min_length=3, max_length=1000)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer with data
        serializer = CommentSerializer(data=request.data)
        
        # Validate and save
        if serializer.is_valid():
            # Set user if not provided
            if 'user' not in serializer.validated_data:
                serializer.validated_data['user'] = user
            
            # Save the comment (initially not approved)
            comment = serializer.save(approved=False)
            
            return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_comments(request, product_id):
    """
    Get all approved comments for a specific product.
    """
    try:
        # Get only approved comments for the specified product
        comments = Comment.objects.filter(
            product_id=product_id,
            approved=True
        ).order_by('-created_at')
        
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_report(request):
    """
    Returns total revenue, total cost, and profit/loss for all delivered orders.
    Accessible only by admin/staff users.
    """
    from decimal import Decimal
    from django.db.models import Sum, F
    
    # Only consider delivered orders
    delivered_orders = Order.objects.filter(status='delivered')
    
    # Calculate total revenue (sum of total_price for delivered orders)
    total_revenue = delivered_orders.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')
    
    # Calculate total cost (sum of cost * quantity for all items in delivered orders)
    total_cost = Decimal('0.00')
    for order in delivered_orders:
        for item in order.items.all():
            # Use product cost at the time of calculation (no historical cost tracking)
            cost = item.product.cost or Decimal('0.00')
            total_cost += cost * item.quantity
    
    # Profit = Revenue - Cost
    profit = total_revenue - total_cost
    
    return Response({
        'total_revenue': float(total_revenue),
        'total_cost': float(total_cost),
        'profit': float(profit)
    })

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def edit_delete_comment(request, comment_id):
    """
    PUT: Edit a pending comment (only by the owner, only if not approved)
    DELETE: Delete a pending comment (only by the owner, only if not approved)
    """
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only the owner can edit/delete
    if comment.user != request.user:
        return Response({'error': 'You do not have permission to modify this comment.'}, status=status.HTTP_403_FORBIDDEN)

    # Only if not approved
    if comment.approved:
        return Response({'error': 'Approved comments cannot be edited or deleted.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PUT':
        new_text = request.data.get('text')
        if not new_text:
            return Response({'error': 'Text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        comment.text = new_text
        comment.save()
        from .serializers import CommentSerializer
        return Response({'message': 'Comment updated successfully.', 'comment': CommentSerializer(comment).data})

    elif request.method == 'DELETE':
        comment.delete()
        return Response({'message': 'Comment deleted successfully.'})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def sensitive_data_api(request):
    """
    GET: Get the user's sensitive data
    PUT: Update the user's sensitive data
    """
    # Get authenticated user
    user = request.user
    
    try:
        # Get or create sensitive data for the user
        sensitive_data, created = SensitiveData.objects.get_or_create(user=user)
        
        if request.method == 'GET':
            serializer = SensitiveDataSerializer(sensitive_data)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = SensitiveDataSerializer(sensitive_data, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error processing sensitive data: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An error occurred while processing sensitive data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def change_order_status(request, order_id):
    """
    Allows staff (product managers) to change the delivery status of an order.
    Expects JSON: { "status": "in_transit" | "delivered" | "processing" }
    Triggers workflows (e.g., email) on delivery.
    """
    from django.core.mail import send_mail
    from django.conf import settings
    import logging

    logger = logging.getLogger(__name__)

    # Validate status
    valid_statuses = ['processing', 'in_transit', 'delivered']
    status_value = request.data.get('status')
    if status_value not in valid_statuses:
        return Response({
            'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get order
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    old_status = order.status
    order.status = status_value
    order.save()

    # Log the status change
    logger.info(f"Order {order.id} status changed from {old_status} to {status_value} by {request.user.username}")

    # Trigger workflow: send email if delivered
    if status_value == 'delivered':
        try:
            send_mail(
                'Your Order Has Been Delivered',
                f'Your order #{order.id} has been marked as delivered. Thank you for shopping with us!',
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
                [order.user.email],
                fail_silently=True,
            )
            logger.info(f"Delivery confirmation email sent for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send delivery email for order {order.id}: {str(e)}")

    # Return updated order info
    from .serializers import OrderSerializer
    serializer = OrderSerializer(order)
    return Response({
        'message': f"Order status updated to {status_value}",
        'order': serializer.data
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_products(request):
    """List all products (admin only, with optional search/filter)."""
    products = Product.objects.all()
    # Optional: add filtering by query params (e.g., ?q=search)
    q = request.query_params.get('q')
    if q:
        products = products.filter(title__icontains=q)
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_product(request):
    """Create a new product (admin only)."""
    serializer = ProductSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_product_detail(request, product_id):
    """Retrieve, update, or delete a product (admin only)."""
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product deleted successfully.'})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_orders(request):
    """List all orders (admin only, with optional filters: status, user, date)."""
    orders = Order.objects.all().select_related('user').prefetch_related('items__product')
    status_param = request.query_params.get('status')
    user_param = request.query_params.get('user')
    date_param = request.query_params.get('date')
    if status_param:
        orders = orders.filter(status=status_param)
    if user_param:
        orders = orders.filter(user__id=user_param)
    if date_param:
        orders = orders.filter(created_at__date=date_param)
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request):
    """
    Customer requests a refund for a specific product in a delivered order (within 30 days).
    Expects: {"order_item": <order_item_id>, "reason": "..."}
    """
    user = request.user
    order_item_id = request.data.get('order_item')
    reason = request.data.get('reason', '')
    if not order_item_id:
        return Response({'error': 'Order item ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        order_item = OrderItem.objects.get(id=order_item_id)
    except OrderItem.DoesNotExist:
        return Response({'error': 'Order item not found.'}, status=status.HTTP_404_NOT_FOUND)
    # Check if already refunded
    if RefundRequest.objects.filter(order_item=order_item, user=user, status='approved').exists():
        return Response({'error': 'Refund already approved for this item.'}, status=status.HTTP_400_BAD_REQUEST)
    # Validate via serializer
    serializer = RefundRequestSerializer(data={
        'order_item': order_item.id,
        'user': user.id,
        'reason': reason
    })
    serializer.is_valid(raise_exception=True)
    refund_request = serializer.save()
    return Response(RefundRequestSerializer(refund_request).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_refund_requests(request):
    """List all refund requests (staff only, with optional status filter)."""
    status_param = request.query_params.get('status')
    qs = RefundRequest.objects.all().select_related('order_item', 'user', 'approved_by')
    if status_param:
        qs = qs.filter(status=status_param)
    serializer = RefundRequestSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def process_refund_request(request, refund_request_id):
    """
    Approve or reject a refund request (staff only).
    Expects: {"action": "approve"|"reject"}
    """
    try:
        refund_request = RefundRequest.objects.select_related('order_item', 'user').get(id=refund_request_id)
    except RefundRequest.DoesNotExist:
        return Response({'error': 'Refund request not found.'}, status=status.HTTP_404_NOT_FOUND)
    if refund_request.status != 'pending':
        return Response({'error': 'Refund request already processed.'}, status=status.HTTP_400_BAD_REQUEST)
    action = request.data.get('action')
    if action not in ['approve', 'reject']:
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
    refund_request.decision_date = timezone.now()
    refund_request.approved_by = request.user
    if action == 'approve':
        # Calculate refund amount (discounted price if available)
        item = refund_request.order_item
        refund_price = item.discounted_price if item.discounted_price else item.price_at_purchase
        refund_request.refund_amount = refund_price * item.quantity
        refund_request.status = 'approved'
        # Restock product
        item.product.quantity_in_stock += item.quantity
        item.product.save()
        # Notify customer
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            'Refund Approved',
            f'Your refund for {item.product.title} (Order #{item.order.id}) has been approved. Refunded Amount: ${refund_request.refund_amount:.2f}.',
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
            [refund_request.user.email],
            fail_silently=True,
        )
    else:
        refund_request.status = 'rejected'
    refund_request.save()
    return Response(RefundRequestSerializer(refund_request).data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_delivery_list(request):
    """
    Returns a flat delivery list for all order items, with delivery status and details.
    """
    from collections import OrderedDict
    delivery_items = []
    order_items = OrderItem.objects.select_related('order', 'product', 'order__user')
    for item in order_items:
        order = item.order
        delivery_items.append(OrderedDict([
            ('delivery_id', item.id),
            ('order_id', order.id),
            ('customer_id', order.user.id),
            ('product_id', item.product.id),
            ('quantity', item.quantity),
            ('total_price', float(item.price_at_purchase) * item.quantity),
            ('delivery_address', getattr(order, 'delivery_address', None)),
            ('delivery_completed', order.status == 'delivered'),
        ]))
    return Response(delivery_items)