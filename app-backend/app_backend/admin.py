from django.contrib import admin
from .models import (
    Distributor, Category, Product, ShoppingCartItem, Order,
    OrderItem, Rating, Comment, PaymentConfirmation, ProductReview,
    Delivery, CustomerProfile, Wishlist
)

admin.site.register(Distributor)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(ShoppingCartItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Rating)
admin.site.register(Comment)
admin.site.register(PaymentConfirmation)
admin.site.register(ProductReview)
admin.site.register(Delivery)
admin.site.register(CustomerProfile)
admin.site.register(Wishlist)
