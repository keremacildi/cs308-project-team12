# app_backend/tests.py
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Category, Distributor, Product, ShoppingCartItem

class HomeViewTest(TestCase):
    def test_home_view(self):
        """Test that the home view returns 200 and contains the welcome message."""
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Welcome to the backend API")

class ProductListViewTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.distributor = Distributor.objects.create(name="Test Distributor", contact_info="Info")
        self.product = Product.objects.create(
            name="Test Product",
            model="TP-1",
            serial_number="SN0001",
            description="A test product",
            quantity_in_stock=10,
            price=100.00,
            warranty_status=True,
            distributor=self.distributor,
            category=self.category,
            popularity=1,
        )

    def test_product_list_view(self):
        """Test that product list view returns 200 and includes the product name."""
        response = self.client.get(reverse('product_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.product.name)

class CheckoutViewTest(TestCase):
    def setUp(self):
        # Create a test user and login
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.login(username='testuser', password='testpass')

        # Create related objects
        self.category = Category.objects.create(name="Gadgets")
        self.distributor = Distributor.objects.create(name="Distributor A", contact_info="Contact Info")
        self.product = Product.objects.create(
            name="Checkout Product",
            model="CP-1",
            serial_number="SN0002",
            description="A product for checkout testing",
            quantity_in_stock=10,
            price=50.00,
            warranty_status=False,
            distributor=self.distributor,
            category=self.category,
            popularity=2,
        )

        # Add the product to the shopping cart
        ShoppingCartItem.objects.create(user=self.user, product=self.product, quantity=2)

    def test_checkout_view(self):
        """
        Test the checkout process:
        - The response should be 200 (success).
        - The product stock should be reduced.
        - The shopping cart should be cleared.
        """
        response = self.client.get(reverse('checkout'))
        self.assertEqual(response.status_code, 200)
        # Refresh product from database and verify that stock decreased by 2.
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 8)
        # Additional checks: Verify that an order was created; 
        # you might query your Order model if you have imported it here.
