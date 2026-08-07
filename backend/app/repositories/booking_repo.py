from sqlalchemy import func
from app.models import TicketModel, PaymentModel, Seat, PaymentStatus, DiscountModel, EventSeat


def get_seat_isempty_for_event(event, seatTypeId):
    seat = Seat.query.filter(
        Seat.event_id == event.id,
        Seat.event_ticket_type_id == seatTypeId,
        Seat.is_active == True
    ).order_by(func.rand()).with_for_update().first()
    return seat

def get_price_config_for_seat(event_id, seat_type_id):
    return EventSeat.query.filter(
        EventSeat.event_id == event_id,
        EventSeat.event_ticket_type_id == seat_type_id,
    ).first()

def find_discount_by_id(discount_id):
    return DiscountModel.query.get(discount_id)

def find_discounts_by_event_id(event_id):
    return DiscountModel.query.filter(
        DiscountModel.event_id == event_id,
    ).all()

def find_payment_by_ticket_code(ticket_code):
    return PaymentModel.query.filter(ticket_code == TicketModel.code).first()

def count_user_successful_tickets(user_id, event_id):
    return (
        TicketModel.query
        .join(Seat, TicketModel.seat_id == Seat.id)
        .join(PaymentModel, PaymentModel.ticket_code == TicketModel.code)
        .filter(
            TicketModel.user_id == user_id,
            Seat.event_id == event_id,
            PaymentModel.status == PaymentStatus.SUCCESS
        )
        .count()
    )

def find_ticket_by_code(code):
    return TicketModel.query.get(code)

def save_ticket(ticket):
    from app import db
    db.session.add(ticket)