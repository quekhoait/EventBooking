from mailbox import Message
from os.path import join
from datetime import datetime
from app.dto.booking_dto import CreateTicketRequestDTO, TicketResponse, TicketDetailRequest
from flask_jwt_extended import get_jwt_identity
import string
from app import db
import random
from app.errors.ErrorCode import ErrorCode
from app.models import EventModel, TicketModel, Seat, PaymentModel, PaymentStatus, EventSeat, DiscountModel
from app.utils.exception import AppException
from app.repositories import booking_repo, event_repo
from flask_mail import Message
from app import mail

def generate_random_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def get_price_for_seat(event, seatTypeId):
    price_config = booking_repo.get_price_config_for_seat(event.id, seatTypeId)
    if not price_config:
        raise AppException("Chưa có cấu hình cho vé này", status_code=400)
    return price_config.price

def use_discount(discount_id, price):
    if not discount_id:
        return price, None
    discount = booking_repo.find_discount_by_id(discount_id)
    if not discount:
        return price, None
    now = datetime.now()
    if discount.start_time <= now <= discount.end_time:
        if discount.unit == '%':
            final_price = price * (1 - (discount.value / 100))
        else:
            final_price = max(0.0, price - discount.value)
        return final_price, discount.id

    return price, None


def check_payment(ticket_code):
    payment = booking_repo.find_payment_by_ticket_code(ticket_code)
    if not payment:
        raise AppException("Mi chưa thanh toán", status_code=400)
    return payment

def create(data: CreateTicketRequestDTO):
    # user_id = get_jwt_identity
    user_id = 1
    # if not user_id:
    #     raise AppException(ErrorCode.USER_NOT_FOUND)
    event = event_repo.find_event_by_id(data.event_id)
    if not event:
        raise AppException(ErrorCode.NOT_FOUND)
    if event.max_per_user:
        user_ticket_count = booking_repo.count_user_successful_tickets(user_id, data.event_id)
        if user_ticket_count >= event.max_per_user:
            raise AppException("Bạn đã đặt đủ số vé cho phép", status_code=400)
    seat = booking_repo.get_seat_isempty_for_event(event, seatTypeId=data.seat_type_id)
    if not seat:
        raise AppException("Loại vé này đết còn", status_code=400)
    price_config = get_price_for_seat(event, seatTypeId=data.seat_type_id)
    discount_id_input = getattr(data, 'discount_id', None)
    final_price, discount_id = use_discount(discount_id_input, price_config)

    ticket_code = generate_random_code(8)
    while TicketModel.query.get(ticket_code):
        ticket_code = generate_random_code(8)

    new_ticket = TicketModel(
        code=ticket_code,
        user_id=user_id,
        seat_id=seat.id,
        price=final_price,
        discount_id=discount_id,
    )
    try:
        db.session.add(new_ticket)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise AppException(f"Lỗi đặt vé: {str(e)}", status_code=500)
    return new_ticket

def get_by_code(data: TicketResponse):
    # user_id = get_jwt_identity
    user_id = 1
    # if not user_id:
    #     raise AppException(ErrorCode.USER_NOT_FOUND)

    ticket = booking_repo.get_ticket_details(data.code)
    if not ticket:
        raise AppException(ErrorCode.NOT_FOUND)
    # if user_id != ticket.user_id:
    #     raise AppException(ErrorCode.NOT_FOUND)
    return ticket

def list_tickets():
    # user_id = get_jwt_identity()
    user_id = 1
    # if not user_id:
    #     raise AppException(ErrorCode.USER_NOT_FOUND)
    tickets = booking_repo.get_list(user_id)
    return tickets



