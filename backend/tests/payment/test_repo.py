from unittest.mock import patch

import pytest
from app import db
from app.errors.ErrorCode import ErrorCode
from app.models import TicketModel, PaymentModel, Seat, PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus
from app.repositories import payment_repo
from app.utils.exception import AppException


@pytest.fixture(autouse=True)
def app_context():
    from app import create_app
    app = create_app('testing_fake')
    app_context = app.app_context()
    app_context.push()
    db.create_all()
    yield app
    db.session.remove()
    db.drop_all()
    app_context.pop()

@pytest.fixture(autouse=True)
def client(app_context):
    return app_context.test_client()


def test_create_new_payment_success():
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()
    data = {
        'orderId': 'PAY_MOMO_001',
        'payUrl': 'https://momo.vn/pay/123',
        'amount': 100000.0
    }
    payment_repo.create_new_payment_with_momo('TCK00001', data)
    saved_payment = PaymentModel.query.filter_by(code='PAY_MOMO_001').first()
    assert saved_payment is not None
    assert saved_payment.ticket_code == 'TCK00001'
    assert saved_payment.payment_method == "MOMO"
    assert saved_payment.amount == 100000.0


def test_get_payment_by_code():
    ticket = TicketModel(code="TCK00002", user_id=1, seat_id=2, price=100000.0)
    payment = PaymentModel(code="PAY002", ticket_code="TCK00002", amount=100000.0)
    db.session.add_all([ticket, payment])
    db.session.commit()

    result = payment_repo.get_payment_by_ticket_code("TCK00002")
    assert result is not None
    assert result.code == "PAY002"

    result_none = payment_repo.get_payment_by_ticket_code("TCK_NOT_EXIST")
    assert result_none is None

@patch('app.services.booking_services.get_seat')
def test_update_payment_result_code_success(mock_service):
    seat = Seat(id = 5, seat_code="VIP_1", is_active=True, event_id=1, event_ticket_type_id=1)
    mock_service.return_value = seat
    ticket = TicketModel(code="TCK00003", user_id=1, seat_id=5, price=100000.0, status=TicketStatus.PENDING)
    payment = PaymentModel(code="PAY_ORDER_003", ticket_code="TCK00003", amount=100000.0, status=PaymentStatus.PENDING)
    db.session.add_all([ticket, payment])
    db.session.commit()

    data = {
        'orderId': 'PAY_ORDER_003',
        'extraData': 'TCK00003',
        'transId': 'TRANS_9999',
        'resultCode': 0
    }
    result = payment_repo.update_payment_result_momo(data)
    assert result is not None
    assert result.code == "PAY_ORDER_003"
    assert result.status == PaymentStatus.SUCCESS
    assert result.ticket.status == TicketStatus.SUCCESS
    assert seat.is_active == False

@patch('app.services.booking_services.get_seat')
def test_update_payment_result_code_failed(mock_service):
    seat = Seat(id = 1, seat_code="VIP_2", is_active=True, event_id=1, event_ticket_type_id=1)
    mock_service.return_value = seat
    ticket = TicketModel(code="TCK00004", user_id=1, seat_id=1, price=100000.0, status=TicketStatus.PENDING)
    payment = PaymentModel(code="PAY_ORDER_004", ticket_code="TCK00004", amount=100000.0, status=PaymentStatus.PENDING)
    db.session.add_all([ticket, payment])
    db.session.commit()

    data = {
        'orderId': 'PAY_ORDER_004',
        'extraData': 'TCK00004',
        'transId': 'TRANS_9998',
        'resultCode': 11
    }
    result = payment_repo.update_payment_result_momo(data)
    assert result is not None
    assert result.code == "PAY_ORDER_004"
    assert result.status == PaymentStatus.FAILED
    assert result.ticket.status == TicketStatus.PENDING
    assert seat.is_active == True

def test_update_payment_result_momo_not_found():
    data = {
        'orderId': 'NON_EXISTENT_ORDER',
        'extraData': 'TCK99999'
    }
    with pytest.raises(AppException) as e:
        payment_repo.update_payment_result_momo(data)
    assert e.value.status_code == 404
    # assert e.error_code == ErrorCode.PAYMENT_NOT_FOUND
    assert e.value.message == "Không tìm thấy payment"

def test_create_refund_result_momo():
    ticket = TicketModel(code="TCK00005", user_id=1, seat_id=7, price=100000.0)
    db.session.add(ticket)
    db.session.commit()
    data = {
        'orderId': 'REFUND_ORDER_001',
        'amount': 100000.0,
        'resultCode': 0
    }
    payment_repo.create_refund_result_momo('TCK00005', data)

    refund = PaymentModel.query.filter_by(code='REFUND_ORDER_001').first()
    assert refund is not None
    assert refund.type == PaymentType.REFUND
    assert refund.status == PaymentStatus.SUCCESS
    assert refund.payment_method == "MOMO"