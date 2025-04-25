from django.contrib import admin
from django.urls import path
from app_backend import views
from app_backend.views import ProductListAPIView, ProductDetailAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    # Product listing, details, search & sort
    path('products/', views.product_list, name='product_list'),
    path('products/<int:product_id>/', views.product_detail, name='product_detail'),
    path('products/<int:product_id>/rate/', views.submit_rating, name='submit_rating'),
    path('products/<int:product_id>/comment/', views.submit_comment, name='submit_comment'),
    # Cart: view, add, remove
    path('cart/', views.view_cart, name='view_cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    # Checkout and Order History
    path('checkout/', views.checkout, name='checkout'),
    path('orders/', views.order_history, name='order_history'),
    # Order cancellation and refund
    path('order/cancel/<int:order_id>/', views.cancel_order, name='cancel_order'),
    path('order/refund/<int:order_id>/', views.refund_order, name='refund_order'),
    # Customer profile
    path('profile/', views.profile, name='profile'),
    # Wishlist management
    path('wishlist/', views.view_wishlist, name='view_wishlist'),
    path('wishlist/add/<int:product_id>/', views.add_to_wishlist, name='add_to_wishlist'),
    path('wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='remove_from_wishlist'),
    # Manager dashboard
    path('manager/orders/', views.manager_orders, name='manager_orders'),
    # API endpoints
    path('api/products/', ProductListAPIView.as_view(), name='api_product_list'),
    path('api/products/<int:id>/', ProductDetailAPIView.as_view(), name='api_product_detail'),
    path('api/products/<int:product_id>/reviews/', views.get_product_reviews, name='api_product_reviews'),
    path('api/products/<int:product_id>/reviews/create/', views.submit_review, name='api_submit_review'),
    path('api/cart/', views.cart_view, name='api_cart'),
    path('api/cart/add/<int:product_id>/', views.add_to_cart, name='api_add_to_cart'),
    path('api/cart/remove/<int:item_id>/', views.remove_from_cart, name='api_remove_from_cart'),
    path('api/cart/update/<int:item_id>/', views.update_cart_item, name='api_update_cart_item'),
    path('api/orders/', views.create_order, name='api_create_order'),
    path('api/orders/history/', views.order_history, name='api_order_history'),
    path('api/orders/<int:order_id>/cancel/', views.cancel_order, name='api_cancel_order'),
    path('api/auth/login/', views.login_api, name='api_login'),
    path('api/auth/register/', views.register_api, name='api_register'),
    path('api/auth/forgot-password/', views.forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', views.reset_password, name='api_reset_password'),
    path('api/search/', views.search_products, name='api_search'),
    path('api/admin/dashboard/', views.admin_dashboard, name='api_admin_dashboard'),
    path('api/admin/orders/', views.admin_orders, name='api_admin_orders'),
    path('api/admin/products/', views.admin_products, name='api_admin_products'),
    path('api/admin/products/<int:product_id>/', views.admin_products, name='api_admin_product_detail'),
    path('api/wishlist/', views.wishlist_view, name='api_wishlist'),
    path('api/wishlist/add/<int:product_id>/', views.add_to_wishlist, name='api_add_to_wishlist'),
    path('api/wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='api_remove_from_wishlist'),
    # Category APIs
    path('api/categories/', views.category_list, name='api_category_list'),
    path('api/products/category/<int:category_id>/', views.products_by_category, name='api_products_by_category'),
    # Order APIs
    path('api/orders/<int:order_id>/', views.order_detail, name='api_order_detail'),
    path('api/orders/<int:order_id>/tracking/', views.order_tracking, name='api_order_tracking'),
    # Profile APIs
    path('api/profile/', views.profile, name='api_profile'),
    path('api/profile/addresses/', views.profile_addresses, name='api_profile_addresses'),
    # Admin Product APIs
    path('api/admin/products/create/', views.admin_create_product, name='api_admin_create_product'),
    path('api/admin/products/<int:product_id>/update/', views.admin_update_product, name='api_admin_update_product'),
    path('api/admin/products/<int:product_id>/delete/', views.admin_delete_product, name='api_admin_delete_product'),
    # Admin User Management
    path('api/admin/users/', views.admin_users, name='api_admin_users'),
]
