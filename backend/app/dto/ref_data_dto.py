from marshmallow import Schema, fields
from app.dto import BaseSchema


class CategoryResponseSchema(BaseSchema):
    id = fields.Integer()
    name = fields.String()
    image = fields.String(allow_none=True)

class LocationResponseSchema(BaseSchema):
    """Schema trả về thông tin địa điểm."""
    id = fields.Integer()
    name = fields.String()
    full_name = fields.String(allow_none=True)
    parent_id = fields.Integer(allow_none=True)
    children = fields.List(fields.Nested(lambda: LocationResponseSchema()), allow_none=True)