from datetime import datetime, timedelta
import pytest
from app import db
from app.dto.booking_dto import CreateTicketRequestDTO
from app.models import (
    TicketModel,
    Seat,
    EventModel,
    EventSeat,
    DiscountModel,
    LocationModel
)
from app.models.UserModel import User
from app.services import booking_services
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
    mocker.patch('app.services.booking_services.get_jwt_identity', return_value=1)
    return 1


def create_sample_event(event_id=1, name="Concert 2026", max_per_user=5, location_id=1):
    now = datetime.now()
    return EventModel(
        id=event_id,
        name=name,
        max_per_user=max_per_user,
        start_time=now,
        end_time=now + timedelta(days=7),
        event_start_time=now + timedelta(days=10),
        event_end_time=now + timedelta(days=10, hours=3),
        location_id=location_id,
        company_id=1,
        category_id=1
    )

def test_check_authorization_unauthorized(mocker):
    mocker.patch('app.services.booking_services.get_jwt_identity', return_value=None)
    with pytest.raises(AppException) as e:
        booking_services.check_authorization()
    assert e.value.status_code == 401
    assert e.value.message in "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn"


def test_check_authorization_success(logged_in_user):
    user_id = booking_services.check_authorization()
    assert user_id == 1


def test_get_price_for_seat_success():
    event = create_sample_event(event_id=1)
    event_seat = EventSeat(id=1, event_id=1, event_ticket_type_id=10, price=200000.0, seat_total=10)
    db.session.add_all([event, event_seat])
    db.session.commit()

    price = booking_services.get_price_for_seat(event, seatTypeId=10)
    assert price == 200000.0


def test_get_price_for_seat_missing_config_raises_400():
    event = create_sample_event(event_id=1)
    db.session.add(event)
    db.session.commit()
    with pytest.raises(AppException) as exc_info:
        booking_services.get_price_for_seat(event, seatTypeId=999)

    assert exc_info.value.status_code == 400
    assert "Chưa có cấu hình cho vé này" in str(exc_info.value.message)


@pytest.mark.parametrize("discount_unit, discount_val, initial_price, expected_price", [
    ("%", 20.0, 100000.0, 80000.0),        # Giảm 20%
    ("%", 100.0, 100000.0, 0.0),           # Giảm 100% -> Vé 0đ
    ("%", 0.0, 100000.0, 100000.0),        # Giảm 0% -> Giữ nguyên giá gốc
    ("%", 12.5, 100000.0, 87500.0),        # Giảm phần trăm lẻ
    ("amount", 30000.0, 100000.0, 70000.0), # Giảm số tiền cố định
    ("amount", 100000.0, 100000.0, 0.0),    # Giảm vừa bằng giá vé
    ("amount", 150000.0, 100000.0, 0.0),    # Giảm vượt quá giá vé -> Tối thiểu 0đ
    ("amount", 0.0, 100000.0, 100000.0),    # Giảm 0đ -> Giữ nguyên
])
def test_use_discount_valid(discount_unit, discount_val, initial_price, expected_price):
    now = datetime.now()
    discount = DiscountModel(
        code=f"DISCOUNT_{discount_unit}_{discount_val}",
        value=discount_val,
        unit=discount_unit,
        start_time=now - timedelta(days=1),
        end_time=now + timedelta(days=1),
        event_id=1
    )
    db.session.add(discount)
    db.session.commit()

    final_price, discount_id = booking_services.use_discount(discount.id, initial_price)
    assert final_price == expected_price
    assert discount_id == discount.id


def test_use_discount_expired_or_invalid():
    now = datetime.now()
    expired_discount = DiscountModel(
        code="EXPIRED_CODE",
        value=50.0,
        unit="%",
        start_time=now - timedelta(days=10),
        end_time=now - timedelta(days=1),
        event_id=1
    )
    db.session.add(expired_discount)
    db.session.commit()

    price, discount_id = booking_services.use_discount(expired_discount.id, 100000.0)
    assert price == 100000.0
    assert discount_id is None

def test_use_discount_not_id():
    now = datetime.now()
    discount = DiscountModel(id= 2,code="EXPIRED_CODE",
        value=50.0,
        unit="%",
        start_time=now - timedelta(days=10),
        end_time=now - timedelta(days=1),
        event_id=1)
    db.session.add(discount)
    db.session.commit()
    price, discount_id = booking_services.use_discount(1, 100000.0)
    assert price == 100000.0
    assert discount_id is None



def test_create_ticket_event_not_found(logged_in_user, mocker):
    mock_dto = mocker.Mock(event_id=999, seat_type_id=1)
    with pytest.raises(AppException) as exc_info:
        booking_services.create(mock_dto)
    assert exc_info.value.status_code == 404


def test_create_ticket_max_limit_exceeded(logged_in_user, mocker):
    event = create_sample_event(event_id=1, max_per_user=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=10)
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([event, seat, ticket])
    db.session.commit()

    mock_dto = mocker.Mock(event_id=1, seat_type_id=10)

    with pytest.raises(AppException) as exc_info:
        booking_services.create(mock_dto)

    assert exc_info.value.status_code == 400
    assert "Bạn đã đặt đủ số vé cho phép" in str(exc_info.value.message)


def test_create_ticket_no_seat_available(logged_in_user, mocker):
    event = create_sample_event(event_id=1)
    seat_locked = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=10)

    db.session.add_all([event, seat_locked])
    db.session.commit()

    mock_dto = mocker.Mock(event_id=1, seat_type_id=10)

    with pytest.raises(AppException) as exc_info:
        booking_services.create(mock_dto)

    assert exc_info.value.status_code == 400
    assert "Loại vé này đết còn" in str(exc_info.value.message)


def test_create_ticket_db_exception_rollbacks(logged_in_user, mocker):
    event = create_sample_event(event_id=1)
    event_seat = EventSeat(id=1, event_id=1, event_ticket_type_id=10, price=100000.0, seat_total=10)
    seat = Seat(id=1, seat_code="A1", is_active=True, event_id=1, event_ticket_type_id=10)

    db.session.add_all([event, event_seat, seat])
    db.session.commit()

    mocker.patch('app.services.booking_services.db.session.commit', side_effect=Exception("DB Error"))
    mock_rollback = mocker.patch('app.services.booking_services.db.session.rollback')

    mock_dto = mocker.Mock(event_id=1, seat_type_id=10, discount_id=None)

    with pytest.raises(AppException) as exc_info:
        booking_services.create(mock_dto)

    assert exc_info.value.status_code == 500
    assert "Lỗi đặt vé" in str(exc_info.value.message)
    mock_rollback.assert_called_once()


def test_create_ticket_success(logged_in_user, mocker):
    event = create_sample_event(event_id=1)
    event_seat = EventSeat(id=1, event_id=1, event_ticket_type_id=10, price=150000.0, seat_total=10)
    seat = Seat(id=1, seat_code="A1", is_active=True, event_id=1, event_ticket_type_id=10)

    db.session.add_all([event, event_seat, seat])
    db.session.commit()

    mock_dto = mocker.Mock(event_id=1, seat_type_id=10, discount_id=None)

    ticket = booking_services.create(mock_dto)

    assert ticket is not None
    assert ticket.user_id == 1
    assert ticket.price == 150000.0

    saved_ticket = db.session.get(TicketModel, ticket.code)
    assert saved_ticket is not None
    assert saved_ticket.seat_id == 1



def test_get_by_code_not_found(logged_in_user, mocker):
    mock_dto = mocker.Mock(code="NOT_EXIST")

    with pytest.raises(AppException) as exc_info:
        booking_services.get_by_code(mock_dto)
    assert exc_info.value.status_code == 404


def test_get_by_code_unauthorized_owner(logged_in_user, mocker):
    ticket = TicketModel(code="TCK00001", user_id=999, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()

    mock_dto = mocker.Mock(code="TCK00001")

    with pytest.raises(AppException) as exc_info:
        booking_services.get_by_code(mock_dto)
    assert exc_info.value.status_code == 404


def test_get_by_code_success(logged_in_user, mocker):
    location = LocationModel(id=1, name="Mỹ Đình")
    event = create_sample_event(event_id=1, location_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([location, event, seat, ticket])
    db.session.commit()

    mock_dto = mocker.Mock(code="TCK00001")
    res = booking_services.get_by_code(mock_dto)

    assert res is not None
    assert res.code == "TCK00001"
    assert res.seat.seat_code == "A1"


def test_list_tickets_success(logged_in_user):
    event = create_sample_event(event_id=1)
    seat1 = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    seat2 = Seat(id=2, seat_code="A2", is_active=False, event_id=1, event_ticket_type_id=1)

    t1 = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    t2 = TicketModel(code="TCK00002", user_id=1, seat_id=2, price=100000.0)
    t_other = TicketModel(code="TCK00003", user_id=999, seat_id=1, price=100000.0)

    db.session.add_all([event, seat1, seat2, t1, t2, t_other])
    db.session.commit()

    tickets = booking_services.list_tickets()

    assert len(tickets) == 2
    assert {t.code for t in tickets} == {"TCK00001", "TCK00002"}



def test_send_ticket_success(mocker):
    user = User(id=1, email="test@gmail.com", username="test")

    location = LocationModel(id=1, name="Sân vận động Mỹ Đình")
    event = create_sample_event(event_id=1, location_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([user, location, event, seat, ticket])
    db.session.commit()
    mock_mail_send = mocker.patch('app.services.booking_services.mail.send')

    res = booking_services.send_ticket("TCK00001")

    assert res is True
    mock_mail_send.assert_called_once()


def test_send_ticket_mail_failed(mocker):
    user = User(id=1, email="test@gmail.com", username="test")
    location = LocationModel(id=1, name="Sân vận động Mỹ Đình")
    event = create_sample_event(event_id=1, location_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([user, location, event, seat, ticket])
    db.session.commit()

    mocker.patch('app.services.booking_services.mail.send', side_effect=Exception("SMTP Server Down"))

    with pytest.raises(AppException) as exc_info:
        booking_services.send_ticket("TCK00001")

    assert "Gửi mail thất bại" in str(exc_info.value.message)


def test_cancel_ticket_not_found(logged_in_user):
    with pytest.raises(AppException) as exc_info:
        booking_services.cancel_ticket({"ticket_code": "NOT_EXIST"})

    assert exc_info.value.status_code == 404


def test_cancel_ticket_forbidden(logged_in_user):
    ticket = TicketModel(code="TCK00001", user_id=999, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()

    payload = {"ticket_code": "TCK00001", "method": "momo"}

    with pytest.raises(AppException) as exc_info:
        booking_services.cancel_ticket(payload)

    assert exc_info.value.status_code == 403


def test_cancel_ticket_success(logged_in_user, mocker):
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()

    mock_refund = mocker.patch(
        'app.services.booking_services.payment_services.refund',
        return_value={"status": "REFUNDED"}
    )

    payload = {"ticket_code": "TCK00001", "method": "momo"}
    res = booking_services.cancel_ticket(payload)

    mock_refund.assert_called_once_with(payload)
    assert res["status"] == "REFUNDED"


def test_create_ticket_code_collision_retries(logged_in_user, mocker):
    event = create_sample_event(event_id=1)
    event_seat = EventSeat(id=1, event_id=1, event_ticket_type_id=1, price=100000.0, seat_total=10)
    seat = Seat(id=1, seat_code="A1", is_active=True, event_id=1, event_ticket_type_id=1)
    existing_ticket = TicketModel(code="TK001", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([event, event_seat, seat, existing_ticket])
    db.session.commit()

    mock_gen_code = mocker.patch(
        'app.services.booking_services.generate_random_code',
        side_effect=["TK001", "TK002"]
    )

    payload = {"event_id":1,"user_id":1,"seat_type_id":1}

    ticket = booking_services.create(CreateTicketRequestDTO().load(payload))

    assert ticket.code == "TK002"
    assert mock_gen_code.call_count == 2

    saved_ticket = db.session.get(TicketModel, "TK002")
    assert saved_ticket is not None