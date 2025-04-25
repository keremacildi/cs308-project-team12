from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from app_backend.models import Product, Category, Distributor, ShoppingCartItem, Order, Delivery
from decimal import Decimal
import json

class CartAndOrderTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
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
        self.cart_url = '/api/cart/'
        self.add_to_cart_url = f'/api/cart/add/{self.product.id}/'
        self.orders_url = '/api/orders/'
        
        # Login the test user
        self.client.login(username='testuser', password='testpass123')

    def test_add_to_cart(self):
        """Test adding item to cart"""
        response = self.client.post(
            self.add_to_cart_url,
            data=json.dumps({'quantity': 2}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ShoppingCartItem.objects.filter(
                user=self.user,
                product=self.product,
                quantity=2
            ).exists()
        )

    def test_view_cart(self):
        """Test viewing cart contents"""
        # Add item to cart first
        ShoppingCartItem.objects.create(
            user=self.user,
            product=self.product,
            quantity=2
        )
        response = self.client.get(self.cart_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) > 0)

    def test_update_cart_item(self):
        """Test updating cart item quantity"""
        cart_item = ShoppingCartItem.objects.create(
            user=self.user,
            product=self.product,
            quantity=2
        )
        update_url = f'/api/cart/update/{cart_item.id}/'
        response = self.client.patch(
            update_url,
            data=json.dumps({'quantity': 3}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 3)

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        cart_item = ShoppingCartItem.objects.create(
            user=self.user,
            product=self.product,
            quantity=2
        )
        remove_url = f'/api/cart/remove/{cart_item.id}/'
        response = self.client.delete(remove_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            ShoppingCartItem.objects.filter(id=cart_item.id).exists()
        )

    def test_create_order(self):
        """Test creating a new order"""
        # Add item to cart first
        ShoppingCartItem.objects.create(
            user=self.user,
            product=self.product,
            quantity=2
        )
        order_data = {
            'delivery_address': '123 Test St',
            'items': [
                {
                    'id': self.product.id,
                    'quantity': 2,
                    'price': str(self.product.price)
                }
            ],
            'total': str(self.product.price * 2)
        }
        response = self.client.post(
            self.orders_url,
            data=json.dumps(order_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Check if order was created
        self.assertTrue(Order.objects.filter(user=self.user).exists())
        # Check if cart was cleared
        self.assertFalse(ShoppingCartItem.objects.filter(user=self.user).exists())

    def test_view_order_history(self):
        """Test viewing order history"""
        # Create a test order first
        order = Order.objects.create(
            user=self.user,
            total_price=200.00
        )
        # Create associated delivery
        Delivery.objects.create(
            order=order,
            delivery_address='123 Test St'
        )
        response = self.client.get(f'{self.orders_url}history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.json()) > 0)

    def test_cancel_order(self):
        """Test canceling an order"""
        order = Order.objects.create(
            user=self.user,
            total_price=200.00
        )
        # Create associated delivery
        Delivery.objects.create(
            order=order,
            delivery_address='123 Test St'
        )
        response = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled') 