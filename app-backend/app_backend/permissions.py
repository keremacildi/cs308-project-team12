from rest_framework.permissions import BasePermission

class IsStaff(BasePermission):
    """
    Allows access only to staff members.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff 

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'customer'

class IsProductManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'product_manager'

class IsSalesManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'sales_manager' 