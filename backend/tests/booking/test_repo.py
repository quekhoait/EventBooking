
from datetime import datetime, timedelta
import pytest
from app import db
from app.models import EventModel, Seat, EventSeat, DiscountModel, TicketModel, LocationModel
from app.repositories import booking_repo


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


def create_sample_event(event_id=1, name="Concert 2026", location_id=1):
    now = datetime.now()
    return EventModel(
        id=event_id,
        name=name,
        start_time=now,
        end_time=now + timedelta(days=7),
        event_start_time=now + timedelta(days=10),
        event_end_time=now + timedelta(days=10, hours=3),
        location_id=location_id,
        company_id=1,
        category_id=1
    )

def test_get_seat_isempty_for_event_success():
    event = create_sample_event(event_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=True, event_id=1, event_ticket_type_id=10)
    db.session.add_all([event, seat])
    db.session.commit()

    res = booking_repo.get_seat_isempty_for_event(event, seatTypeId=10)
    assert res is not None
    assert res.id == 1
    assert res.is_active is True


def test_get_seat_isempty_for_event_not_found():
    event = create_sample_event(event_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=10)  # Ghế đã bị khóa
    db.session.add_all([event, seat])
    db.session.commit()

    res = booking_repo.get_seat_isempty_for_event(event, seatTypeId=10)
    assert res is None


def test_get_price_config_for_seat():
    event_seat = EventSeat(id=1, event_id=1, event_ticket_type_id=10, price=200000.0, seat_total=10)
    db.session.add(event_seat)
    db.session.commit()

    res = booking_repo.get_price_config_for_seat(event_id=1, seat_type_id=10)
    assert res is not None
    assert res.price == 200000.0

    not_found = booking_repo.get_price_config_for_seat(event_id=1, seat_type_id=999)
    assert not_found is None

def test_find_discount_by_id():
    now = datetime.now()
    discount = DiscountModel(
        id=1, code="SUMMER50", value=50000.0, unit="amount",
        start_time=now, end_time=now + timedelta(days=7), event_id=1
    )
    db.session.add(discount)
    db.session.commit()

    res = booking_repo.find_discount_by_id(1)
    assert res is not None
    assert res.code == "SUMMER50"


def test_find_discounts_by_event_id():
    now = datetime.now()
    d1 = DiscountModel(id=1, code="DC1", value=10.0, unit="percentage", start_time=now, end_time=now, event_id=1)
    d2 = DiscountModel(id=2, code="DC2", value=20.0, unit="percentage", start_time=now, end_time=now, event_id=1)
    d3 = DiscountModel(id=3, code="DC3", value=30.0, unit="percentage", start_time=now, end_time=now, event_id=2)
    db.session.add_all([d1, d2, d3])
    db.session.commit()

    res = booking_repo.find_discounts_by_event_id(event_id=1)
    assert len(res) == 2
    assert {d.code for d in res} == {"DC1", "DC2"}


def test_count_user_successful_tickets():
    seat1 = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    seat2 = Seat(id=2, seat_code="A2", is_active=False, event_id=1, event_ticket_type_id=1)
    seat3 = Seat(id=3, seat_code="A3", is_active=True, event_id=1, event_ticket_type_id=1)
    ticket1 = TicketModel(code="TCK001", user_id=1, seat_id=1, price=100000.0)
    ticket2 = TicketModel(code="TCK002", user_id=1, seat_id=2, price=100000.0)
    ticket3 = TicketModel(code="TCK003", user_id=1, seat_id=3, price=100000.0)

    db.session.add_all([seat1, seat2, seat3, ticket1, ticket2, ticket3])
    db.session.commit()

    count = booking_repo.count_user_successful_tickets(user_id=1, event_id=1)
    assert count == 2


def test_find_ticket_by_code():
    ticket = TicketModel(code="TCK00001", user_id=1, seat_id=1, price=100000.0)
    db.session.add(ticket)
    db.session.commit()

    res = booking_repo.find_ticket_by_code("TCK00001")
    assert res is not None
    assert res.code == "TCK00001"

    not_found = booking_repo.find_ticket_by_code("NOT_EXIST")
    assert not_found is None


def test_save_ticket():
    ticket = TicketModel(code="TCK_SAVE_TEST", user_id=1, seat_id=1, price=100000.0)
    booking_repo.save_ticket(ticket)
    db.session.commit()

    saved_ticket = db.session.get(TicketModel, "TCK_SAVE_TEST")
    assert saved_ticket is not None
    assert saved_ticket.code == "TCK_SAVE_TEST"


def test_get_ticket_details():
    location = LocationModel(id=1, name="Nhà hát lớn")
    event = create_sample_event(event_id=1, name="Concert 2026", location_id=1)
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    ticket = TicketModel(code="TCK_DETAIL", user_id=1, seat_id=1, price=100000.0)

    db.session.add_all([location, event, seat, ticket])
    db.session.commit()

    res = booking_repo.get_ticket_details("TCK_DETAIL")
    assert res is not None
    assert res.code == "TCK_DETAIL"
    assert res.seat.seat_code == "A1"
    assert res.seat.event.name == "Concert 2026"
    assert res.seat.event.location.name == "Nhà hát lớn"

def test_get_seat():
    seat = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    db.session.add(seat)
    db.session.commit()
    res = booking_repo.get_seat(seat_id=1)
    assert res is not None
    assert res.seat_code == "A1"

def test_get_list():
    event = create_sample_event(event_id=1, name="Concert 2026")
    seat1 = Seat(id=1, seat_code="A1", is_active=False, event_id=1, event_ticket_type_id=1)
    seat2 = Seat(id=2, seat_code="A2", is_active=False, event_id=1, event_ticket_type_id=1)

    ticket1 = TicketModel(code="TCK001", user_id=10, seat_id=1, price=100000.0)
    ticket2 = TicketModel(code="TCK002", user_id=10, seat_id=2, price=100000.0)
    ticket3 = TicketModel(code="TCK003", user_id=20, seat_id=1, price=100000.0)

    db.session.add_all([event, seat1, seat2, ticket1, ticket2, ticket3])
    db.session.commit()

    tickets = booking_repo.get_list(user_id=10)
    assert len(tickets) == 2
    assert {t.code for t in tickets} == {"TCK001", "TCK002"}
    assert tickets[0].seat.event.name == "Concert 2026"
