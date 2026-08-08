from flask_jwt_extended import get_jwt_identity
from sqlalchemy.sql.functions import user
from datetime import datetime
from app import db, pattern
from app.dto.payment_dto import CreatePaymentResponse
from app.models import PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus
from app.pattern.method_payment import payment_context
from app.repositories import booking_repo, payment_repo
from app.services import booking_services
from app.utils.errors import UnauthorizedError, NotFoundError, NoPaymentsError, RefundedPaymentsError
from app.utils.exception import AppException


def check_payment(ticket_code):
    payment = booking_repo.find_payment_by_ticket_code(ticket_code)
    return payment


def create(data):
    # user_id = get_jwt_identity()
    # if not user_id:
    #     raise UnauthorizedError()

    payment = payment_repo.get_payment_by_ticket_code(data.ticket_code)

    # Nếu thanh toán lại
    if payment:
        seat = booking_services.get_seat(payment.ticket.seat_id)

        if seat.is_active == 0:
            raise AppException("Ticket seat not active!", status_code=403)
        elif payment.status == PaymentStatus.SUCCESS:
            raise AppException("Vé đã được thanh toán thành công!", status_code=400)
        elif payment.type == PaymentType.REFUND or payment.ticket.status.name == 'REFUNDED':
            raise AppException("Vé đã được hoàn tiền, không thể thanh toán!", status_code=400)
        elif payment.expired_time and payment.expired_time < datetime.now():
            raise AppException("Đã hết thời gian thanh toán vé!", status_code=400)
        else:
            return payment.pay_url

    ticket = booking_repo.find_ticket_by_code(data.ticket_code)
    if not ticket:
        raise AppException("Ticket not found!", status_code=404)

    try:
        res = payment_context.create(data.method, data.ticket_code, ticket.price)
        db.session.commit()
        return CreatePaymentResponse().dump(res)
    except Exception as e:
        db.session.rollback()
        raise e

