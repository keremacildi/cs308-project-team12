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
from django.views.decorators.csrf import csrf_exempt
from .models import (
    Product,  Order, OrderItem, Rating,
    Comment,    
    Category,   )
from django.contrib.auth.models import User
from .serializers import (
    OrderSerializer,  
    ProductSerializer,   
    CategorySerializer,   UserCreateSerializer,
    UserSerializer, UserUpdateSerializer,RatingSerializer,CommentSerializer
)
from django.utils.crypto import get_random_string
from datetime import timedelta
import os
from decimal import Decimal
import smtplib
from dotenv import load_dotenv

load_dotenv()

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

from django.contrib.auth import authenticate, login
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([SessionAuthentication])
def login_api(request):
    # 1. grab credentials
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response(
            {'error': 'Please provide both email and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        user_obj = User.objects.get(email=email)
    except User.DoesNotExist:
        user = None
    else:
        user = authenticate(request, username=user_obj.username, password=password)
    # 2. authenticate
    if user is None:
        return Response(
            {'error': 'Invalid credentials xd'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # 3. log them in (creates a session)
    login(request, user)

    # 4. issue a fresh CSRF token
    csrf_token = get_token(request)

    # 5. build your DRF Response
    resp = Response({
        'message': 'Login successful',
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)

    # 6. send the CSRF token so your JS can read it
    resp.set_cookie(
        'csrftoken',
        csrf_token,
        httponly=False,   # allow JS → X-CSRFToken header
        samesite='Lax',
        secure=False      # switch to True under HTTPS
    )

    # 7. explicitly send the sessionid cookie
    resp.set_cookie(
        'sessionid',
        request.session.session_key,
        httponly=True,    # keep this secure
        samesite='Lax',
        secure=False
    )

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
@permission_classes([AllowAny])
def ratings_api(request):
    """
    GET: Fetch ratings with optional filtering by product_id and user_id
    POST: Create a new rating
    """
    if request.method == 'GET':
        # Get filter parameters
        product_id = request.query_params.get('product')
        user_id = request.query_params.get('user')
        
        # Apply filters if provided
        ratings = Rating.objects.all()
        if product_id:
            ratings = ratings.filter(product_id=product_id)
        if user_id:
            ratings = ratings.filter(user_id=user_id)
            
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # This is the existing create_rating functionality
        try:
            print(request.data)
            product_id = request.data.get('product_id')
            user_id = request.data.get('user_id')
            rating_value = request.data.get('rating')
            
            if not product_id or not user_id or not rating_value:
                return Response(
                    {'error': 'Product ID, user ID, and rating are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Validate rating value
            try:
                rating_value = int(rating_value)
                if rating_value < 1 or rating_value > 5:
                    return Response(
                        {'error': 'Rating must be between 1 and 5'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Rating must be a number'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Get product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if user has already rated this product
            existing_rating = Rating.objects.filter(
                user=user,
                product=product
            ).first()
            
            if existing_rating:
                # Update existing rating
                existing_rating.score = rating_value
                existing_rating.save()
                message = 'Rating updated successfully'
            else:
                # Create new rating
                Rating.objects.create(
                    user=user,
                    product=product,
                    score=rating_value
                )
                message = 'Rating created successfully'
            
            
            return Response({
                'message': message,
                'product_id': product.id,
                'user_id': user.id,
                'rating': rating_value,
                'avg_rating': product.avg_rating
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def comments_api(request):
    """
    GET: Fetch comments with optional filtering by product_id and user_id
    POST: Create a new comment
    """
    if request.method == 'GET':
        # Get filter parameters
        product_id = request.query_params.get('product')
        user_id = request.query_params.get('user')
        
        # Apply filters if provided
        comments = Comment.objects.all()
        if product_id:
            comments = comments.filter(product_id=product_id)
        if user_id:
            comments = comments.filter(user_id=user_id)
            
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # This is the existing create_comment functionality
        try:
            print(request.data)
            product_id = request.data.get('product_id')
            user_id = request.data.get('user_id')
            comment_text = request.data.get('comment_text')
            
            if not product_id or not comment_text:
                return Response(
                    {'error': 'Product ID and comment text are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # If user_id is provided, get user name from user
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    user_name = f"{user.first_name} {user.last_name}".strip()
                    if not user_name:
                        user_name = user.username
                except User.DoesNotExist:
                    return Response(
                        {'error': 'User not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif not user_name:
                return Response(
                    {'error': 'Either user_id or user_name must be provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Get product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Check if user has already commented on this product
            existing_comment = Comment.objects.filter(
                user=user,
                product=product
            ).first()
            
            if existing_comment:
                # Update existing comment
                existing_comment.text = comment_text
                existing_comment.save()
                message = 'Comment updated successfully'
                comment = existing_comment
            else:
                # Create comment
                comment = Comment.objects.create(
                    product=product,
                    user=user,
                    text=comment_text
                )
                message = 'Comment added successfully'
            
            # Return the created/updated comment
            return Response({
                'message': message,
                'comment': {
                    'id': comment.id,
                    'product_id': product.id,
                    'user_name': comment.user.username,
                    'comment_text': comment.text,
                    'created_at': comment.created_at
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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