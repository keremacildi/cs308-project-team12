import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from app_backend.models import (
    Distributor, Category, Product, ShoppingCartItem, Order,
    OrderItem, Rating, Comment, PaymentConfirmation, ProductReview,
    Delivery, CustomerProfile, Wishlist
)

fake = Faker()

def create_distributors():
    distributors = [
        "TechDist Inc.",
        "Global Electronics",
        "Digital Solutions",
        "ElectroWorld",
        "TechSupply Co."
    ]
    for name in distributors:
        Distributor.objects.create(
            name=name,
            contact_info=fake.address()
        )

def create_categories():
    categories = [
        "Laptops",
        "Smartphones",
        "Tablets",
        "Accessories",
        "Gaming",
        "Audio",
        "Networking"
    ]
    for name in categories:
        Category.objects.create(name=name)

def create_products():
    distributors = Distributor.objects.all()
    categories = Category.objects.all()
    
    products = [
        {
            "name": "MacBook Pro",
            "model": "M2 Pro",
            "description": "Powerful laptop for professionals",
            "price": 1999.99,
            "category": "Laptops"
        },
        {
            "name": "iPhone 15",
            "model": "Pro Max",
            "description": "Latest iPhone with advanced camera system",
            "price": 1099.99,
            "category": "Smartphones"
        },
        {
            "name": "iPad Pro",
            "model": "12.9-inch",
            "description": "Professional tablet with M2 chip",
            "price": 1099.99,
            "category": "Tablets"
        },
        {
            "name": "AirPods Pro",
            "model": "2nd Gen",
            "description": "Premium wireless earbuds with ANC",
            "price": 249.99,
            "category": "Audio"
        },
        {
            "name": "PlayStation 5",
            "model": "Digital Edition",
            "description": "Next-gen gaming console",
            "price": 399.99,
            "category": "Gaming"
        }
    ]
    
    for product_data in products:
        category = categories.get(name=product_data["category"])
        Product.objects.create(
            name=product_data["name"],
            model=product_data["model"],
            serial_number=fake.uuid4(),
            description=product_data["description"],
            quantity_in_stock=random.randint(10, 100),
            price=product_data["price"],
            warranty_status=random.choice([True, False]),
            distributor=random.choice(distributors),
            category=category,
            popularity=random.randint(0, 1000)
        )

def create_users():
    roles = ['customer', 'sales_manager', 'product_manager']
    for _ in range(10):
        user = User.objects.create_user(
            username=fake.user_name(),
            email=fake.email(),
            password='testpass123'
        )
        # Update the profile instead of creating it
        profile = user.profile
        profile.home_address = fake.address()
        profile.role = random.choice(roles)
        profile.save()

def create_orders():
    users = User.objects.all()
    products = Product.objects.all()
    
    for user in users:
        # Create 1-3 orders per user
        for _ in range(random.randint(1, 3)):
            # Ensure at least one delivered order per user
            if _ == 0:
                status = 'delivered'
            else:
                status = random.choice(['processing', 'in_transit', 'delivered', 'cancelled', 'refunded'])
            
            order = Order.objects.create(
                user=user,
                status=status,
                total_price=0
            )
            
            # Create 1-5 items per order
            order_items = random.sample(list(products), random.randint(1, 5))
            total_price = 0
            
            for product in order_items:
                quantity = random.randint(1, 3)
                price = product.price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price_at_purchase=price
                )
                total_price += price * quantity
            
            order.total_price = total_price
            order.save()
            
            # Create delivery for the order
            Delivery.objects.create(
                order=order,
                status=order.status,
                delivery_address=user.profile.home_address,
                shipped_at=timezone.now() - timedelta(days=random.randint(1, 5)) if order.status != 'processing' else None,
                delivered_at=timezone.now() if order.status == 'delivered' else None
            )

def create_ratings_and_reviews():
    users = User.objects.all()
    products = Product.objects.all()
    
    for product in products:
        # Get users who have received this product in a delivered order
        delivered_users = list(User.objects.filter(
            order__status='delivered',
            order__items__product=product
        ).distinct())
        
        if not delivered_users:
            continue
            
        # Create 3-8 ratings per product from users who received it
        num_ratings = min(random.randint(3, 8), len(delivered_users))
        selected_users = random.sample(delivered_users, num_ratings)
        
        for user in selected_users:
            rating = random.randint(1, 5)
            Rating.objects.create(
                user=user,
                product=product,
                score=rating
            )
            
            # Create a review for some ratings
            if random.random() < 0.7:  # 70% chance of creating a review
                ProductReview.objects.create(
                    user=user,
                    product=product,
                    rating=rating * 2,  # Convert 1-5 to 2-10
                    comment=fake.paragraph(nb_sentences=3),
                    is_approved=random.choice([True, False])
                )

def create_wishlists():
    users = User.objects.all()
    products = Product.objects.all()
    
    for user in users:
        # Add 2-5 products to each user's wishlist
        wishlist_products = random.sample(list(products), random.randint(2, 5))
        for product in wishlist_products:
            Wishlist.objects.create(
                user=user,
                product=product
            )

def main():
    print("Creating mock data...")
    
    print("Creating distributors...")
    create_distributors()
    
    print("Creating categories...")
    create_categories()
    
    print("Creating products...")
    create_products()
    
    print("Creating users...")
    create_users()
    
    print("Creating orders...")
    create_orders()
    
    print("Creating ratings and reviews...")
    create_ratings_and_reviews()
    
    print("Creating wishlists...")
    create_wishlists()
    
    print("Mock data generation complete!")

if __name__ == "__main__":
    main() 