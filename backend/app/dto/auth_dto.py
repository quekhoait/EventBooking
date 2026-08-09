from marshmallow import ValidationError, fields, validate

from app.dto import BaseSchema


class RegisterDto(BaseSchema):
    username = fields.String(required=True)
    email = fields.Email(required=True)
    password = fields.String(required=True)
    role = fields.String(required=True, validate=validate.OneOf(["admin", "user"]))
    confirm_password = fields.String(required=True)

    def validate_password(self, data, **kwargs):
        if data["password"] != data["confirm_password"]:
            raise ValidationError(
                "Passwords do not match", field_name="confirm_password"
            )


class VerifyEmailDto(BaseSchema):
    email = fields.Email(required=True)
    verification_code = fields.String(required=True)


class LoginDto(BaseSchema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class UserProviderDto(BaseSchema):
    provider = fields.String(
        required=True, validate=validate.OneOf(["google", "email"])
    )
    provider_id = fields.String(required=True)
    refresh_token = fields.String(required=False, allow_none=True)
