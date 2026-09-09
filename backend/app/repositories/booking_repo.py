from sqlalchemy import func
from sqlalchemy.orm import joinedload
from app import db
from app.models import TicketModel, PaymentModel, Seat, PaymentStatus, DiscountModel, EventSeat, EventModel


def get_seat_isempty_for_event(event, seatTypeId):

    seat = Seat.query.filter(
        Seat.event_id == event.id,
        Seat.event_ticket_type_id == seatTypeId,
        Seat.is_active == True
    ).order_by(func.random()).with_for_update().first()
    return seat

def get_price_config_for_seat(event_id, seat_type_id):
    return EventSeat.query.filter(
        EventSeat.event_id == event_id,
        EventSeat.event_ticket_type_id == seat_type_id,
    ).first()

def find_discount_by_id(discount_id):
    return db.session.get(DiscountModel, discount_id)

def get_seat(seat_id):
    return db.session.get(Seat, seat_id)

def find_discounts_by_event_id(event_id):
    return DiscountModel.query.filter(
        DiscountModel.event_id == event_id,
    ).all()

def find_discount_by_code(event_id, code):
     return DiscountModel.query.filter(
            DiscountModel.event_id == event_id,
            DiscountModel.code == code
        ).first()

def count_user_successful_tickets(user_id, event_id):
    return (
        TicketModel.query
        .join(Seat, TicketModel.seat_id == Seat.id)
        .filter(
            TicketModel.user_id == user_id,
            Seat.event_id == event_id,
            Seat.is_active == False
        )
        .count()
    )

def find_ticket_by_code(code):
    return db.session.get(TicketModel, code)

def save_ticket(ticket):
    db.session.add(ticket)

def get_ticket_details(ticket_code):
    return TicketModel.query.options(
        joinedload(TicketModel.seat)
        .joinedload(Seat.event)
        .joinedload(EventModel.location)
    ).filter(TicketModel.code == ticket_code).first()

def get_list(user_id):
    return TicketModel.query.options(
        joinedload(TicketModel.seat)
            .joinedload(Seat.event)
    ).filter(TicketModel.user_id == user_id).all()
    
def create_discount(code, value, unit, start_time, end_time, event_id):
    discount = DiscountModel(
            code=code,
            value=value,
            unit=unit,
            start_time=start_time,
            end_time=end_time,
            event_id=event_id,
        )
    db.session.add(discount)
    db.session.commit()
    db.session.refresh(discount)
    return discount
