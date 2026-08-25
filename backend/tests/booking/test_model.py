from threading import Event
from unittest.mock import patch
from datetime import datetime, timedelta
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app import db
from app import create_app
from app.models import User, EventModel, Seat, TicketModel, DiscountModel, PaymentModel, PaymentStatus, PaymentType
from app.models.TicketModel import TicketStatus


@pytest.fixture(autouse=True)
def app_context():
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


def create_sample_dependencies():
    now = datetime.now()
    user = User(id=1, email="ticket_test@gmail.com", username="test")

    event_obj = EventModel(
        id=1,
        name="Concert 2026",
        start_time=now,
        end_time=now + timedelta(days=7),
        event_start_time=now + timedelta(days=10),
        event_end_time=now + timedelta(days=10, hours=3),
        location_id=1,
        company_id=1,
        category_id=1
    )

    seat = Seat(id=1, seat_code="A1", is_active=True, event_id=1, event_ticket_type_id=1)

    db.session.add_all([user, event_obj, seat])
    db.session.commit()
    return user, event_obj, seat

def test_create_ticket_success_and_defaults():
    user, event_obj, seat = create_sample_dependencies()
    ticket = TicketModel(
        code="TCK00001",
        user_id=user.id,
        seat_id=seat.id,
        price=150000.0
    )
    db.session.add(ticket)
    db.session.commit()

    saved_ticket = db.session.get(TicketModel, "TCK00001")
    assert saved_ticket is not None
    assert saved_ticket.code == "TCK00001"
    assert saved_ticket.user_id == user.id
    assert saved_ticket.seat_id == seat.id
    assert saved_ticket.price == 150000.0
    assert saved_ticket.status == TicketStatus.PENDING  # Default Status
    assert saved_ticket.discount_id is None


@pytest.mark.parametrize("status_enum", [
    TicketStatus.PENDING,
    TicketStatus.SUCCESS,
    TicketStatus.CANCELLED,
    TicketStatus.REFUNDED
])
def test_ticket_status_enum_values(status_enum):
    user, event_obj, seat = create_sample_dependencies()

    ticket = TicketModel(
        code=f"TCK_{status_enum.value}",
        user_id=user.id,
        seat_id=seat.id,
        price=200000.0,
        status=status_enum
    )
    db.session.add(ticket)
    db.session.commit()

    saved_ticket = db.session.get(TicketModel, f"TCK_{status_enum.value}")
    assert saved_ticket.status == status_enum


def test_ticket_missing_required_fields_raises_error():

    invalid_ticket = TicketModel(code="TCK_ERR")
    db.session.add(invalid_ticket)

    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_ticket_invalid_foreign_keys():
    db.session.execute(text("PRAGMA foreign_keys = ON;"))
    invalid_ticket = TicketModel(
        code="TCK_FK_ERR",
        user_id=99999,
        seat_id=99999,
        price=100000.0
    )
    db.session.add(invalid_ticket)

    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()


def test_ticket_discount_relationship():
    user, event_obj, seat = create_sample_dependencies()
    now = datetime.now()

    discount = DiscountModel(
        id=1,
        code="PROMO_2026",
        value=20000.0,
        unit="amount",
        start_time=now,
        end_time=now + timedelta(days=5),
        event_id=event_obj.id
    )
    db.session.add(discount)
    db.session.commit()

    ticket = TicketModel(
        code="TCK_DISC",
        user_id=user.id,
        seat_id=seat.id,
        price=80000.0,
        discount_id=discount.id
    )
    db.session.add(ticket)
    db.session.commit()

    saved_ticket = db.session.get(TicketModel, "TCK_DISC")
    assert saved_ticket.discount is not None
    assert saved_ticket.discount.code == "PROMO_2026"
    assert saved_ticket.discount.value == 20000.0


def test_ticket_payments_relationship():
    user, event_obj, seat = create_sample_dependencies()

    ticket = TicketModel(
        code="TCK_PAY",
        user_id=user.id,
        seat_id=seat.id,
        price=150000.0
    )

    pay1 = PaymentModel(
        code="PAY000000001",
        ticket_code="TCK_PAY",
        amount=150000.0,
        status=PaymentStatus.PENDING,
        type=PaymentType.PAYMENT
    )
    pay2 = PaymentModel(
        code="PAY000000002",
        ticket_code="TCK_PAY",
        amount=150000.0,
        status=PaymentStatus.SUCCESS,
        type=PaymentType.PAYMENT
    )

    db.session.add_all([ticket, pay1, pay2])
    db.session.commit()

    saved_ticket = db.session.get(TicketModel, "TCK_PAY")
    assert len(saved_ticket.payments) == 2
    assert {p.code for p in saved_ticket.payments} == {"PAY000000001", "PAY000000002"}
