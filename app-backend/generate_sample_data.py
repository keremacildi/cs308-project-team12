import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from faker import Faker
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from app_backend.models import (
    Category, Product, Rating, Comment, Order, OrderItem
)

fake = Faker()

def create_categories(num_categories=3):
    """Create sample categories"""
    categories = [
        "Electronics",
        "Computers",
        "Mobile Phones",
        "Home Appliances",
        "Audio Equipment"
    ]
    
    created_categories = []
    for i in range(min(num_categories, len(categories))):
        category, created = Category.objects.get_or_create(name=categories[i])
        created_categories.append(category)
        if created:
            print(f"Created category: {category.name}")
    
    return created_categories

def create_users(num_users=4):
    """Create sample users"""
    created_users = []
    
    # Create admin user if it doesn't exist
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print(f"Created admin user: {admin.username}")
    
    # Create regular users
    for i in range(num_users):
        username = fake.user_name() + str(random.randint(1, 1000))
        email = fake.email()
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {user.username}")
        
        created_users.append(user)
    
    return created_users

def create_products(categories, num_products=5):
    """Create sample products"""
    products = [
        {
            "title": "MacBook Pro",
            "model": "M2 Pro 2023",
            "description": "Powerful laptop for professionals with advanced M2 Pro chip, 16GB RAM, and 512GB SSD storage.",
            "price": Decimal('1999.99'),
            "cost": Decimal('1499.99')
        },
        {
            "title": "iPhone 15",
            "model": "Pro Max",
            "description": "Latest iPhone with advanced camera system, A16 Bionic chip, and Super Retina XDR display.",
            "price": Decimal('1099.99'),
            "cost": Decimal('799.99')
        },
        {
            "title": "Sony WH-1000XM5",
            "model": "Wireless Headphones",
            "description": "Industry-leading noise cancelling headphones with exceptional sound quality and 30-hour battery life.",
            "price": Decimal('399.99'),
            "cost": Decimal('249.99')
        },
        {
            "title": "Samsung Galaxy S23",
            "model": "Ultra",
            "description": "Premium Android smartphone with 108MP camera, S Pen support, and Snapdragon 8 Gen 2 processor.",
            "price": Decimal('1199.99'),
            "cost": Decimal('899.99')
        },
        {
            "title": "Dell XPS 15",
            "model": "9520",
            "description": "Premium Windows laptop with 15.6-inch 4K display, Intel Core i7, 16GB RAM, and 1TB SSD.",
            "price": Decimal('1799.99'),
            "cost": Decimal('1299.99')
        },
        {
            "title": "iPad Pro",
            "model": "12.9-inch",
            "description": "Professional tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil support.",
            "price": Decimal('1099.99'),
            "cost": Decimal('799.99')
        },
        {
            "title": "Canon EOS R6",
            "model": "Mark II",
            "description": "Full-frame mirrorless camera with 24.2MP sensor, 40fps burst shooting, and 6K RAW video.",
            "price": Decimal('2499.99'),
            "cost": Decimal('1799.99')
        }
    ]
    
    created_products = []
    
    for i in range(min(num_products, len(products))):
        product_data = products[i]
        serial_number = fake.uuid4()
        category = random.choice(categories)
        distributor_info = f"{fake.company()}, {fake.address()}, {fake.phone_number()}, {fake.email()}"
        
        product, created = Product.objects.get_or_create(
            title=product_data["title"],
            model=product_data["model"],
            defaults={
                'serial_number': serial_number,
                'description': product_data["description"],
                'quantity_in_stock': random.randint(10, 100),
                'price': product_data["price"],
                'cost': product_data["cost"],
                'warranty_status': random.choice([True, False]),
                'distributor_info': distributor_info,
                'category': category
            }
        )
        
        if created:
            print(f"Created product: {product.title} {product.model}")
        else:
            # Update existing product if it already exists
            product.serial_number = serial_number
            product.description = product_data["description"]
            product.quantity_in_stock = random.randint(10, 100)
            product.price = product_data["price"]
            product.cost = product_data["cost"]
            product.warranty_status = random.choice([True, False])
            product.distributor_info = distributor_info
            product.category = category
            product.save()
            print(f"Updated product: {product.title} {product.model}")
        
        created_products.append(product)
    
    return created_products

def create_ratings(products, users, num_ratings=100):
    """Create sample ratings"""
    created_ratings = []
    
    for _ in range(num_ratings):
        product = random.choice(products)
        user = random.choice(users)
        score = random.randint(1, 5)
        
        rating, created = Rating.objects.get_or_create(
            user=user,
            product=product,
            defaults={'score': score}
        )
        
        if created:
            print(f"Created rating: {user.username} rated {product.title} as {score}/5")
        else:
            # Update existing rating if it already exists
            rating.score = score
            rating.save()
            print(f"Updated rating: {user.username} rated {product.title} as {score}/5")
        
        created_ratings.append(rating)
    
    return created_ratings

def create_comments(products, users, num_comments=20):
    """Create sample comments"""
    created_comments = []
    
    for _ in range(num_comments):
        product = random.choice(products)
        user = random.choice(users)
        text = fake.paragraph()
        approved = random.choice([True, False])
        
        comment = Comment.objects.create(
            user=user,
            product=product,
            text=text,
            approved=approved
        )
        
        print(f"Created comment by {user.username} on {product.title}")
        created_comments.append(comment)
    
    return created_comments

def create_orders(products, users, num_orders=20):
    """Create sample orders"""
    created_orders = []
    
    status_choices = ['processing', 'in_transit', 'delivered', 'cancelled', 'refunded']
    
    for _ in range(num_orders):
        user = random.choice(users)
        status = random.choice(status_choices)
        created_at = timezone.now() - timedelta(days=random.randint(1, 90))
        
        # Create order
        order = Order.objects.create(
            user=user,
            status=status,
            created_at=created_at
        )
        
        # Add 1-3 items to the order
        num_items = random.randint(1, 3)
        order_products = random.sample(products, num_items)
        total_price = Decimal('0.0')
        
        for product in order_products:
            quantity = random.randint(1, 3)
            price_at_purchase = product.price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price_at_purchase=price_at_purchase
            )
            
            total_price += price_at_purchase * Decimal(quantity)
        
        # Update order total
        order.total_price = total_price
        order.save()
        
        print(f"Created order #{order.id} for {user.username} with {num_items} items, total: ${total_price}")
        created_orders.append(order)
    
    return created_orders

def main():
    """Main function to generate all sample data"""
    print("Generating sample data...")
    
    # Create sample data
    categories = create_categories(num_categories=3)
    users = create_users(num_users=4)
    products = create_products(categories, num_products=5)
    ratings = create_ratings(products, users, num_ratings=100)
    comments = create_comments(products, users, num_comments=20)
    orders = create_orders(products, users, num_orders=20)
    
    # Print summary
    print("\nSample data generation complete!")
    print(f"Created {len(categories)} categories")
    print(f"Created {len(users)} users")
    print(f"Created {len(products)} products")
    print(f"Created {len(ratings)} ratings")
    print(f"Created {len(comments)} comments")
    print(f"Created {len(orders)} orders")

if __name__ == "__main__":
    main() 