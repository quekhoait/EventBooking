from datetime import datetime, timedelta
from encodings.punycode import T

from app.dto.payment_dto import MomoPaymentCallbackRequest
from app.models import PaymentModel, PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus
from app.services import booking_services
from app.utils.errors import NotFoundError
from app import db


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


