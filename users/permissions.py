from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    """
    Only allows users with role 'Owner' to access the view.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'Owner'
        )

class IsStudent(BasePermission):
    """
    Only allows users with role 'Student' to access the view.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'Student'
        )