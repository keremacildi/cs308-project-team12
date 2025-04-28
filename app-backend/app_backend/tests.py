from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Product, Category, Order, OrderItem, Rating, Comment
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    OrderSerializer,
    OrderItemSerializer,
    RatingSerializer,
    CommentSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer
)
from decimal import Decimal
from rest_framework.test import APITestCase
from rest_framework import status
import json
# python manage.py test app_backend.tests.SerializerTest
# python manage.py test app_backend.tests
class ProductModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )

    def test_product_creation(self):
        """Test if product is created correctly"""
        self.assertEqual(self.product.title, "Test Product")
        self.assertEqual(self.product.quantity_in_stock, 10)
        self.assertEqual(self.product.price, Decimal('99.99'))

    def test_product_cost_calculation(self):
        """Test automatic cost calculation"""
        self.assertEqual(self.product.cost, Decimal('49.995'))

    def test_product_availability(self):
        """Test product availability property"""
        self.assertTrue(self.product.is_available)
        self.product.quantity_in_stock = 0
        self.assertFalse(self.product.is_available)

class OrderModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.order = Order.objects.create(
            user=self.user,
            total_price=Decimal('199.98')
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price_at_purchase=Decimal('99.99')
        )

    def test_order_creation(self):
        """Test if order is created correctly"""
        self.assertEqual(self.order.user, self.user)
        self.assertEqual(self.order.total_price, Decimal('199.98'))
        self.assertEqual(self.order.status, 'processing')

    def test_order_item_creation(self):
        """Test if order item is created correctly"""
        self.assertEqual(self.order_item.quantity, 2)
        self.assertEqual(self.order_item.price_at_purchase, Decimal('99.99'))

class RatingModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.rating = Rating.objects.create(
            user=self.user,
            product=self.product,
            score=5
        )

    def test_rating_creation(self):
        """Test if rating is created correctly"""
        self.assertEqual(self.rating.score, 5)
        self.assertEqual(self.rating.user, self.user)
        self.assertEqual(self.rating.product, self.product)

    def test_rating_unique_constraint(self):
        """Test unique constraint for user-product rating"""
        with self.assertRaises(Exception):
            Rating.objects.create(
                user=self.user,
                product=self.product,
                score=4
            )

class CommentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.comment = Comment.objects.create(
            user=self.user,
            product=self.product,
            text="Test comment"
        )

    def test_comment_creation(self):
        """Test if comment is created correctly"""
        self.assertEqual(self.comment.text, "Test comment")
        self.assertEqual(self.comment.user, self.user)
        self.assertEqual(self.comment.product, self.product)
        self.assertFalse(self.comment.approved)

class ProductAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.client.force_authenticate(user=self.user)

    def test_get_all_products(self):
        """Test retrieving all products"""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_product_detail(self):
        """Test retrieving a specific product"""
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "Test Product")

    def test_product_search(self):
        """Test product search functionality"""
        response = self.client.get('/api/products/search/?q=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Test Product")

    def test_product_filter_by_category(self):
        """Test filtering products by category"""
        response = self.client.get(f'/api/products/?category={self.category.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['category']['id'], self.category.id)

class OrderAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.client.force_authenticate(user=self.user)

    def test_create_order(self):
        """Test creating a new order"""
        data = {
            "user": self.user.id,
            "delivery_address": "Test Address",
            "order_items": [
                {
                    "product": self.product.id,
                    "quantity": 2,
                    "price_at_purchase": "99.99"
                }
            ],
            "total_price": "199.98"
        }
        response = self.client.post('/api/orders/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

    def test_get_order_history(self):
        """Test retrieving order history"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal('199.98')
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price_at_purchase=Decimal('99.99')
        )
        response = self.client.get('/api/orders/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_cancel_order(self):
        """Test order cancellation"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal('199.98'),
            status='processing'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price_at_purchase=Decimal('99.99')
        )
        response = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')

    def test_refund_order(self):
        """Test order refund"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal('199.98'),
            status='delivered'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price_at_purchase=Decimal('99.99')
        )
        initial_stock = self.product.quantity_in_stock
        response = self.client.post(f'/api/orders/{order.id}/refund/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(order.status, 'refunded')
        self.assertEqual(self.product.quantity_in_stock, initial_stock + 2)

class RatingAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.client.force_authenticate(user=self.user)

    def test_create_rating(self):
        """Test creating a new rating"""
        data = {
            "product_id": self.product.id,
            "user_id": self.user.id,
            "rating": 5
        }
        response = self.client.post('/api/ratings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Rating.objects.count(), 1)

    def test_update_rating(self):
        """Test updating an existing rating"""
        rating = Rating.objects.create(
            user=self.user,
            product=self.product,
            score=3
        )
        data = {
            "product_id": self.product.id,
            "user_id": self.user.id,
            "rating": 4
        }
        response = self.client.post('/api/ratings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rating.refresh_from_db()
        self.assertEqual(rating.score, 4)

class CommentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.client.force_authenticate(user=self.user)

    def test_create_comment(self):
        """Test creating a new comment"""
        data = {
            "product_id": self.product.id,
            "user_id": self.user.id,
            "comment_text": "Test comment"
        }
        response = self.client.post('/api/comments/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)

    def test_get_product_comments(self):
        """Test retrieving comments for a product"""
        Comment.objects.create(
            user=self.user,
            product=self.product,
            text="Test comment",
            approved=True
        )
        response = self.client.get(f'/api/products/{self.product.id}/comments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

class AuthenticationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )

    def test_user_registration(self):
        """Test user registration"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpass123",
            "first_name": "New",
            "last_name": "User"
        }
        response = self.client.post('/api/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_user_login(self):
        """Test user login"""
        data = {
            "email": "test@example.com",
            "password": "testpass123"
        }
        response = self.client.post('/api/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)

    def test_password_change(self):
        """Test password change"""
        self.client.force_authenticate(user=self.user)
        data = {
            "user": self.user.id,
            "old_password": "testpass123",
            "new_password": "newpass123",
            "confirm_password": "newpass123"
        }
        response = self.client.post('/api/change-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.user.check_password("newpass123"))

    def test_forgot_password(self):
        """Test forgot password functionality"""
        data = {
            "email": "test@example.com"
        }
        response = self.client.post('/api/forgot-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_reset_password(self):
        """Test password reset functionality"""
        # First get a reset token
        self.user.reset_token = "test_token"
        self.user.save()
        
        data = {
            "token": "test_token",
            "new_password": "newpass123"
        }
        response = self.client.post('/api/reset-password/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpass123"))

class SerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            title="Test Product",
            model="Test Model",
            serial_number="TEST123",
            description="Test Description",
            quantity_in_stock=10,
            price=Decimal('99.99'),
            category=self.category
        )
        self.order = Order.objects.create(
            user=self.user,
            total_price=Decimal('199.98')
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            price_at_purchase=Decimal('99.99')
        )
        self.rating = Rating.objects.create(
            user=self.user,
            product=self.product,
            score=5
        )
        self.comment = Comment.objects.create(
            user=self.user,
            product=self.product,
            text="Test comment"
        )

    def test_category_serializer(self):
        """Test CategorySerializer"""
        serializer = CategorySerializer(self.category)
        self.assertEqual(serializer.data['id'], self.category.id)
        self.assertEqual(serializer.data['name'], "Test Category")

    def test_product_serializer(self):
        """Test ProductSerializer"""
        serializer = ProductSerializer(self.product)
        self.assertEqual(serializer.data['title'], "Test Product")
        self.assertEqual(serializer.data['model'], "Test Model")
        self.assertEqual(serializer.data['price'], "99.99")
        self.assertTrue(serializer.data['is_available'])
        self.assertEqual(serializer.data['stock'], 10)
        self.assertEqual(serializer.data['rating'], 5.0)

    def test_order_serializer(self):
        """Test OrderSerializer"""
        serializer = OrderSerializer(self.order)
        self.assertEqual(serializer.data['id'], self.order.id)
        self.assertEqual(serializer.data['total_price'], "199.98")
        self.assertEqual(serializer.data['status'], 'processing')
        self.assertEqual(len(serializer.data['items']), 1)

    def test_order_item_serializer(self):
        """Test OrderItemSerializer"""
        serializer = OrderItemSerializer(self.order_item)
        self.assertEqual(serializer.data['quantity'], 2)
        self.assertEqual(serializer.data['price_at_purchase'], "99.99")
        self.assertEqual(serializer.data['product']['title'], "Test Product")

    def test_rating_serializer(self):
        """Test RatingSerializer"""
        serializer = RatingSerializer(self.rating)
        self.assertEqual(serializer.data['score'], 5)
        self.assertEqual(serializer.data['user_details']['username'], 'testuser')
        self.assertEqual(serializer.data['product_details']['title'], 'Test Product')

    def test_comment_serializer(self):
        """Test CommentSerializer"""
        serializer = CommentSerializer(self.comment)
        self.assertEqual(serializer.data['text'], "Test comment")
        self.assertEqual(serializer.data['user_details']['username'], 'testuser')
        self.assertEqual(serializer.data['product_details']['title'], 'Test Product')
        self.assertFalse(serializer.data['approved'])

    def test_user_serializer(self):
        """Test UserSerializer"""
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['username'], 'testuser')
        self.assertEqual(serializer.data['email'], 'test@example.com')
        self.assertEqual(serializer.data['first_name'], 'Test')
        self.assertEqual(serializer.data['last_name'], 'User')

    def test_user_create_serializer(self):
        """Test UserCreateSerializer"""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpass123",
            "first_name": "New",
            "last_name": "User"
        }
        serializer = UserCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, "newuser")
        self.assertEqual(user.email, "newuser@example.com")
        self.assertTrue(user.check_password("newpass123"))

    def test_user_update_serializer(self):
        """Test UserUpdateSerializer"""
        data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com"
        }
        serializer = UserUpdateSerializer(self.user, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.first_name, "Updated")
        self.assertEqual(user.last_name, "Name")
        self.assertEqual(user.email, "updated@example.com") 