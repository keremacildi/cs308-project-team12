from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from app.views import (
    ProductViewSet, ShoppingCartViewSet, OrderViewSet,
    AnonymousCartViewSet, ProductManagerViewSet,
    merge_carts
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'cart', ShoppingCartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='orders')
router.register(r'anonymous-cart', AnonymousCartViewSet, basename='anonymous-cart')
router.register(r'product-manager', ProductManagerViewSet, basename='product-manager')

urlpatterns = [
    path('', include(router.urls)),
    path('merge-carts/', merge_carts, name='merge-carts'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
