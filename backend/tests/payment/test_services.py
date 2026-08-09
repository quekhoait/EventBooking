from datetime import datetime, timedelta

import pytest
from app import db
from app.dto.payment_dto import PaymentRequest, CreatePaymentResponse
from app.models import TicketModel, PaymentModel, PaymentStatus, PaymentType, Seat
from app.models.TicketModel import TicketStatus
from app.pattern.method_payment import payment_context
from app.services import payment_services
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

@pytest.fixture
def logged_in_user(mocker):
    mocker.patch('app.services.payment_services.get_jwt_identity', return_value=1)
    return 1

def test_create_payment_unauthorized(mocker):
    mocker.patch('app.services.payment_services.get_jwt_identity', return_value=None)
    payload = {"ticket_code": "TCK00001", "method": "momo"}
    data = PaymentRequest().load(payload)

    with pytest.raises(AppException) as e:
        payment_services.create(data)
    assert e.value.status_code == 401
    assert e.value.message == "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn"

def test_logic_create_payment_success(logged_in_user, mocker):
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()
    raw_res_from_momo = {
        "payUrl": "https://momo.vn/pay/success",
        "orderId": "PAY_001"
    }
    mock_strategy = mocker.Mock()
    mock_strategy.create.return_value = CreatePaymentResponse().load(raw_res_from_momo)
    mocker.patch.dict(payment_context.method_payment, {"momo": mock_strategy})
    payload = {
        "ticket_code": "TCK00001",
        "method": "momo",
    }
    data = PaymentRequest().load(payload)
    res = payment_services.create(data)
    assert res is not None
    assert "payUrl" in res

def test_create_payment_ticket_not_found(logged_in_user):
    payload = {"ticket_code": "NOT_EXIST", "method": "momo"}
    data = PaymentRequest().load(payload)
    with pytest.raises(AppException) as e:
        payment_services.create(data)
    assert e.value.status_code == 404
    assert "Ticket not found" in str(e.value.message)


def test_repayment_valid_returns_existing_url(logged_in_user, mocker):
    ticket = TicketModel(code="TCK00003", user_id=1, seat_id=3, price=100000.0)
    payment = PaymentModel(
        code="PAY003", ticket_code="TCK00003", amount=100000.0,
        status=PaymentStatus.PENDING, type=PaymentType.PAYMENT,
        expired_time=datetime.now() + timedelta(minutes=15),
        pay_url="https://momo.vn/pay/OLD_URL"
    )
    db.session.add_all([ticket, payment])
    db.session.commit()
    mocker.patch('app.services.payment_services.booking_services.get_seat', return_value=mocker.Mock(is_active=1))
    data = PaymentRequest().load({"ticket_code": "TCK00003", "method": "momo"})
    res = payment_services.create(data)
    assert res == "https://momo.vn/pay/OLD_URL"

@pytest.mark.parametrize("seat_active, payment_status, payment_type, ticket_status, expired_time, expected_code, expected_msg",
# 1. Ghế đã có người mua / bị khóa (seat.is_active = 0)
    [(0, PaymentStatus.PENDING, PaymentType.PAYMENT, TicketStatus.PENDING, None, 403, "Ticket seat not active!" ),
# 2. Vé đã thanh toán thành công
    (1, PaymentStatus.SUCCESS, PaymentType.PAYMENT,TicketStatus.SUCCESS, None, 400, "Vé đã được thanh toán thành công!"),
# 3. Vé đã hoàn tiền
    (1, PaymentStatus.FAILED, PaymentType.REFUND, TicketStatus.REFUNDED, None, 400, "Vé đã được hoàn tiền, không thể thanh toán!"),
# 4. Vé đã hết hạn thanh toán (quá 10 phút trước)
        (1, PaymentStatus.PENDING, PaymentType.PAYMENT, TicketStatus.PENDING, datetime.now() - timedelta(minutes=10),
                400,
                "Đã hết thời gian thanh toán vé!"
        ),
    ]
)
def test_repayment_failure_cases(logged_in_user, mocker, seat_active, payment_status,
                                 payment_type, ticket_status, expired_time, expected_code, expected_msg
):
    ticket = TicketModel(code="TCK_REPAY_TEST", user_id=1, seat_id=100, price=100000.0, status=ticket_status)
    payment = PaymentModel(
        code="PAY_REPAY_TEST",
        ticket_code="TCK_REPAY_TEST",
        amount=100000.0,
        status=payment_status,
        type=payment_type,
        expired_time=expired_time
    )
    payment.ticket = ticket
    db.session.add_all([ticket, payment])
    db.session.commit()
    mock_seat = Seat(id=100, seat_code="A100", is_active=seat_active)
    mocker.patch('app.services.payment_services.booking_services.get_seat', return_value=mock_seat)

    data = PaymentRequest().load({"ticket_code": "TCK_REPAY_TEST", "method": "momo"})

    with pytest.raises(AppException) as exc_info:
        payment_services.create(data)
    assert exc_info.value.status_code == expected_code
    assert expected_msg in str(exc_info.value.message)

def test_callback_success(mocker):
    mock_payment = PaymentModel(code="PAY_001", status=PaymentStatus.SUCCESS)
    mocker.patch.object(
        payment_context,
        'callback',
        return_value=mock_payment
    )
    mock_commit = mocker.patch('app.services.payment_services.db.session.commit')
    payload = {
        "partnerCode": "MOMO",
        "orderId": "PAY_001",
        "resultCode": 0,
        "amount": 50000,
        "transId": 123456789,
        "extraData": "BK_PAID_3",
        "signature": "mocked_signature"
    }
    payment = payment_services.callback("momo", payload)
    mock_commit.assert_called_once()
    assert payment.status == PaymentStatus.SUCCESS


def test_refund_payment_not_found(logged_in_user):
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()
    data = PaymentRequest().load({"ticket_code": "TCK00001", "method": "momo"})
    with pytest.raises(AppException) as exc_info:
        payment_services.refund(data)
    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "Payment not found!"

def test_refund_not_ticket(logged_in_user):
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()
    data = PaymentRequest().load({"ticket_code": "TCK00002", "method": "momo"})
    with pytest.raises(AppException) as exc_info:
        payment_services.refund(data)
    assert exc_info.value.status_code == 404
    assert exc_info.value.message == "Ticket not found!"

@pytest.mark.parametrize("payment_status, payment_type", [
    (PaymentStatus.PENDING, PaymentType.PAYMENT),
    (PaymentStatus.SUCCESS, PaymentType.REFUND),
    (PaymentStatus.FAILED, PaymentType.PAYMENT),
])
def test_refund_ineligible_payment_status(logged_in_user, payment_status, payment_type):
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    payment = PaymentModel(
        code="PAY001",
        ticket_code="TCK00001",
        amount=100000.0,
        status=payment_status,
        type=payment_type
    )
    db.session.add_all([ticket, payment])
    db.session.commit()
    data = PaymentRequest().load({"ticket_code": "TCK00001", "method": "momo"})
    with pytest.raises(AppException) as exc_info:
        payment_services.refund(data)
    assert exc_info.value.status_code == 400
    assert exc_info.value.message == "Giao dịch không đủ điều kiện để hoàn tiền!"

def test_refund_success_and_release_seat(logged_in_user, mocker):
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0, status=TicketStatus.SUCCESS)
    payment = PaymentModel(
        code="PAY001",
        ticket_code="TCK00001",
        transaction_id="TRANS_123",
        amount=100000.0,
        status=PaymentStatus.SUCCESS,
        type=PaymentType.PAYMENT
    )
    payment.ticket = ticket
    db.session.add_all([seat, ticket, payment])
    db.session.commit()
    mock_strategy = mocker.Mock()
    mock_strategy.refund.return_value = 0
    mocker.patch.dict(payment_context.method_payment, {"momo": mock_strategy})
    mocker.patch('app.services.payment_services.booking_services.get_seat', return_value=seat)

    data = PaymentRequest().load({"ticket_code": "TCK00001", "method": "momo"})
    payment_services.refund(data)

    updated_payment = PaymentModel.query.filter_by(code="PAY001").first()
    assert updated_payment.type == PaymentType.REFUND
    assert updated_payment.status == PaymentStatus.SUCCESS
    assert updated_payment.ticket.status == TicketStatus.REFUNDED
    assert seat.is_active is True

def test_transaction_result_code_zero_commits(logged_in_user, mocker):
    mock_momo_res = {"resultCode": 0, "orderId": "PAY001", "message": "Success"}
    mock_strategy = mocker.Mock()
    mock_strategy.transaction.return_value = mock_momo_res
    mocker.patch.dict(payment_context.method_payment, {"momo": mock_strategy})

    mock_commit = mocker.patch('app.services.payment_services.db.session.commit')

    res = payment_services.transaction("momo", {"orderId": "PAY001"})
    mock_commit.assert_called_once()
    assert res["resultCode"] == 0


def test_transaction_result_code_non_zero_updates_repo(logged_in_user, mocker):
    mock_momo_res = {"resultCode": 1001, "orderId": "PAY001", "message": "Transaction failed"}
    mock_strategy = mocker.Mock()
    mock_strategy.transaction.return_value = mock_momo_res
    mocker.patch.dict(payment_context.method_payment, {"momo": mock_strategy})

    mock_update_repo = mocker.patch('app.services.payment_services.payment_repo.update_payment_result_momo')

    res = payment_services.transaction("momo", {"orderId": "PAY001"})

    mock_update_repo.assert_called_once_with(mock_momo_res)
    assert res["resultCode"] == 1001


def test_transaction_exception_rollbacks(logged_in_user, mocker):
    mock_strategy = mocker.Mock()
    mock_strategy.transaction.side_effect = Exception("Gateway Connection Timeout")
    mocker.patch.dict(payment_context.method_payment, {"momo": mock_strategy})

    mock_rollback = mocker.patch('app.services.payment_services.db.session.rollback')

    with pytest.raises(Exception) as exc_info:
        payment_services.transaction("momo", {"orderId": "PAY001"})

    assert "Gateway Connection Timeout" in str(exc_info.value)
    mock_rollback.assert_called_once()


@pytest.mark.parametrize("service_call", [
    lambda: payment_services.callback("momo", {"orderId": "PAY001", "resultCode": 0}),
    lambda: payment_services.refund(PaymentRequest().load({"ticket_code": "TCK00001", "method": "momo"})),
    lambda: payment_services.transaction("momo", {"orderId": "PAY001"}),
    lambda: payment_services.create(PaymentRequest().load({"ticket_code": "TCK00002", "method": "momo"}))
])
def test_all_services_commit_exception_triggers_rollback(logged_in_user, mocker, service_call):
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket1 = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0, status=TicketStatus.SUCCESS)
    payment1 = PaymentModel(
        code="PAY001", ticket_code="TCK00001", transaction_id="TRANS_123",
        amount=100000.0, status=PaymentStatus.SUCCESS, type=PaymentType.PAYMENT
    )
    payment1.ticket = ticket1

    ticket2 = TicketModel(code="TCK00002", user_id=1, seat_id=1, price=100000.0, status=TicketStatus.PENDING)

    db.session.add_all([seat, ticket1, ticket2, payment1])
    db.session.commit()

    mocker.patch.object(payment_context, 'callback', return_value=payment1)
    mocker.patch.object(payment_context, 'refund', return_value=0)
    mocker.patch.object(payment_context, 'create', return_value={"payUrl": "https://momo.vn/pay/123"})
    mocker.patch.object(payment_context, 'transaction', return_value={"resultCode": 0})
    mocker.patch('app.services.payment_services.booking_services.get_seat', return_value=seat)

    mocker.patch('app.services.payment_services.db.session.commit', side_effect=Exception("Database Connection Lost"))
    mock_rollback = mocker.patch('app.services.payment_services.db.session.rollback')

    with pytest.raises(Exception) as exc_info:
        service_call()

    assert "Database Connection Lost" in str(exc_info.value)
    mock_rollback.assert_called_once()