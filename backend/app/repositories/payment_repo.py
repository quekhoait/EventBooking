from datetime import datetime, timedelta
from app.dto.payment_dto import MomoPaymentCallbackRequest
from app.models import PaymentModel, PaymentStatus, PaymentType
from app.utils.errors import NotFoundError
from app import db


def create_new_payment_with_momo(ticket_code, data):
    new_payment = PaymentModel(
        code = data['orderId'],
        ticket_code = ticket_code,
        payment_method = "MOMO",
        expired_time = datetime.now() + timedelta(minutes=15),
        pay_url = data['payUrl'],
        amount = data['amount'],
    )
    db.session.add(new_payment)
    db.session.flush()

def update_payment_result_momo(data: MomoPaymentCallbackRequest):
    payment = PaymentModel.query.filter_by(code=data.orderId, ticket_code=data.extraData).first()
    if not payment:
        raise NotFoundError("Payment not found!!")
    payment.transaction_id = data.transId
    payment.status = PaymentStatus.SUCCESS if data.resultCode == 0 else PaymentStatus.FAILED
    db.session.add(payment)




