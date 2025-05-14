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
    
    # Auth
    path('api/auth/login/', csrf_exempt(views.login_api), name='api_login'),
    path('api/auth/logout/', views.logout_api, name='api_logout'),
    path('api/auth/register/', csrf_exempt(views.register_api), name='api_register'),
    path('api/auth/forgot-password/', views.forgot_password, name='api_forgot_password'),
    path('api/auth/reset-password/', views.reset_password, name='api_reset_password'),
    path('api/auth/profile/', views.user_profile, name='api_user_profile'),
    path('api/auth/change-password/', views.change_password, name='api_change_password'),
    path('api/auth/check/', views.check_auth, name='api_check_auth'),

    # Ratings & Comments - combined view functions that handle different HTTP methods
    path('api/ratings/', views.ratings_api, name='api_ratings'),
    path('api/comments/', views.comments_api, name='api_comments'),
    path('api/comments/<int:comment_id>/', views.edit_delete_comment, name='api_edit_delete_comment'),

    # Revenue/Profit report
    path('api/revenue/', views.revenue_report, name='api_revenue_report'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
