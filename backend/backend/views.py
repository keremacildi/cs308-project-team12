from rest_framework import viewsets
from rest_framework.response import Response

class ProductViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response([])

class ShoppingCartViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response([])

class OrderViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response([]) 