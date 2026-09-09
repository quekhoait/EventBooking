from marshmallow import ValidationError, fields, validate, validates_schema

from app.dto import BaseSchema


class RegisterRequestDto(BaseSchema):
    username = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True)
    role = fields.String(
        required=True, validate=validate.OneOf(["admin", "user", "pending"])
    )
    confirm_password = fields.String(required=True)

    @validates_schema
    def validate_password(self, data, **kwargs):
        if data["password"] != data["confirm_password"]:
            raise ValidationError(
                "Passwords do not match", field_name="confirm_password"
            )


class VerifyEmailRequestDto(BaseSchema):
    email = fields.Email(required=True)
    verification_code = fields.String(required=True)


class ResendOTPRequestDto(BaseSchema):
    email = fields.Email(required=True)


class LoginRequestDto(BaseSchema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserProviderRequestDto(BaseSchema):
    provider = fields.String(
        required=True, validate=validate.OneOf(["google", "email"])
    )
    provider_id = fields.String(required=True)
    refresh_token = fields.String(required=False, allow_none=True)
