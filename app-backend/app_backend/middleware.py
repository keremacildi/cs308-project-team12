from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import PermissionDenied
from django.http import Http404
import logging
import re
import html
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class APIErrorMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        logger.error(f"Exception: {exception}")
        logger.error(f"Request: {request}")
        if isinstance(exception, Http404):
            return Response(
                {'error': 'Resource not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        elif isinstance(exception, PermissionDenied):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        else:
            logger.error(f"API Error: {str(exception)}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InputSanitizationMiddleware(MiddlewareMixin):
    """
    Middleware to sanitize input data to prevent XSS and SQL injection attacks.
    """
    # Common SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r'(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)(\s|$)',
        r'(\s|^)(UNION|JOIN|AND|OR)(\s|$).*?SELECT',
        r'--',
        r'\/\*.*?\*\/',
        r';.*?($|SELECT|INSERT|UPDATE|DELETE|DROP)',
        r'(\'|").*?(\'|")\s*?[=<>]',
    ]
    
    # Fields that should be excluded from sanitization (like passwords)
    EXCLUDED_FIELDS = ['password', 'confirm_password']
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Compile regex patterns for performance
        self.sql_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.SQL_INJECTION_PATTERNS]
    
    def process_request(self, request):
        """
        Process and sanitize request data before it reaches the view.
        """
        # Only process POST, PUT, PATCH requests with content
        if request.method in ['POST', 'PUT', 'PATCH'] and request.content_type == 'application/json':
            try:
                if hasattr(request, 'body') and request.body:
                    body = request.body.decode('utf-8')
                    data = json.loads(body)
                    sanitized_data = self.sanitize_data(data)
                    # Replace the request body with sanitized data
                    request._body = json.dumps(sanitized_data).encode('utf-8')
                    
                    # Log potential attacks
                    if self.contains_suspicious_patterns(body):
                        client_ip = self.get_client_ip(request)
                        logger.warning(
                            f"Potential attack detected from {client_ip}. "
                            f"Sanitized input: {body[:100]}..."
                        )
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                logger.warning(f"Error processing request body: {str(e)}")
        
        return None
    
    def sanitize_data(self, data):
        """
        Recursively sanitize all string values in the data structure.
        """
        if isinstance(data, dict):
            return {k: self.sanitize_data(v) if k not in self.EXCLUDED_FIELDS else v 
                   for k, v in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_data(item) for item in data]
        elif isinstance(data, str):
            return self.sanitize_string(data)
        else:
            return data
    
    def sanitize_string(self, value):
        """
        Sanitize a string value to prevent XSS attacks.
        """
        # HTML escape to prevent XSS
        return html.escape(value)
    
    def contains_suspicious_patterns(self, value):
        """
        Check if the value contains suspicious patterns indicating SQL injection.
        """
        if not isinstance(value, str):
            return False
        
        for pattern in self.sql_patterns:
            if pattern.search(value):
                return True
        return False
    
    def get_client_ip(self, request):
        """
        Get the client IP address from the request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 