from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# 1) Custom User Model
class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('product_manager', 'Product Manager'),
        ('sales_manager', 'Sales Manager'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    home_address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

# 2) Category Model
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

# 3) Product Model
class Product(models.Model):
    name = models.CharField(max_length=200)
    model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Used for profit/loss calculations if needed."
    )
    warranty_status = models.CharField(max_length=100, blank=True, null=True)
    distributor_info = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    is_active = models.BooleanField(default=False, help_text="Visible once approved by a Sales Manager.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.model or ''}"
    
from django.utils.translation import gettext_lazy as _

# 4) Shopping Cart Model
class ShoppingCart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, null=True)  # For guest users
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart ({self.user.username if self.user else 'Guest'})"

class CartItem(models.Model):
    cart = models.ForeignKey(ShoppingCart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def subtotal(self):
        return self.quantity * self.product.price

# 5) Order Model
class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PROCESSING = "processing", _("Processing")
        IN_TRANSIT = "in_transit", _("In Transit")
        DELIVERED = "delivered", _("Delivered")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PROCESSING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.user.username} ({self.status})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

