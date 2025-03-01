from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# -------------------------
# SPRINT 1 Models (Unchanged)
# -------------------------
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


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


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
        blank=True,
        null=True,
        help_text="Defaults to 50% of sale price unless specified."
    )
    warranty_status = models.CharField(max_length=100, blank=True, null=True)
    distributor_info = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.cost is None:
            self.cost = self.price * 0.5  # Default cost to 50% of price if not set
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.model or ''}"

# -------------------------
# SPRINT 2 Models (New!)
# -------------------------

class Cart(models.Model):
    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart of {self.customer.username}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"CartItem: {self.product.name} (x{self.quantity})"


class Order(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    delivery_address = models.TextField(blank=True, null=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Order #{self.id} by {self.customer.username}"

    @property
    def is_cancelable(self):
        return self.status == 'processing'

    @property
    def is_refundable(self):
        return self.status == 'delivered'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ordered_items')
    quantity = models.PositiveIntegerField(default=1)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"OrderItem: {self.product.name} (x{self.quantity}) - Order #{self.order.id}"


# -------------------------
# NEW: Product Review Model
# -------------------------

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')  # Ensure a user can review a product only once

    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name} - {self.rating} Stars"
