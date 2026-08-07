from marshmallow import Schema, fields, validate

from app.dto import BaseSchema


class CreateTicketRequestDTO(BaseSchema):
    user_id = fields.Int(required=True, error_messages={"required": "user_id là bắt buộc"})
    event_id = fields.Int(required=True, error_messages={"required": "seat_id là bắt buộc"})
    discount_id = fields.Int(required=False, allow_none=True)
    seat_type_id = fields.Int(required=False, allow_none=True, load_default=None)

class TicketResponse(BaseSchema):
    code = fields.Str(dump_only=True)
    user_id = fields.Int(dump_only=True)
    seat_id = fields.Int(dump_only=True)
    purchase_time = fields.DateTime(dump_only=True, format="%Y-%m-%dT%H:%M:%S")
    price = fields.Float(dump_only=True)
    discount_id = fields.Int(dump_only=True, allow_none=True)

    # payments = fields.Nested('PaymentResponseDTO', many=True, dump_only=True)
