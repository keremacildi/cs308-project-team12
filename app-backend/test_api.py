#!/usr/bin/env python
import os
import sys
import django
import json
import requests
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from app_backend.models import Distributor, Category, Brand, Seller, User
from django.contrib.auth import authenticate

def login():
    """Get auth token for a staff user"""
    # Find a staff user
    staff_users = User.objects.filter(is_staff=True)
    if not staff_users.exists():
        print("No staff users found in the database!")
        return None
    
    staff_user = staff_users.first()
    print(f"Using staff user: {staff_user.username}")
    
    # Get or create password for testing
    password = "testpassword123"  # This is just for testing
    staff_user.set_password(password)
    staff_user.save()
    
    # Login to get token
    login_data = {
        "username": staff_user.username,
        "password": password
    }
    
    try:
        login_url = "http://localhost:8000/api/auth/login/"
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            print("Authentication successful!")
            return token
        else:
            print(f"Login failed with status {login_response.status_code}")
            print(login_response.text)
            return None
    except Exception as e:
        print(f"Error during login: {type(e).__name__} - {e}")
        return None

def test_product_api():
    # Get authentication token
    token = login()
    if not token:
        print("Cannot proceed without authentication")
        return False
    
    # Set up headers with token
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get the first distributor, category, brand, and seller
    distributor = Distributor.objects.first()
    category = Category.objects.first()
    brand = Brand.objects.first()
    seller = Seller.objects.first()
    
    print(f"Distributor: {distributor.id} - {distributor.name}")
    if category:
        print(f"Category: {category.id} - {category.name}")
    if brand:
        print(f"Brand: {brand.id} - {brand.name}")
    if seller:
        print(f"Seller: {seller.id} - {seller.name}")
    
    # Prepare the data
    test_data = {
        "title": "API Test Product",
        "model": "API-TEST-123",
        "serial_number": "APITEST12345",
        "description": "Test product created via API",
        "quantity_in_stock": 5,
        "price": "129.99",
        "distributor_id": distributor.id
    }
    
    if category:
        test_data["category_id"] = category.id
    if brand:
        test_data["brand_id"] = brand.id
    if seller:
        test_data["seller_id"] = seller.id
    
    print("\nRequest data:")
    print(json.dumps(test_data, indent=2))
    
    # Send the request
    try:
        url = "http://localhost:8000/api/admin/products/"
        response = requests.post(url, json=test_data, headers=headers)
        
        print(f"\nResponse status: {response.status_code}")
        
        try:
            response_data = response.json()
            print("Response data:")
            print(json.dumps(response_data, indent=2))
        except ValueError:
            print("Response is not JSON:", response.text)
        
        # Return the success status
        return response.status_code == 201
    
    except Exception as e:
        print(f"Error sending request: {type(e).__name__} - {e}")
        return False

if __name__ == "__main__":
    print("Testing Product API...")
    success = test_product_api()
    print(f"\nTest {'Succeeded' if success else 'Failed'}") 