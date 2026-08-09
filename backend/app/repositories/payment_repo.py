from datetime import datetime, timedelta
from encodings.punycode import T

from app.dto.payment_dto import MomoPaymentCallbackRequest
from app.errors.ErrorCode import ErrorCode
from app.models import PaymentModel, PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus
from app.services import booking_services
from app.utils.errors import NotFoundError
from app import db
from app.utils.exception import AppException


def create_new_payment_with_momo(ticket_code, data):
    new_payment = PaymentModel(
        code = data['orderId'],
        ticket_code = ticket_code,
        payment_method = "MOMO",
        expired_time = datetime.now() + timedelta(minutes=30),
        pay_url = data['payUrl'],
        amount = data['amount'],
    )
    db.session.add(new_payment)
    db.session.flush()


def get_payment_by_ticket_code(ticket_code):
    payment = PaymentModel.query.filter_by(ticket_code=ticket_code).first()
    return payment


def update_payment_result_momo(data: dict):
    payment = PaymentModel.query.filter_by(code=data.get('orderId'), ticket_code=data.get('extraData')).first()
    if not payment:
        raise AppException(ErrorCode.PAYMENT_NOT_FOUND)
    payment.transaction_id = data.get('transId')
    payment.status = PaymentStatus.SUCCESS if data.get('resultCode') == 0 else PaymentStatus.FAILED
    payment.ticket.status = TicketStatus.SUCCESS if data.get('resultCode') == 0 else TicketStatus.PENDING
    seat = booking_services.get_seat(payment.ticket.seat_id)
    seat.is_active = False if data.get('resultCode') == 0 else True
    db.session.add(payment)
    return payment

def create_refund_result_momo(ticket_code, data):
    new_refund = PaymentModel(
        code = data['orderId'],
        ticket_code = ticket_code,
        payment_method = "MOMO",
        amount = data['amount'],
        status = PaymentStatus.SUCCESS if data['resultCode'] == 0 else PaymentStatus.FAILED,
        type = PaymentType.REFUND
    )
    db.session.add(new_refund)
    db.session.flush()
