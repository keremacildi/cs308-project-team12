from django.contrib import admin
from django.urls import path
from app_backend import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),  # New home view for the root URL
    # Product listing, details, search & sort
    path('products/', views.product_list, name='product_list'),
    path('products/<int:product_id>/', views.product_detail, name='product_detail'),
    
    # Post-delivery: Rating & Comment
    path('products/<int:product_id>/rate/', views.submit_rating, name='submit_rating'),
    path('products/<int:product_id>/comment/', views.submit_comment, name='submit_comment'),
    
    # Cart: view, add, and remove items
    path('cart/', views.view_cart, name='view_cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    
    # Checkout and Order History (including delivery processing and invoice generation)
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.order_history, name='order_history'),
]
