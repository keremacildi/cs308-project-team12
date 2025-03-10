from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    list_products, AnonymousCartViewSet, 
    ShoppingCartViewSet, AdminViewSet, search_products, place_order
)

router = DefaultRouter()
router.register(r'anonymous-cart', AnonymousCartViewSet, basename='anonymous-cart')
router.register(r'shopping-cart', ShoppingCartViewSet, basename='shopping-cart')

urlpatterns = [
    path('', include(router.urls)),
    path('products/', list_products, name='product-list'),
    path('search/', search_products, name='search-products'),
    path('order/', place_order, name='place-order'),
    
    # Admin endpoints for managerial tasks.
    path('manager/products/', AdminViewSet.as_view({
        'get': 'products',
        'post': 'add_product'
    }), name='manager-products'),
    path('manager/products/<int:pk>/', AdminViewSet.as_view({
        'put': 'update_product'
    }), name='manager-product-detail'),
]
