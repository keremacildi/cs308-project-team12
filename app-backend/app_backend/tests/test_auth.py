from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
import json

class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        self.user = User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='existing123'
        )

    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.user_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_user_registration_duplicate_username(self):
        """Test registration with existing username"""
        self.user_data['username'] = 'existinguser'
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.user_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        """Test successful user login"""
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'existing@example.com',
                'password': 'existing123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.json())
        self.assertIn('email', response.json())
        self.assertIn('username', response.json())

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'email': 'existing@example.com',
                'password': 'wrongpass'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_missing_fields(self):
        """Test login with missing fields"""
        response = self.client.post(
            self.login_url,
            data=json.dumps({'email': 'existing@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 