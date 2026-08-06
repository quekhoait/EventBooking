from app.dto import BaseSchema
from marshmallow import fields

class BookingRequest(BaseSchema):
    event_id = fields.Integer(required=True, error_messages={'required': 'Show ID is required'})
    seat_id = fields.Integer(required=True, error_messages={'required': 'Seat ID is required'})
    #user
    ticket_type_id = fields.Integer(required=True, error_messages={'required': 'TicketType ID is required'})
    discount_id = fields.Integer(required=True, error_messages={'required': 'TicketType ID is required'})   