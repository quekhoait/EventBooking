from marshmallow import Schema, fields, validate

from app.dto import BaseSchema


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
