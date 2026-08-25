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
    price = fields.Float(dump_only=True)
    discount_id = fields.Int(dump_only=True, allow_none=True)



class TicketDetailRequest(BaseSchema):
    code = fields.Str(required=True)

class UserDetailResponse(BaseSchema):
    full_name = fields.Str(required=True)
    phone_number = fields.Str(required=True)
    email = fields.Str(required=True)

class DiscountDetailResponse(BaseSchema):
    code = fields.Str(required=True)
    value = fields.Float(required=True)
    unit = fields.Str(required=True)

class LocationSchema(BaseSchema):
    id = fields.Int()
    name = fields.Str()
    address = fields.Str()

class EventDetailSchema(BaseSchema):
    id = fields.Int()
    name = fields.Str()
    image = fields.Str()
    description = fields.Str()
    event_start_time = fields.DateTime()
    event_end_time = fields.DateTime()
    location_name = fields.Str()
    location = fields.Nested(LocationSchema)

class SeatSchema(BaseSchema):
    id = fields.Int()
    seat_code = fields.Str()
    event = fields.Nested(EventDetailSchema) # Lồng Event vào trong Seat

class TicketDetailResponse(BaseSchema):
    code = fields.Str()
    price = fields.Float()
    status = fields.Str()
    seat = fields.Nested(SeatSchema)
    discount = fields.Nested(DiscountDetailResponse, dump_only=True)
    user = fields.Nested(UserDetailResponse, dump_only=True)

#lịch sử
class TicketListResponse(BaseSchema):
    code = fields.Str()
    price = fields.Float()
    status = fields.Str()
    seat = fields.Nested(SeatSchema)