from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Product(models.Model):
    """
    Represents a product available for purchase.
    """
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class Order(models.Model):
    """
    Represents an order placed by a user.
    Supports various statuses to handle order life cycle:
      - Pending
      - Delivered
      - Cancelled
      - Returned
    """
    ORDER_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Returned', 'Returned'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders')
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='Pending')
    order_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.product.name} for {self.user.username}"

    class Meta:
        ordering = ['-order_date']


class Rating(models.Model):
    """
    Represents a product rating submitted by a user.
    
    Tasks Implemented:
      - Task 1: Product must be delivered before rating.
      - Task 2: Rating score must be between 1 and 10 points (covers 1–5 as a subset).
      - Task 4: Ratings are submitted directly without manager approval.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    score = models.PositiveIntegerField()

    def clean(self):
        # Validate that the rating score is within the allowed range.
        if not (1 <= self.score <= 10):
            raise ValidationError("Rating must be between 1 and 10 points.")
        # Ensure the user has a delivered order for this product.
        if not Order.objects.filter(user=self.user, product=self.product, status='Delivered').exists():
            raise ValidationError("You can only rate a product after it has been delivered.")

    def save(self, *args, **kwargs):
        self.clean()  # Run validations before saving.
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rating {self.score} by {self.user.username} for {self.product.name}"

    class Meta:
        unique_together = ('user', 'product')


class Comment(models.Model):
    """
    Represents a comment on a product.
    
    Tasks Implemented:
      - Task 1: Product must be delivered before commenting.
      - Task 3: Comments require product manager approval (via is_approved flag).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    is_approved = models.BooleanField(default=False)  # Requires manager approval.
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Ensure the product has been delivered before allowing a comment.
        if not Order.objects.filter(user=self.user, product=self.product, status='Delivered').exists():
            raise ValidationError("You can only comment on a product after it has been delivered.")

    def save(self, *args, **kwargs):
        self.clean()  # Run validations before saving.
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.product.name}"

    class Meta:
        ordering = ['-created_at']


class Wishlist(models.Model):
    """
    Represents a user's wishlist containing products they wish to save.
    
    Task 6: Supports the ability for customers to include products in their wishlists.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, related_name='wishlisted_by')

    def __str__(self):
        return f"Wishlist for {self.user.username}"
