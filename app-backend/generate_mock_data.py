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
    Distributor, Category, Brand, Seller, Product, ShoppingCartItem, Order,
    OrderItem, Rating, Comment, PaymentConfirmation, ProductReview,
    Delivery, CustomerProfile, Wishlist
)

fake = Faker()

# Helper function to get product image URLs
def get_product_image(category_name, product_title):
    # We'll use different image sources based on product category
    width = 640
    height = 480
    
    # Dictionary mapping categories to image keyword searches
    category_keywords = {
        "Laptops": "laptop",
        "Smartphones": "smartphone",
        "Tablets": "tablet",
        "Accessories": "tech accessory",
        "Gaming": "gaming",
        "Audio": "headphones",
        "Networking": "router",
        "Home Appliances": "appliance", 
        "TVs": "television",
        "Wearables": "smartwatch",
        "Cameras": "camera",
        "Smart Home": "smart home"
    }
    
    # Get the keyword based on category or use a generic one
    keyword = category_keywords.get(category_name, "electronics")
    
    # Different image sources
    image_urls = [
        # Unsplash source with specific keyword
        f"https://source.unsplash.com/featured/{width}x{height}?{keyword}",
        # Lorem Picsum
        f"https://picsum.photos/{width}/{height}",
        # PlaceIMG with electronics category
        f"https://placeimg.com/{width}/{height}/tech"
    ]
    
    # If product title contains a recognizable brand, try to use it in the keyword
    brands = ["apple", "samsung", "sony", "lg", "dell", "hp", "microsoft"]
    for brand in brands:
        if brand.lower() in product_title.lower():
            # For popular products, add more specific image URL
            image_urls.insert(0, f"https://source.unsplash.com/featured/{width}x{height}?{brand}+{keyword}")
            break
    
    # Return a random image URL from our options
    return random.choice(image_urls)

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

def create_brands():
    brands = [
        "Apple",
        "Samsung",
        "Sony",
        "LG",
        "Dell",
        "HP",
        "Microsoft"
    ]
    for name in brands:
        Brand.objects.create(name=name)

def create_sellers():
    sellers = [
        "Tech Marketplace",
        "Gadget Galaxy",
        "ElectroStore",
        "Digital Depot",
        "Tech Haven"
    ]
    for name in sellers:
        Seller.objects.create(name=name)

def create_products():
    distributors = Distributor.objects.all()
    categories = Category.objects.all()
    brands = Brand.objects.all()
    sellers = Seller.objects.all()
    
    # Diverse set of products - 50 in total
    products = [
        # Laptops - 5 items
        {
            "title": "MacBook Pro",
            "model": "M2 Pro",
            "description": "Powerful laptop for professionals with advanced M2 Pro chip, 16GB RAM, and 512GB SSD storage.",
            "price": 1999.99,
            "category": "Laptops",
            "brand": "Apple"
        },
        {
            "title": "Dell XPS 15",
            "model": "9520",
            "description": "Premium Windows laptop with 15.6-inch 4K display, Intel Core i7, 16GB RAM, and 1TB SSD.",
            "price": 1799.99,
            "category": "Laptops",
            "brand": "Dell"
        },
        {
            "title": "HP Spectre x360",
            "model": "14-ef0000",
            "description": "Convertible 2-in-1 laptop with touchscreen, Intel Core i7, 16GB RAM, and 512GB SSD.",
            "price": 1499.99,
            "category": "Laptops",
            "brand": "HP"
        },
        {
            "title": "Lenovo ThinkPad X1 Carbon",
            "model": "Gen 10",
            "description": "Business laptop with Intel Core i5, 16GB RAM, 256GB SSD, and legendary ThinkPad keyboard.",
            "price": 1399.99,
            "category": "Laptops",
            "brand": "Lenovo"
        },
        {
            "title": "ASUS ROG Zephyrus",
            "model": "G14",
            "description": "Gaming laptop with AMD Ryzen 9, NVIDIA RTX 3060, 16GB RAM, and 1TB SSD.",
            "price": 1599.99,
            "category": "Laptops",
            "brand": "ASUS"
        },
        
        # Smartphones - 5 items
        {
            "title": "iPhone 15",
            "model": "Pro Max",
            "description": "Latest iPhone with advanced camera system, A16 Bionic chip, and Super Retina XDR display.",
            "price": 1099.99,
            "category": "Smartphones",
            "brand": "Apple"
        },
        {
            "title": "Samsung Galaxy S23",
            "model": "Ultra",
            "description": "Premium Android smartphone with 108MP camera, S Pen support, and Snapdragon 8 Gen 2 processor.",
            "price": 1199.99,
            "category": "Smartphones",
            "brand": "Samsung"
        },
        {
            "title": "Google Pixel 8",
            "model": "Pro",
            "description": "Google's flagship smartphone with exceptional camera capabilities and pure Android experience.",
            "price": 899.99,
            "category": "Smartphones",
            "brand": "Google"
        },
        {
            "title": "OnePlus 11",
            "model": "5G",
            "description": "Performance-focused smartphone with Snapdragon 8 Gen 2, 120Hz AMOLED display, and fast charging.",
            "price": 799.99,
            "category": "Smartphones",
            "brand": "OnePlus"
        },
        {
            "title": "Xiaomi 13",
            "model": "Pro",
            "description": "Feature-packed smartphone with Leica optics, Snapdragon 8 Gen 2, and 120W fast charging.",
            "price": 899.99,
            "category": "Smartphones",
            "brand": "Xiaomi"
        },
        
        # Tablets - 5 items
        {
            "title": "iPad Pro",
            "model": "12.9-inch",
            "description": "Professional tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil support.",
            "price": 1099.99,
            "category": "Tablets",
            "brand": "Apple"
        },
        {
            "title": "Samsung Galaxy Tab S9",
            "model": "Ultra",
            "description": "Premium Android tablet with 14.6-inch AMOLED display, S Pen included, and Snapdragon 8 Gen 2.",
            "price": 1199.99,
            "category": "Tablets",
            "brand": "Samsung"
        },
        {
            "title": "Microsoft Surface Pro 9",
            "model": "i7",
            "description": "Windows tablet with detachable keyboard, 13-inch display, and Intel Core i7 processor.",
            "price": 1399.99,
            "category": "Tablets",
            "brand": "Microsoft"
        },
        {
            "title": "Lenovo Tab P12 Pro",
            "model": "2023",
            "description": "Android tablet with 12.6-inch AMOLED display, Snapdragon 870, and Precision Pen 3 support.",
            "price": 699.99,
            "category": "Tablets",
            "brand": "Lenovo"
        },
        {
            "title": "Amazon Fire HD 10",
            "model": "Plus",
            "description": "Affordable tablet with 10.1-inch Full HD display, octa-core processor, and hands-free Alexa.",
            "price": 179.99,
            "category": "Tablets",
            "brand": "Amazon"
        },
        
        # Audio Products - 5 items
        {
            "title": "AirPods Pro",
            "model": "2nd Gen",
            "description": "Premium wireless earbuds with active noise cancellation, spatial audio, and adaptive transparency.",
            "price": 249.99,
            "category": "Audio",
            "brand": "Apple"
        },
        {
            "title": "Sony WH-1000XM5",
            "model": "Wireless",
            "description": "Industry-leading noise cancelling headphones with exceptional sound quality and 30-hour battery life.",
            "price": 399.99,
            "category": "Audio",
            "brand": "Sony"
        },
        {
            "title": "Bose QuietComfort Earbuds",
            "model": "II",
            "description": "Wireless earbuds with adjustable noise cancellation and high-fidelity audio performance.",
            "price": 299.99,
            "category": "Audio",
            "brand": "Bose"
        },
        {
            "title": "Sonos Arc",
            "model": "Premium",
            "description": "Smart soundbar with Dolby Atmos, voice assistant support, and immersive sound experience.",
            "price": 899.99,
            "category": "Audio",
            "brand": "Sonos"
        },
        {
            "title": "JBL Flip 6",
            "model": "Portable",
            "description": "Portable Bluetooth speaker with powerful sound, PartyBoost feature, and waterproof design.",
            "price": 129.99,
            "category": "Audio",
            "brand": "JBL"
        },
        
        # Gaming - 5 items
        {
            "title": "PlayStation 5",
            "model": "Digital Edition",
            "description": "Next-gen gaming console with ultra-high-speed SSD, ray tracing, and 4K gaming support.",
            "price": 399.99,
            "category": "Gaming",
            "brand": "Sony"
        },
        {
            "title": "Xbox Series X",
            "model": "1TB",
            "description": "Microsoft's most powerful console with 12 teraflops of power, 4K gaming, and Quick Resume feature.",
            "price": 499.99,
            "category": "Gaming",
            "brand": "Microsoft"
        },
        {
            "title": "Nintendo Switch",
            "model": "OLED",
            "description": "Hybrid gaming console with 7-inch OLED screen, enhanced audio, and versatile play modes.",
            "price": 349.99,
            "category": "Gaming",
            "brand": "Nintendo"
        },
        {
            "title": "Razer BlackShark V2",
            "model": "Pro",
            "description": "Esports gaming headset with THX Spatial Audio, detachable mic, and all-day comfort design.",
            "price": 179.99,
            "category": "Gaming",
            "brand": "Razer"
        },
        {
            "title": "Logitech G Pro X",
            "model": "Superlight",
            "description": "Ultra-lightweight wireless gaming mouse with HERO 25K sensor and 70-hour battery life.",
            "price": 149.99,
            "category": "Gaming",
            "brand": "Logitech"
        },
        
        # Home Appliances - 5 items
        {
            "title": "Dyson V15 Detect",
            "model": "Absolute",
            "description": "Cordless vacuum with laser dust detection, HEPA filtration, and powerful suction technology.",
            "price": 749.99,
            "category": "Home Appliances",
            "brand": "Dyson"
        },
        {
            "title": "KitchenAid Stand Mixer",
            "model": "Professional 600",
            "description": "Professional-grade stand mixer with 6-quart bowl, 10 speeds, and planetary mixing action.",
            "price": 499.99,
            "category": "Home Appliances",
            "brand": "KitchenAid"
        },
        {
            "title": "Samsung Family Hub",
            "model": "French Door",
            "description": "Smart refrigerator with touchscreen display, built-in cameras, and Wi-Fi connectivity.",
            "price": 3299.99,
            "category": "Home Appliances",
            "brand": "Samsung"
        },
        {
            "title": "Ninja Foodi",
            "model": "14-in-1",
            "description": "Multi-cooker with pressure cooking, air frying, and multiple other cooking functions.",
            "price": 299.99,
            "category": "Home Appliances",
            "brand": "Ninja"
        },
        {
            "title": "LG Front Load Washer",
            "model": "WM4500",
            "description": "Smart washing machine with TurboWash technology, steam cleaning, and Wi-Fi connectivity.",
            "price": 999.99,
            "category": "Home Appliances",
            "brand": "LG"
        },
        
        # TVs and Displays - 5 items
        {
            "title": "LG C3 OLED TV",
            "model": "65-inch",
            "description": "4K OLED TV with perfect blacks, Dolby Vision IQ, and NVIDIA G-SYNC for gaming.",
            "price": 1799.99,
            "category": "TVs",
            "brand": "LG"
        },
        {
            "title": "Samsung QN90B",
            "model": "75-inch",
            "description": "Neo QLED 4K TV with mini-LED technology, anti-glare screen, and powerful upscaling.",
            "price": 2499.99,
            "category": "TVs",
            "brand": "Samsung"
        },
        {
            "title": "Sony A95K",
            "model": "55-inch",
            "description": "QD-OLED TV with exceptional color and contrast, cognitive processor XR, and acoustic surface audio.",
            "price": 1999.99,
            "category": "TVs",
            "brand": "Sony"
        },
        {
            "title": "TCL 6-Series",
            "model": "65-inch",
            "description": "QLED TV with mini-LED backlighting, Dolby Vision, and Google TV smart features.",
            "price": 999.99,
            "category": "TVs",
            "brand": "TCL"
        },
        {
            "title": "Hisense U8H",
            "model": "65-inch",
            "description": "Mini-LED QLED TV with 1500-nit brightness, IMAX Enhanced certification, and 120Hz refresh rate.",
            "price": 899.99,
            "category": "TVs",
            "brand": "Hisense"
        },
        
        # Wearables - 5 items
        {
            "title": "Apple Watch Ultra",
            "model": "GPS + Cellular",
            "description": "Rugged smartwatch with precision dual-frequency GPS, customizable action button, and up to 36 hours of battery life.",
            "price": 799.99,
            "category": "Wearables",
            "brand": "Apple"
        },
        {
            "title": "Samsung Galaxy Watch 6",
            "model": "Classic",
            "description": "Smartwatch with rotating bezel, advanced health tracking, and Wear OS powered by Samsung.",
            "price": 399.99,
            "category": "Wearables",
            "brand": "Samsung"
        },
        {
            "title": "Garmin Fenix 7",
            "model": "Sapphire Solar",
            "description": "Premium multisport GPS watch with solar charging, touchscreen, and advanced training features.",
            "price": 899.99,
            "category": "Wearables",
            "brand": "Garmin"
        },
        {
            "title": "Fitbit Sense 2",
            "model": "Advanced",
            "description": "Health-focused smartwatch with ECG app, stress management tools, and 6+ days of battery life.",
            "price": 299.99,
            "category": "Wearables",
            "brand": "Fitbit"
        },
        {
            "title": "Oura Ring",
            "model": "Generation 3",
            "description": "Health tracking ring with sleep analysis, activity tracking, and temperature monitoring.",
            "price": 299.99,
            "category": "Wearables",
            "brand": "Oura"
        },
        
        # Cameras - 5 items
        {
            "title": "Sony Alpha a7 IV",
            "model": "Mirrorless",
            "description": "Full-frame mirrorless camera with 33MP sensor, 4K 60p video, and advanced autofocus system.",
            "price": 2499.99,
            "category": "Cameras",
            "brand": "Sony"
        },
        {
            "title": "Canon EOS R6 Mark II",
            "model": "Mirrorless",
            "description": "Full-frame mirrorless camera with 24.2MP sensor, 40fps burst shooting, and 6K RAW video.",
            "price": 2499.99,
            "category": "Cameras",
            "brand": "Canon"
        },
        {
            "title": "Nikon Z8",
            "model": "Mirrorless",
            "description": "Flagship mirrorless camera with 45.7MP sensor, 8K video, and professional-grade autofocus.",
            "price": 3999.99,
            "category": "Cameras",
            "brand": "Nikon"
        },
        {
            "title": "Fujifilm X-T5",
            "model": "Mirrorless",
            "description": "APS-C mirrorless camera with 40MP sensor, classic dial controls, and film simulation modes.",
            "price": 1699.99,
            "category": "Cameras",
            "brand": "Fujifilm"
        },
        {
            "title": "GoPro HERO11",
            "model": "Black",
            "description": "Action camera with 5.3K video, HyperSmooth 5.0 stabilization, and waterproof design.",
            "price": 499.99,
            "category": "Cameras",
            "brand": "GoPro"
        },
        
        # Smart Home - 5 items
        {
            "title": "Amazon Echo Show 10",
            "model": "3rd Gen",
            "description": "Smart display with motion tracking, 10.1-inch HD screen, and built-in Zigbee hub.",
            "price": 249.99,
            "category": "Smart Home",
            "brand": "Amazon"
        },
        {
            "title": "Google Nest Hub Max",
            "model": "Smart Display",
            "description": "Smart home center with 10-inch touchscreen, built-in camera, and Google Assistant.",
            "price": 229.99,
            "category": "Smart Home",
            "brand": "Google"
        },
        {
            "title": "Philips Hue Starter Kit",
            "model": "White and Color",
            "description": "Smart lighting system with bridge and four color-changing bulbs for customizable ambiance.",
            "price": 199.99,
            "category": "Smart Home",
            "brand": "Philips"
        },
        {
            "title": "Ring Video Doorbell Pro 2",
            "model": "Wired",
            "description": "Advanced video doorbell with 3D motion detection, head-to-toe video, and enhanced audio.",
            "price": 249.99,
            "category": "Smart Home",
            "brand": "Ring"
        },
        {
            "title": "Ecobee Smart Thermostat",
            "model": "Premium",
            "description": "Smart thermostat with voice control, air quality monitoring, and energy-saving features.",
            "price": 249.99,
            "category": "Smart Home",
            "brand": "Ecobee"
        }
    ]
    
    for product_data in products:
        # Fix for duplicate categories - get the first one that matches
        category = Category.objects.filter(name=product_data["category"]).first()
        if not category:
            print(f"Category {product_data['category']} not found, creating it...")
            category = Category.objects.create(name=product_data["category"])
            
        # Get brand or create if not found
        brand = Brand.objects.filter(name=product_data["brand"]).first()
        if not brand:
            print(f"Brand {product_data['brand']} not found, creating it...")
            brand = Brand.objects.create(name=product_data["brand"])
            
        # Get image filename for this product
        # For image field, just provide a filename without the full URL
        # Django's ImageField expects to handle the storage paths
        image_filename = f"{product_data['brand'].lower()}_{product_data['model'].lower().replace(' ', '_')}.jpg"
            
        Product.objects.create(
            title=product_data["title"],
            model=product_data["model"],
            serial_number=fake.uuid4(),
            description=product_data["description"],
            quantity_in_stock=random.randint(10, 100),
            price=product_data["price"],
            cost=product_data["price"] * 0.6,  # 60% of retail price
            warranty_status=random.choice([True, False]),
            distributor=random.choice(distributors),
            category=category,
            brand=brand,
            seller=random.choice(sellers),
            popularity=random.randint(0, 1000),
            image=image_filename  # Use filename only, not full URL
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
                status = random.choice(['processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'refunded'])
            
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
                status=order.status if order.status in ['processing', 'in_transit', 'delivered'] else 'processing',
                delivery_address=user.profile.home_address,
                shipped_at=timezone.now() - timedelta(days=random.randint(1, 5)) if order.status not in ['processing', 'cancelled'] else None,
                delivered_at=timezone.now() if order.status == 'delivered' else None
            )

def create_ratings_and_reviews():
    users = User.objects.all()
    products = Product.objects.all()
    
    # First, create ratings from users who purchased products
    for product in products:
        # Get users who have received this product in a delivered order
        delivered_users = list(User.objects.filter(
            order__status='delivered',
            order__items__product=product
        ).distinct())
        
        rated_users = set()  # Track users who have already rated this product
        
        if delivered_users:
            # Create 3-8 ratings per product from users who received it
            num_ratings = min(random.randint(3, 8), len(delivered_users))
            selected_users = random.sample(delivered_users, num_ratings)
            
            for user in selected_users:
                rating = random.randint(3, 5)  # People who bought the product tend to rate higher (3-5)
                try:
                    # Check if user already rated this product
                    existing_rating = Rating.objects.filter(user=user, product=product).first()
                    if existing_rating:
                        # Update the existing rating instead of creating a new one
                        existing_rating.score = rating
                        existing_rating.save()
                    else:
                        # Create a new rating
                        Rating.objects.create(
                            user=user,
                            product=product,
                            score=rating
                        )
                    
                    rated_users.add(user.id)
                    
                    # Create a review for some ratings
                    if random.random() < 0.7:  # 70% chance of creating a review
                        # Check if review already exists
                        existing_review = ProductReview.objects.filter(user=user, product=product).first()
                        if existing_review:
                            # Update existing review
                            existing_review.rating = rating * 2  # Convert 1-5 to 2-10
                            existing_review.comment = fake.paragraph(nb_sentences=3)
                            existing_review.is_approved = random.choice([True, False])
                            existing_review.save()
                        else:
                            # Create a new review
                            ProductReview.objects.create(
                                user=user,
                                product=product,
                                rating=rating * 2,  # Convert 1-5 to 2-10
                                comment=fake.paragraph(nb_sentences=3),
                                is_approved=random.choice([True, False])
                            )
                except Exception as e:
                    print(f"Error creating rating/review for user {user.username} and product {product.title}: {str(e)}")
                    continue
    
    # Then ensure all products have some ratings, even if not purchased
    for product in products:
        # Check if product already has ratings
        existing_ratings_count = Rating.objects.filter(product=product).count()
        
        # If not enough ratings, add more
        if existing_ratings_count < 5:  # Ensure at least 5 ratings per product
            # How many more ratings to add
            ratings_to_add = 5 - existing_ratings_count
            
            # Get users who haven't rated this product yet
            available_users = list(User.objects.exclude(id__in=Rating.objects.filter(product=product).values_list('user_id', flat=True)))
            
            if available_users:
                # Select users to add ratings
                num_users = min(ratings_to_add, len(available_users))
                selected_users = random.sample(available_users, num_users)
                
                # Create ratings
                for user in selected_users:
                    # Users who didn't purchase might give more varied ratings
                    rating = random.randint(1, 5)
                    try:
                        Rating.objects.create(
                            user=user,
                            product=product,
                            score=rating
                        )
                        
                        # Some users leave reviews too (less likely than purchasers)
                        if random.random() < 0.4:  # 40% chance
                            ProductReview.objects.create(
                                user=user,
                                product=product,
                                rating=rating * 2,  # Convert 1-5 to 2-10
                                comment=fake.paragraph(nb_sentences=2),
                                is_approved=random.choice([True, False])
                            )
                    except Exception as e:
                        print(f"Error creating additional rating for user {user.username} and product {product.title}: {str(e)}")
                        continue

    # Update product average ratings
    update_product_ratings()

def update_product_ratings():
    """Update the avg_rating field for all products based on their ratings."""
    from django.db.models import Avg
    
    products = Product.objects.all()
    
    for product in products:
        # Calculate average rating
        avg = Rating.objects.filter(product=product).aggregate(Avg('score'))['score__avg']
        
        # If product has ratings, update its avg_rating
        if avg is not None:
            product.avg_rating = avg
            product.save()
            print(f"Updated average rating for {product.title}: {avg:.1f}")
        else:
            # If no ratings, set a default
            product.avg_rating = 0.0
            product.save()
            print(f"No ratings found for {product.title}, set to 0.0")

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
    
    print("Creating brands...")
    create_brands()
    
    print("Creating sellers...")
    create_sellers()
    
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