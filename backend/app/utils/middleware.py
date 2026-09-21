from flask_jwt_extended import get_jwt_identity

from app.errors.error_code import ErrorCode
from app.models import RoleEnum, User
from app.repositories.base_repo import get_by_id
from app.utils.exception import AppException


def require_organizer() -> User:
    """Kiểm tra quyền organizer (ADMIN/STAFF, active, thuộc công ty) và trả về user."""
    identity = get_jwt_identity()
    if identity is None:
        raise AppException(ErrorCode.UNAUTHORIZED)

    user = get_by_id(User, int(identity))
    if user is None:
        raise AppException(ErrorCode.USER_NOT_FOUND)
    if not user.is_active:
        raise AppException(ErrorCode.ACCOUNT_LOCKED)
    if user.role not in (RoleEnum.ADMIN, RoleEnum.STAFF):
        raise AppException(ErrorCode.FORBIDDEN)
    if not user.company_id:
        raise AppException(ErrorCode.USER_NOT_IN_COMPANY)
    return user