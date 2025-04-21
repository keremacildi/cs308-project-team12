from django.contrib import admin
from django.urls import path
from app_backend import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),

    # Existing HTML Views
    path('products/', views.product_list, name='product_list'),
    path('products/<int:product_id>/', views.product_detail, name='product_detail'),
    path('products/<int:product_id>/rate/', views.submit_rating, name='submit_rating'),
    path('products/<int:product_id>/comment/', views.submit_comment, name='submit_comment'),
    path('cart/', views.view_cart, name='view_cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.order_history, name='order_history'),
    path('order/cancel/<int:order_id>/', views.cancel_order, name='cancel_order'),
    path('order/refund/<int:order_id>/', views.refund_order, name='refund_order'),
    path('profile/', views.profile, name='profile'),
    path('wishlist/', views.view_wishlist, name='view_wishlist'),
    path('wishlist/add/<int:product_id>/', views.add_to_wishlist, name='add_to_wishlist'),
    path('wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='remove_from_wishlist'),
    path('manager/orders/', views.manager_orders, name='manager_orders'),

    # JSON API Views
    path('api/products/', views.api_product_list, name='api_product_list'),
    path('api/products/<int:product_id>/', views.api_product_detail, name='api_product_detail'),
]
