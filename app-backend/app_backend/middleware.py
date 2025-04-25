from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import PermissionDenied
from django.http import Http404
import logging

logger = logging.getLogger(__name__)

class APIErrorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
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