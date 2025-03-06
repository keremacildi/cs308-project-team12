from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    list_products, cancel_order, refund_order, get_profile,
    AnonymousCartViewSet, ShoppingCartViewSet, OrderViewSet, AdminViewSet
)

router = DefaultRouter()
router.register(r'anonymous-cart', AnonymousCartViewSet, basename='anonymous-cart')
router.register(r'shopping-cart', ShoppingCartViewSet, basename='shopping-cart')
router.register(r'orders', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
    path('products/', list_products, name='product-list'),
    path('orders/<int:order_id>/cancel/', cancel_order, name='cancel-order'),
    path('orders/<int:order_id>/refund/', refund_order, name='refund-order'),
    path('profile/', get_profile, name='user-profile'),
    
    # Simplified Admin URLs
    path('manager/dashboard/', AdminViewSet.as_view({'get': 'dashboard'}), name='manager-dashboard'),
    path('manager/products/', AdminViewSet.as_view({
        'get': 'products',
        'post': 'add_product'
    }), name='manager-products'),
    path('manager/products/<int:pk>/', AdminViewSet.as_view({
        'put': 'update_product'
    }), name='manager-product-detail'),
    path('manager/orders/', AdminViewSet.as_view({'get': 'orders'}), name='manager-orders'),
    path('manager/orders/<int:pk>/', AdminViewSet.as_view({
        'patch': 'update_order'
    }), name='manager-order-update'),
] 