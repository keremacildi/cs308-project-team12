from django.contrib import admin
from django.urls import path
from app_backend import views
from app_backend.views import ProductListAPIView, ProductDetailAPIView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    
    # API endpoints
    # Products
    path('api/products/', ProductListAPIView.as_view(), name='api_product_list'),
    path('api/products/all/', views.get_all_products, name='api_get_all_products'),
    path('api/products/<int:id>/', ProductDetailAPIView.as_view(), name='api_product_detail'),
    path('api/products/<int:product_id>/reviews/', views.get_product_reviews, name='api_product_reviews'),
    path('api/products/<int:product_id>/reviews/create/', views.submit_review, name='api_submit_review'),
    path('api/products/category/<int:category_id>/', views.get_products_by_category, name='api_products_by_category'),
    
    # Filters
    path('api/categories/', views.get_categories, name='api_categories'),
    path('api/brands/', views.get_brands, name='api_brands'),
    path('api/sellers/', views.get_sellers, name='api_sellers'),
    
    # Cart
    path('api/cart/', views.cart_view, name='api_cart'),
    path('api/cart/add/<int:product_id>/', views.add_to_cart, name='api_add_to_cart'),
    path('api/cart/remove/<int:item_id>/', views.remove_from_cart, name='api_remove_from_cart'),
    path('api/cart/update/<int:item_id>/', views.update_cart_item, name='api_update_cart_item'),
    
    # Orders
    path('api/orders/', views.create_order, name='api_create_order'),
    path('api/orders/history/', views.order_history, name='api_order_history'),
    path('api/orders/<int:order_id>/cancel/', views.cancel_order, name='api_cancel_order'),
    path('api/orders/<int:order_id>/refund/', views.refund_order, name='api_refund_order'),
    
    # Auth
    path('api/auth/login/', views.login_api, name='api_login'),
    path('api/auth/logout/', views.logout_api, name='api_logout'),
    path('api/auth/register/', views.register_api, name='api_register'),
    path('api/auth/forgot-password/', views.forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', views.reset_password, name='api_reset_password'),
    path('api/auth/profile/', views.user_profile, name='api_user_profile'),
    path('api/auth/change-password/', views.change_password, name='api_change_password'),
    path('api/auth/check/', views.check_auth, name='api_check_auth'),
    
    # Search
    path('api/search/', views.search_products, name='api_search'),
    
    # Admin
    path('api/admin/dashboard/', views.admin_dashboard, name='api_admin_dashboard'),
    path('api/admin/orders/', views.admin_orders, name='api_admin_orders'),
    path('api/admin/products/', views.admin_products, name='api_admin_products'),
    path('api/admin/products/<int:product_id>/', views.admin_products, name='api_admin_product_detail'),
    path('api/admin/categories/', views.admin_categories, name='api_admin_categories'),
    path('api/admin/categories/<int:category_id>/', views.admin_categories, name='api_admin_category_detail'),
    
    # Wishlist
    path('api/wishlist/', views.wishlist_view, name='api_wishlist'),
    path('api/wishlist/add/<int:product_id>/', views.add_to_wishlist, name='api_add_to_wishlist'),
    path('api/wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='api_remove_from_wishlist'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
