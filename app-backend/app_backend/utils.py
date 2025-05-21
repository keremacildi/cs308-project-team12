import re
import logging
import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Encryption utilities for sensitive data
class EncryptionManager:
    """
    Utility class for encrypting and decrypting sensitive data using Fernet (AES).
    """
    def __init__(self):
        # Get or generate a secret key
        self.secret_key = self._get_or_create_key()
        # Initialize Fernet cipher
        self.cipher = Fernet(self.secret_key)
    
    def _get_or_create_key(self):
        """
        Get the encryption key from settings or generate a new one.
        In production, this key should be stored securely (e.g., environment variables).
        """
        # Try to get key from settings
        encryption_key = getattr(settings, 'ENCRYPTION_KEY', None)
        
        if not encryption_key:
            # For development only: generate a key if not found
            # In production, this should raise an error instead
            salt = b'cs308_store_salt'  # Use a secure random salt in production
            password = b'temporary_dev_password'  # Use a secure password in production
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            
            key = base64.urlsafe_b64encode(kdf.derive(password))
            logger.warning("Using dynamically generated encryption key. Set ENCRYPTION_KEY in settings for production.")
            return key
        
        # If key is provided as a string, convert it to bytes
        if isinstance(encryption_key, str):
            encryption_key = encryption_key.encode()
        
        # Ensure the key is properly base64 encoded for Fernet
        try:
            # If it's already a valid Fernet key, use it directly
            Fernet(encryption_key)
            return encryption_key
        except Exception:
            # If not, derive a valid key from it
            salt = b'cs308_store_salt'
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            return base64.urlsafe_b64encode(kdf.derive(encryption_key))
    
    def encrypt(self, data):
        """
        Encrypt data using Fernet symmetric encryption.
        
        Args:
            data: String data to encrypt
            
        Returns:
            Encrypted data as a string
        """
        if not data:
            return data
        
        # Convert data to bytes if it's a string
        if isinstance(data, str):
            data = data.encode('utf-8')
        
        # Encrypt the data
        encrypted_data = self.cipher.encrypt(data)
        
        # Return as a string for storage
        return encrypted_data.decode('utf-8')
    
    def decrypt(self, encrypted_data):
        """
        Decrypt data that was encrypted with Fernet.
        
        Args:
            encrypted_data: Encrypted data as a string
            
        Returns:
            Decrypted data as a string
        """
        if not encrypted_data:
            return encrypted_data
        
        # Convert to bytes if it's a string
        if isinstance(encrypted_data, str):
            encrypted_data = encrypted_data.encode('utf-8')
        
        try:
            # Decrypt the data
            decrypted_data = self.cipher.decrypt(encrypted_data)
            
            # Return as a string
            return decrypted_data.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            return None

# Initialize the encryption manager
encryption_manager = EncryptionManager()

def encrypt_sensitive_data(data):
    """
    Encrypt sensitive data.
    """
    return encryption_manager.encrypt(data)

def decrypt_sensitive_data(encrypted_data):
    """
    Decrypt sensitive data.
    """
    return encryption_manager.decrypt(encrypted_data)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for REST framework that improves security
    by not exposing detailed error information in production.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If response is None, there was an unhandled exception
    if response is None:
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Customize the response for better security
    if response.status_code == 500:
        # Don't expose details of 500 errors
        response.data = {'error': 'An internal server error occurred'}
    
    # Log all 4xx and 5xx errors
    if response.status_code >= 400:
        request = context.get('request')
        logger.warning(
            f"API error: {response.status_code} at {request.path if request else 'unknown'}"
        )
    
    return response

def validate_email(email):
    """
    Validate email format and check for common injection patterns.
    """
    if not email:
        raise ValidationError("Email is required")
    
    # Basic email format validation
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format")
    
    # Check for common email injection patterns
    dangerous_patterns = [
        r'\s',       # Whitespace
        r';',        # Command injection
        r'--',       # SQL comment
        r'\/\*',     # SQL comment start
        r'\*\/',     # SQL comment end
        r'@.*@',     # Multiple @ symbols
        r'<script',  # XSS attempt
        r'javascript:',  # XSS attempt
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, email, re.IGNORECASE):
            logger.warning(f"Potentially malicious email detected: {email}")
            raise ValidationError("Invalid email format")
    
    return email

def validate_username(username):
    """
    Validate username format and check for injection patterns.
    """
    if not username:
        raise ValidationError("Username is required")
    
    # Username should be alphanumeric with underscores and hyphens
    if not re.match(r'^[a-zA-Z0-9_-]{3,30}$', username):
        raise ValidationError("Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens")
    
    # Check for common SQL injection patterns
    dangerous_patterns = [
        r'--',       # SQL comment
        r'\/\*',     # SQL comment start
        r'\*\/',     # SQL comment end
        r';',        # Command injection
        r'=',        # Equals operator
        r'\'',       # Single quote
        r'"',        # Double quote
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, username):
            logger.warning(f"Potentially malicious username detected: {username}")
            raise ValidationError("Invalid username format")
    
    return username

def validate_password(password):
    """
    Validate password strength.
    """
    if not password:
        raise ValidationError("Password is required")
    
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    
    # Check for at least one uppercase letter, one lowercase letter, one digit, and one special character
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")
    
    if not re.search(r'[0-9]', password):
        raise ValidationError("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one special character")
    
    return password

def validate_text_input(text, field_name="Text", min_length=1, max_length=1000):
    """
    Validate general text input for comments, descriptions, etc.
    """
    if text is None:
        raise ValidationError(f"{field_name} is required")
    
    if len(text) < min_length:
        raise ValidationError(f"{field_name} must be at least {min_length} characters long")
    
    if len(text) > max_length:
        raise ValidationError(f"{field_name} cannot exceed {max_length} characters")
    
    # Check for potentially dangerous HTML/script tags
    if re.search(r'<script|javascript:|<iframe|<img|onerror|onload|onclick|alert\(', text, re.IGNORECASE):
        logger.warning(f"Potentially malicious content detected in {field_name}: {text[:100]}")
        raise ValidationError(f"{field_name} contains disallowed content")
    
    return text

def validate_numeric_input(value, field_name="Value", min_value=None, max_value=None):
    """
    Validate numeric input.
    """
    try:
        # Try to convert to float
        numeric_value = float(value)
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} must be a valid number")
    
    if min_value is not None and numeric_value < min_value:
        raise ValidationError(f"{field_name} must be at least {min_value}")
    
    if max_value is not None and numeric_value > max_value:
        raise ValidationError(f"{field_name} cannot exceed {max_value}")
    
    return numeric_value

def validate_id(id_value, field_name="ID"):
    """
    Validate ID inputs to prevent SQL injection.
    """
    try:
        # Try to convert to integer
        id_int = int(id_value)
        if id_int <= 0:
            raise ValidationError(f"{field_name} must be a positive integer")
        return id_int
    except (ValueError, TypeError):
        raise ValidationError(f"{field_name} must be a valid integer") 