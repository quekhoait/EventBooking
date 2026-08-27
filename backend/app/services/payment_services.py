from flask_jwt_extended import get_jwt_identity
from sqlalchemy.sql.functions import user
from datetime import datetime
from app import db, pattern
from app.dto.payment_dto import CreatePaymentResponse
from app.errors.ErrorCode import ErrorCode
from app.models import PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus
from app.pattern.method_payment import payment_context
from app.repositories import booking_repo, payment_repo
from app.services import booking_services
from app.utils.errors import UnauthorizedError, NotFoundError, NoPaymentsError, RefundedPaymentsError
from app.utils.exception import AppException


def check_payment(ticket_code):
    payment = payment_repo.get_payment_by_ticket_code(ticket_code)
    return payment

def check_authorization():
    user_id = get_jwt_identity()
    if not user_id:
        raise AppException(ErrorCode.UNAUTHORIZED)

def create(data):
    # check_authorization()
    print(data)
    payment = check_payment(data.ticket_code)
    # Nếu thanh toán lại
    if payment:
        seat = booking_repo.get_seat(payment.ticket.seat_id)

        if seat.is_active == 0:
            raise AppException("Ticket seat not active!", status_code=403)
        elif payment.status == PaymentStatus.SUCCESS:
            raise AppException("Vé đã được thanh toán thành công!", status_code=400)
        elif payment.type == PaymentType.REFUND or payment.ticket.status.name == 'REFUNDED':
            raise AppException("Vé đã được hoàn tiền, không thể thanh toán!", status_code=400)
        elif payment.expired_time and payment.expired_time < datetime.now():
            raise AppException("Đã hết thời gian thanh toán vé!", status_code=400)
        else:
            return CreatePaymentResponse().dump(payment)

    ticket = booking_repo.find_ticket_by_code(data.ticket_code)
    if not ticket:
        raise AppException("Ticket not found!", status_code=404)

    try:
        res = payment_context.create(data.method, data.ticket_code, ticket.price)
        print(">>> MOMO RESPONSE1211:", res)
        db.session.commit()
        return CreatePaymentResponse().dump(res)
    except Exception as e:
        db.session.rollback()
        raise e

def callback(method:str, data):
    try:
        pay = payment_context.callback(method, data)
        db.session.commit()
        return pay
    except Exception as e:
        db.session.rollback()
        raise e

def refund(data):
    check_authorization()
    ticket = booking_repo.find_ticket_by_code(data.ticket_code)
    if not ticket:
        raise AppException("Ticket not found!", status_code=404)
    payment = check_payment(data.ticket_code)
    if not payment:
        raise AppException("Payment not found!", status_code=404)
    if payment.status != PaymentStatus.SUCCESS or payment.type != PaymentType.PAYMENT:
        raise AppException("Giao dịch không đủ điều kiện để hoàn tiền!", status_code=400)

    payload = {
        "transaction_id": payment.transaction_id,
        "amount": int(round(float(payment.amount))),
        "description": f"Refund ticket {data.ticket_code} from event",
        "ticket_code": data.ticket_code
    }
    try:
        if ticket.status == TicketStatus.SUCCESS:
            result_code = payment_context.refund(data.method, payload)
            if result_code == 0 or result_code == 7002:
                payment.type = PaymentType.REFUND
                payment.status = PaymentStatus.SUCCESS
                payment.ticket.status = TicketStatus.REFUNDED
                seat = booking_repo.get_seat(payment.ticket.seat_id)
                seat.is_active = True
                db.session.add(payment)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

def transaction(method: str, data):
    check_authorization()
    try:
        result = payment_context.transaction(method, data)
        if result.get('resultCode') == 0:
            db.session.commit()
            return result
        else:
            payment_repo.update_payment_result_momo(result)
        return result
    except Exception as e:
        db.session.rollback()
        raise e

