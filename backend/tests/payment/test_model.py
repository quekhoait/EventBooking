from threading import Event
from unittest.mock import patch

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

from app import db
from app import create_app
from app.models import PaymentModel, PaymentStatus, User, Seat, TicketModel, PaymentType


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


def test_create_payment_success_and_defaults(client):
    ticket = TicketModel(code="TCK00002", user_id=1, seat_id=1, price=200000.0)
    db.session.add(ticket)
    db.session.commit()

    payment = PaymentModel(
        code="PAY000000001",
        ticket_code="TCK00002",
        amount=200000.0,
        payment_method="momo"
    )
    db.session.add(payment)
    db.session.commit()

    saved_payment = db.session.get(PaymentModel, "PAY000000001")
    assert saved_payment is not None
    assert saved_payment.status == PaymentStatus.PENDING
    assert saved_payment.type == PaymentType.PAYMENT


def test_payment_ticket_foreign_key_constraint(client):
    db.session.execute(text("PRAGMA foreign_keys = ON;"))
    payment = PaymentModel(code="PAY_INVALID", ticket_code="NOT_EXIST", amount=100000.0)
    db.session.add(payment)
    with pytest.raises(IntegrityError):
        db.session.commit()
    db.session.rollback()

def test_ticket_payments_relationship(client):
    ticket = TicketModel(code="TCK00004", user_id=1, seat_id=1, price=100000.0)
    p1 = PaymentModel(code="PAY_ONE", ticket_code="TCK00004", amount=100000.0)
    p2 = PaymentModel(code="PAY_TWO", ticket_code="TCK00004", amount=100000.0, type=PaymentType.REFUND)

    db.session.add_all([ticket, p1, p2])
    db.session.commit()

    assert p1.ticket.code == "TCK00004"
    assert len(ticket.payments) == 2
    assert {p.code for p in ticket.payments} == {"PAY_ONE", "PAY_TWO"}