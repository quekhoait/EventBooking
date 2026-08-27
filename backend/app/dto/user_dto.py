from marshmallow import Schema, fields, validate

from app.dto import BaseSchema
from app.models.UserModel import UserPreference


class UserProfileDto(BaseSchema):
    full_name = fields.String(required=False, validate=validate.Length(min=5, max=30))
    phone_number = fields.String(
        required=False,
        validate=validate.Regexp(
            r"^\+?\d{10,15}$", error="Invalid phone number format"
        ),
    )
    avatar = fields.String(required=False, allow_none=True)
    username = fields.String(required=False, validate=validate.Length(min=3, max=50))


class UserResponseDto(BaseSchema):
    id = fields.Integer(required=True)
    username = fields.String(required=True)
    full_name = fields.String(required=False)
    phone_number = fields.String(required=False)
    email = fields.Email(required=True)
    avatar = fields.String(required=False, allow_none=True)
    role = fields.String(required=True)
    is_active = fields.Boolean(required=True)
    is_verified = fields.Boolean(required=True)
    has_preferences = fields.Boolean(required=True)

    def get_role_name(self, obj):
        val = getattr(obj, "role", "USER")
        val = getattr(val, "value", val)
        return str(val).replace("RoleEnum.", "").upper()

    def get_has_preferences(self, obj):
        # 1. Nếu obj là dict có sẵn has_preferences
        if isinstance(obj, dict) and "has_preferences" in obj:
            return bool(obj["has_preferences"])

        # 2. Lấy ID người dùng
        user_id = getattr(obj, "id", None) or (
            obj.get("id") if isinstance(obj, dict) else None
        )
        if not user_id:
            return False

        # 3. Query trực tiếp từ DB để đảm bảo chính xác 100%
        try:
            count = UserPreference.query.filter_by(user_id=user_id).count()
            return count > 0
        except Exception:
            # Fallback nếu model đã nạp sẵn list
            prefs = getattr(obj, "user_preferences", None)
            return bool(prefs and len(prefs) > 0)


class CompanyRequestDto(BaseSchema):
    id = fields.Integer(allow_none=True)
    user_id = fields.Integer(allow_none=True)
    name = fields.String(required=True)
    address = fields.String(required=True)
    description = fields.String(required=True)
    tax_code = fields.String(required=True)
    location_id = fields.Integer(allow_none=True)


class CompanyResponseDto(BaseSchema):
    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    address = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    tax_code = fields.String(allow_none=True)
    location_id = fields.Integer(allow_none=True)
    is_active = fields.Boolean(required=True)


class UpdateUserPreferenceDto(BaseSchema):
    category_ids = fields.List(fields.Integer(), required=True)
