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

# Uncomment these if using Django REST Framework endpoints
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response

from .models import (
    Product, ShoppingCartItem, Order, OrderItem, Rating,
    Comment, PaymentConfirmation, Delivery
)
from django.contrib.auth.models import User

# --- Added Home View for Root URL ---
def home(request):
    return HttpResponse("Welcome to the backend API. Everything is running!")

def get_cart_items(request):
    """
    Returns ShoppingCartItems for the current user or session.
    """
    if request.user.is_authenticated:
        return ShoppingCartItem.objects.filter(user=request.user)
    else:
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key
        return ShoppingCartItem.objects.filter(session_key=session_key)

def product_list(request):
    """
    Displays a list of products with optional search and sort functionality.
    """
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

def product_detail(request, product_id):
    """
    Displays the details of a single product along with its ratings and approved comments.
    """
    product = get_object_or_404(Product, pk=product_id)
    avg_rating = Rating.objects.filter(product=product).aggregate(Avg('score'))['score__avg']
    comments = Comment.objects.filter(product=product, approved=True)
    return render(request, 'store/product_detail.html', {
        'product': product,
        'avg_rating': avg_rating or 0,
        'comments': comments
    })

def add_to_cart(request, product_id):
    """
    Adds a product to the shopping cart, for authenticated or anonymous users.
    """
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
    """
    Removes an item from the shopping cart.
    """
    item = get_object_or_404(ShoppingCartItem, id=item_id)
    item.delete()
    return redirect('view_cart')

def view_cart(request):
    """
    Displays the current shopping cart contents and calculates the total price.
    """
    items = get_cart_items(request)
    total = sum(item.product.price * item.quantity for item in items)
    return render(request, 'store/cart.html', {'cart_items': items, 'total': total})

@login_required
def checkout(request):
    """
    Handles checkout:
    - Decreases stock for purchased items.
    - Creates an Order (and OrderItems).
    - Forwards order processing by creating a Delivery record.
    - Clears the shopping cart.
    - Mocks payment confirmation.
    - Generates a PDF invoice and emails it to the user.
    """
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

    # Create the order and order items
    order = Order.objects.create(user=request.user, total_price=total_price)
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )

    # Create Delivery record with initial status 'processing'
    Delivery.objects.create(order=order, status='processing')

    # Clear the shopping cart
    cart_items.delete()

    # Confirm payment (mock)
    PaymentConfirmation.objects.create(order=order, confirmed=True, confirmed_at=timezone.now())

    # Generate invoice PDF and email it
    pdf_buffer = generate_invoice_pdf(order)
    order.invoice_pdf.save(
        f'invoice_order_{order.pk}.pdf',
        ContentFile(pdf_buffer.getvalue())
    )
    send_invoice_email(order)

    return render(request, 'store/checkout_success.html', {'order': order})

@login_required
def order_history(request):
    """
    Displays a list of orders for the logged-in user.
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'store/order_history.html', {'orders': orders})

@login_required
def submit_rating(request, product_id):
    """
    Allows a user to submit a rating (1-5) if they have a delivered order for the product.
    """
    product = get_object_or_404(Product, id=product_id)
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
    """
    Allows a user to submit a comment on a delivered product.
    The comment is created as unapproved.
    """
    product = get_object_or_404(Product, id=product_id)
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

    Comment.objects.create(user=request.user, product=product, text=text)
    return redirect('product_detail', product_id=product_id)

def generate_invoice_pdf(order):
    """
    Generates a PDF invoice for the given order using ReportLab.
    """
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
    """
    Sends an email with the generated PDF invoice attached.
    """
    pdf = generate_invoice_pdf(order)
    email = EmailMessage(
        f"Invoice for Order #{order.id}",
        "Please find your invoice attached.",
        to=[order.user.email]
    )
    email.attach(f"invoice_order_{order.id}.pdf", pdf.read(), "application/pdf")
    email.send()

@receiver(user_logged_in)
def merge_cart(sender, request, user, **kwargs):
    """
    Merges shopping cart items stored in the session with those saved to the logged-in user's cart.
    """
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
