from os.path import join
from datetime import datetime
from app.dto.booking_dto import CreateTicketRequestDTO
from flask_jwt_extended import get_jwt_identity
import string
from app import db
from sqlalchemy.sql.expression import func
import random

from app.errors.error_code import ErrorCode
from app.models import EventModel, TicketModel, Seat, PaymentModel, PaymentStatus, EventSeat, DiscountModel
from app.utils.exception import AppException

def generate_random_code(length=8):
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def get_seat_isempty_for_event(event, seatTypeId):
    seat = Seat.query.filter(
        Seat.event_id == event.id,
        Seat.event_ticket_type_id == seatTypeId,
        Seat.is_active == True
    ).order_by(func.rand()).with_for_update().first()
    return seat

def get_price_for_seat(event, seatTypeId):
    price_config = EventSeat.query.filter(
        EventSeat.event_id == event.id,
        EventSeat.event_ticket_type_id == seatTypeId,
    ).first()
    if not price_config:
        raise AppException("Chưa có cấu hình cho vé này", status_code=400)
    return price_config.price

def use_discount(discount_id, price):
    # 1. Nếu không truyền discount_id (None/rỗng) -> Trả về giá gốc
    if not discount_id:
        return price, None

    # 2. Tìm mã giảm giá trong DB
    discount = DiscountModel.query.get(discount_id)
    if not discount:
        return price, None  # Nếu truyền sai ID không tồn tại -> Giữ nguyên giá gốc

    now = datetime.now()
    if discount.start_time <= now <= discount.end_time:
        if discount.unit == '%':
            final_price = price * (1 - (discount.value / 100))
        else:
            final_price = max(0.0, price - discount.value)
        return final_price, discount.id

    return price, None

def get_discount(event):
    discount = DiscountModel.query.filter(
        DiscountModel.event_id == event.id,
    ).all()
    return discount

def check_payment(ticket_code):
    payment = PaymentModel.query.filter(ticket_code == TicketModel.code).first()
    if not payment:
        raise AppException("Mi chưa thanh toán", status_code=400)
    return payment

def create(data: CreateTicketRequestDTO):
    # user_id = get_jwt_identity
    user_id = 1
    # if not user_id:
    #     raise AppException(ErrorCode.USER_NOT_FOUND)
    print(data.event_id)
    event = EventModel.query.get(data.event_id)
    if not event:
        raise AppException(ErrorCode.NOT_FOUND)
    if event.max_per_user:
        user_ticket_count = (
            TicketModel.query
            .join(Seat, TicketModel.seat_id == Seat.id)
            .join(PaymentModel, PaymentModel.ticket_code == TicketModel.code)  # Hoặc PaymentModel tùy tên Class của bạn
            .filter(
                TicketModel.user_id == user_id,
                Seat.event_id == event.id,
                PaymentModel.status == PaymentStatus.SUCCESS
            )
            .count()
        )
        if user_ticket_count > event.max_per_user:
            raise AppException("Bạn đã đặt đủ số vé cho phép", status_code=400)
    seat = get_seat_isempty_for_event(event, seatTypeId=data.seat_type_id)
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
        purchase_time=datetime.now(),
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




