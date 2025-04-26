#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from app_backend.models import Product, Distributor
from decimal import Decimal

# Run test
def test_product_creation():
    try:
        distributor = Distributor.objects.first()
        print(f'Distributor: {distributor}')
        
        if not distributor:
            print('No distributor found. Creating one...')
            distributor = Distributor.objects.create(name='Test Distributor', contact_info='Test Contact')
            print(f'Created distributor: {distributor}')
        
        # Try to create a product
        product = Product.objects.create(
            title='Test Product', 
            model='TEST123', 
            serial_number='SN12345678',
            description='Test Description',
            quantity_in_stock=10,
            price=Decimal('99.99'),
            distributor=distributor
        )
        
        print(f'SUCCESS: Created product: {product}')
        print(f'Product cost: {product.cost}')
        return True
    
    except Exception as e:
        print(f'ERROR: {type(e).__name__} - {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print('Testing product creation...')
    test_product_creation() 