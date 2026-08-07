from flask_jwt_extended import get_jwt_identity
from app import db, pattern
from app.dto.payment_dto import CreatePaymentResponse
from app.pattern.method_payment import PaymentContext, payment_context
from app.repositories import booking_repo, payment_repo
from app.utils.errors import UnauthorizedError, NotFoundError, NoPaymentsError, RefundedPaymentsError
from app.utils.exception import AppException



def create(data):
    # user_id = get_jwt_identity()
    # if not user_id:
    #     raise UnauthorizedError()
    ticket = booking_repo.find_ticket_by_code(data.ticket_code)
    if not ticket:
        raise AppException("Ticket not found!", status_code=404)
    try:
        res = payment_context.create(data.method, data.ticket_code, ticket.price)
        db.session.commit()
        return CreatePaymentResponse().dump(res)
    except Exception as e:
        print(e)
        db.session.rollback()
        raise e

def callback(method:str, data):
    try:
        payment_context.callback(method, data)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return e

