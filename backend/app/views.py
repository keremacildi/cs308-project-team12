from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Product, Order, Rating, Comment
from django.contrib.auth.decorators import login_required
import json

@login_required
def browse_products(request):
    products = Product.objects.filter(is_available=True).values("id", "name", "description", "price", "stock")
    return JsonResponse(list(products), safe=False)

@login_required
@csrf_exempt
def purchase_product(request):
    if request.method == "POST":
        data = json.loads(request.body)
        product = get_object_or_404(Product, id=data["product_id"])
        if product.stock >= data["quantity"]:
            Order.objects.create(user=request.user, product=product, quantity=data["quantity"], status="Pending")
            product.stock -= data["quantity"]
            product.save()
            return JsonResponse({"message": "Order placed successfully"})
        return JsonResponse({"error": "Insufficient stock"}, status=400)

@login_required
@csrf_exempt
def submit_rating(request):
    if request.method == "POST":
        data = json.loads(request.body)
        product = get_object_or_404(Product, id=data["product_id"])
        try:
            Rating.objects.create(user=request.user, product=product, score=data["score"])
            return JsonResponse({"message": "Rating submitted"})
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

@login_required
@csrf_exempt
def submit_comment(request):
    if request.method == "POST":
        data = json.loads(request.body)
        product = get_object_or_404(Product, id=data["product_id"])
        try:
            comment = Comment.objects.create(user=request.user, product=product, text=data["text"])
            return JsonResponse({"message": "Comment submitted for approval"})
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)

@login_required
def get_approved_comments(request, product_id):
    comments = Comment.objects.filter(product_id=product_id, is_approved=True).values("user__username", "text")
    return JsonResponse(list(comments), safe=False)

@login_required
@csrf_exempt
def manage_orders(request):
    if request.method == "DELETE":
        data = json.loads(request.body)
        order = get_object_or_404(Order, id=data["order_id"], user=request.user)
        if order.status == "Pending":
            order.delete()
            return JsonResponse({"message": "Order cancelled"})
        return JsonResponse({"error": "Cannot cancel delivered order"}, status=400)

@login_required
@csrf_exempt
def return_product(request):
    if request.method == "POST":
        data = json.loads(request.body)
        order = get_object_or_404(Order, id=data["order_id"], user=request.user, status="Delivered")
        order.status = "Returned"
        order.save()
        return JsonResponse({"message": "Product returned successfully"})
