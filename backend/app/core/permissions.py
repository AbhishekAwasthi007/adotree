from fastapi import HTTPException, status
from app.models.user import UserRole

class RoleChecker:
    def __init__(self, allowed_roles: list):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user):
        # We check the role of the user (e.g. from the user model)
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {self.allowed_roles}"
            )
        return current_user

# Predefined role dependencies
verify_user = RoleChecker(["user", "farmer", "admin"])
verify_farmer = RoleChecker(["farmer", "admin"])
verify_admin = RoleChecker(["admin"])
