from mailbox import Message
from os.path import join
from datetime import datetime
from app.dto.booking_dto import CreateTicketRequestDTO, TicketResponse, TicketDetailRequest
from flask_jwt_extended import get_jwt_identity
import string
from app import db
import random

from app.dto.payment_dto import PaymentRequest
from app.errors.ErrorCode import ErrorCode
from app.models import EventModel, TicketModel, Seat, PaymentModel, PaymentStatus, EventSeat, DiscountModel
from app.services import payment_services
from app.utils.exception import AppException
from app.repositories import booking_repo, event_repo
from flask_mail import Message
from app import mail

def check_authorization():
    user_id = get_jwt_identity()
    if not user_id:
        raise AppException(ErrorCode.UNAUTHORIZED)
    return user_id

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


def create(data: CreateTicketRequestDTO):
    # user_id = check_authorization()
    user_id = 1
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
    while db.session.get(TicketModel, ticket_code) is not None:
        ticket_code = generate_random_code(8)

    new_ticket = TicketModel(
        code=ticket_code,
        user_id=user_id,
        seat_id=seat.id,
        price=final_price,
        discount_id=discount_id,
        face_image=data.face_image
    )
    try:
        db.session.add(new_ticket)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise AppException(f"Lỗi đặt vé: {str(e)}", status_code=500)

    return new_ticket


def get_by_code(code: str):
    # user_id = check_authorization()
    user_id = 1

    ticket = booking_repo.get_ticket_details(code)

    if not ticket:
        raise AppException(ErrorCode.NOT_FOUND)

    if user_id != ticket.user_id:
        raise AppException(ErrorCode.NOT_FOUND)

    return ticket

def list_tickets():
    user_id = check_authorization()
    tickets = booking_repo.get_list(user_id)
    return tickets


def send_ticket(ticket_code):
    ticket = booking_repo.get_ticket_details(ticket_code)
    body_content = f"""Xin chào {ticket.user.full_name},

    Cảm ơn bạn đã đặt vé. Dưới đây là thông tin chi tiết vé của bạn:

    ----------------------------------------
    - Mã vé: {ticket.code}
    - Tên sự kiện: {ticket.seat.event.name}
    - Thời gian: {ticket.seat.event.event_start_time}
    - Địa điểm: {ticket.seat.event}
    - Số ghế: {ticket.seat.seat_code}
    - Giá vé: {ticket.price}
    ----------------------------------------

    Vui lòng đưa mã vé này cho nhân viên khi check-in tại sự kiện.
    """
    msg = Message(
        subject=f"[EVENT] Xác nhận thông tin vé - {ticket.seat.event.name}",
        recipients=[ticket.user.email],
        body=body_content
    )
    try:
        mail.send(msg)
        return True
    except Exception as e:
        raise AppException(f"Gửi mail thất bại: {str(e)}")


def cancel_ticket(data):
    # user_id = check_authorization()
    user_id = 1
    ticket_code = data.get('ticket_code') if isinstance(data, dict) else getattr(data, 'ticket_code', None)
    ticket = booking_repo.find_ticket_by_code(ticket_code)
    if not ticket:
        raise AppException("Không tìm thấy thông tin vé!", status_code=404)

    if ticket.user_id != user_id:
        raise AppException("Bạn không có quyền hủy vé này!", status_code=403)

    return payment_services.refund(data)


