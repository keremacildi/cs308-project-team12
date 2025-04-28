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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from .permissions import IsStaff
from django.db import models
import smtplib

from .models import (
    Product,  Order, OrderItem, Rating,
    Comment,    
    Category,   )
from django.contrib.auth.models import User
from .serializers import (
    OrderSerializer,  
    ProductSerializer,   
    CategorySerializer,   UserCreateSerializer,
    UserSerializer, UserUpdateSerializer
)
from django.utils.crypto import get_random_string
from datetime import timedelta
import os
from decimal import Decimal

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
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_product_detail(request, id):
    """
    Get details for a specific product by ID.
    """
    try:
        product = Product.objects.get(id=id)
        serializer = ProductSerializer(product)
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
    
    # Add delivery address if available
    delivery = Delivery.objects.filter(order=order).first()
    if delivery and delivery.delivery_address:
        p.setFont("Helvetica-Bold", 12)
        p.drawString(300, 730, "Ship To:")
        p.setFont("Helvetica", 10)
        p.drawString(300, 715, f"{delivery.delivery_address}")
    
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

def send_invoice_email(order):
    pdf = generate_invoice_pdf(order)
    
    # Configure SMTP settings for ProtonMail
    smtp_server = "smtp.proton.me"
    smtp_port = 587
    smtp_username = "cs308demo@proton.me"  # Replace with actual email
    smtp_password = "123456789"  # Replace with actual password
    
    # Create and configure email message
    email = EmailMessage(
        f"Invoice for Order #{order.id}",
        "Please find your invoice attached.",
        from_email=smtp_username,
        to=[order.user.email]
    )
    email.attach(f"invoice_order_{order.id}.pdf", pdf.read(), "application/pdf")
    
    # Send email via ProtonMail SMTP
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(email)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_invoice(request, order_id):
    try:
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
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
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
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    order = get_object_or_404(Order, pk=order_id, user=request.user)
    if order.status != 'processing':
        return Response(
            {'error': 'Order cannot be cancelled.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    order.status = 'cancelled'
    order.save()
    return Response({'message': 'Order cancelled successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_order(request, order_id):
    order = get_object_or_404(Order, pk=order_id, user=request.user)
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
                            {'error': f'Not enough stock for {product.title}'},
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
                        {'error': f'Not enough stock for {cart_item.product.title}'},
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

        # Clear the cart if this was a cart-based order
        if 'order_items' not in request.data:
            cart_items.delete()
        send_invoice_email(order)
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
    print(request.data)
    if serializer.is_valid():
        user = serializer.save()
        print(serializer.data)
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

