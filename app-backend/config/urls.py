from django.contrib import admin
from django.urls import path
from app_backend import views
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    
    # API endpoints
    # Products
    path('api/products/all/', views.get_all_products, name='api_get_all_products'),
    path('api/products/<int:id>/', views.get_product_detail, name='api_product_detail'),
    path('api/products/<int:product_id>/comments/', views.get_product_comments, name='api_product_comments'),

    # Filters
    path('api/categories/', views.get_categories, name='api_categories'),

    
    # Orders
    path('api/orders/', views.create_order, name='api_create_order'),
    path('api/orders/history/', views.order_history, name='api_order_history'),
    path('api/orders/<int:order_id>/cancel/', views.cancel_order, name='api_cancel_order'),
    path('api/orders/<int:order_id>/refund/', views.refund_order, name='api_refund_order'),
    path('api/orders/<int:order_id>/invoice/', views.download_invoice, name='api_download_invoice'),
    path('api/orders/<int:order_id>/change_status/', views.change_order_status, name='api_change_order_status'),
    
    # Auth
    path('api/auth/login/', csrf_exempt(views.login_api), name='api_login'),
    path('api/auth/logout/', csrf_exempt(views.logout_api), name='api_logout'),
    path('api/auth/register/', csrf_exempt(views.register_api), name='api_register'),
    path('api/auth/forgot-password/', views.forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', views.reset_password, name='api_reset_password'),
    path('api/auth/profile/', views.user_profile, name='api_user_profile'),
    path('api/auth/change-password/', views.change_password, name='api_change_password'),
    path('api/auth/check/', views.check_auth, name='api_check_auth'),
    path('api/auth/sensitive-data/', views.sensitive_data_api, name='api_sensitive_data'),

    # Ratings & Comments - combined view functions that handle different HTTP methods
    path('api/ratings/', views.ratings_api, name='api_ratings'),
    path('api/comments/', views.comments_api, name='api_comments'),
    path('api/comments/<int:comment_id>/', views.edit_delete_comment, name='api_edit_delete_comment'),

    # Revenue/Profit report
    path('api/revenue/', views.revenue_report, name='api_revenue_report'),

    # Product manager (admin) product management
    path('api/admin/products/', views.admin_list_products, name='admin_list_products'),
    path('api/admin/products/create/', views.admin_create_product, name='admin_create_product'),
    path('api/admin/products/<int:product_id>/', views.admin_product_detail, name='admin_product_detail'),
    path('api/admin/orders/', views.admin_list_orders, name='admin_list_orders'),

    # Refund requests (selective product returns)
    path('api/orders/refund-request/', views.request_refund, name='request_refund'),
    path('api/admin/refund-requests/', views.list_refund_requests, name='list_refund_requests'),
    path('api/admin/refund-requests/<int:refund_request_id>/process/', views.process_refund_request, name='process_refund_request'),

    # Product manager (admin) delivery tools
    path('api/admin/delivery-list/', views.admin_delivery_list, name='admin_delivery_list'),

    # Sales manager only view
    path('api/sales-manager/only/', views.sales_manager_only_view, name='sales_manager_only'),

    # Customer wishlist
    path('api/customer/wishlist/', views.wishlist_api, name='customer_wishlist'),

    # Product manager add product
    path('api/product-manager/add-product/', views.add_product_api, name='product_manager_add_product'),

    # Sales manager set price
    path('api/sales-manager/set-price/', views.set_price_api, name='sales_manager_set_price'),

    # Test open endpoint
    path('api/test-open/', views.test_open, name='test_open'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
