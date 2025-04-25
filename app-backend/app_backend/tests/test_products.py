from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from app_backend.models import Product, Category, Distributor
from decimal import Decimal
import json

class ProductTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        
        # Create test category and distributor
        self.category = Category.objects.create(name="Electronics")
        self.distributor = Distributor.objects.create(
            name="Test Distributor",
            contact_info="test@distributor.com"
        )
        
        # Create test product
        self.product = Product.objects.create(
            name="Test Product",
            model="TP-1",
            serial_number="SN0001",
            description="A test product",
            quantity_in_stock=10,
            price=Decimal('100.00'),
            warranty_status=True,
            distributor=self.distributor,
            category=self.category,
            popularity=1
        )
        
        # URLs
        self.products_url = '/api/products/'
        self.product_detail_url = f'/api/products/{self.product.id}/'
        self.search_url = '/api/search/'
        # Admin URLs
        self.admin_products_url = '/api/admin/products/'
        self.admin_product_detail_url = f'/api/admin/products/{self.product.id}/'
        self.admin_create_product_url = '/api/admin/products/create/'

    def test_get_products_list(self):
        """Test getting list of products"""
        response = self.client.get(self.products_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) > 0)

    def test_get_product_detail(self):
        """Test getting single product details"""
        response = self.client.get(self.product_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], 'Test Product')

    def test_search_products(self):
        """Test searching products"""
        response = self.client.get(f'{self.search_url}?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()['products']) > 0)

    def test_filter_products_by_category(self):
        """Test filtering products by category"""
        response = self.client.get(f'{self.products_url}?category=Electronics')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) > 0)

    def test_create_product_as_admin(self):
        """Test creating a new product as admin"""
        self.client.login(username='admin', password='admin123')
        new_product_data = {
            'name': 'New Product',
            'model': 'NP-1',
            'serial_number': 'SN0002',
            'description': 'A new test product',
            'quantity_in_stock': 5,
            'price': str(Decimal('200.00')),
            'warranty_status': True,
            'distributor_id': self.distributor.id,
            'category_id': self.category.id
        }
        response = self.client.post(
            self.admin_create_product_url,
            data=json.dumps(new_product_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_product_as_admin(self):
        """Test updating a product as admin"""
        self.client.login(username='admin', password='admin123')
        update_data = {'price': str(Decimal('150.00'))}
        response = self.client.put(
            f'{self.admin_product_detail_url}update/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['price'], '150.00')

    def test_delete_product_as_admin(self):
        """Test deleting a product as admin"""
        self.client.login(username='admin', password='admin123')
        response = self.client.delete(f'{self.admin_product_detail_url}delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists()) 