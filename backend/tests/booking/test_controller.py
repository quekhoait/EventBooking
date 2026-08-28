
import pytest

from app.models import TicketModel, Seat, EventModel
from app.utils.exception import AppException

from app import db
from app import create_app



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

@pytest.fixture
def logged_in_user(mocker):
    mocker.patch('flask_jwt_extended.view_decorators.verify_jwt_in_request', return_value=None)
    mocker.patch('flask_jwt_extended.get_jwt_identity', return_value=1)
    return 1


def test_api_create_ticket_success(client, mocker, logged_in_user):
    ticket = TicketModel(code="TCK00001", price=150000.0, user_id=1, seat_id=10)
    mocker.patch('app.services.booking_services.create', return_value=ticket)
    payload = {
        "event_id": 1,
        "seat_type_id": 10,
        "user_id": 1
    }
    response = client.post('/api/bookings/create', json=payload)
    assert response.status_code == 200
    res_data = response.get_json()
    assert res_data["status"] == "success"


@pytest.mark.parametrize("invalid_payload", [
    {},
    {"event_id": 1},
    {"seat_type_id": 10},
])
def test_api_create_ticket_validation_error(client, invalid_payload):
    response = client.post('/api/bookings/create', json=invalid_payload)
    assert response.status_code == 400


def test_api_create_ticket_service_exception(client, mocker):
    mocker.patch(
        'app.services.booking_services.create',
        side_effect=AppException("Loại vé này đết còn", status_code=400)
    )
    payload = {"event_id": 1, "seat_type_id": 10}
    response = client.post('/api/bookings/create', json=payload)
    assert response.status_code == 400

def test_api_get_ticket_details_success(client, mocker):
    ticket = TicketModel(
        code="TCK00001",
        price=100000.0,
        user_id=1,
        seat=Seat(seat_code="A1", event=EventModel(name="Concert 2026"))
    )
    mocker.patch('app.services.booking_services.get_by_code', return_value=ticket)
    payload = {"code": "TCK00001"}
    response = client.get('/api/bookings/details', json=payload)

    assert response.status_code == 200
    res_data = response.get_json()
    assert res_data["status"] == "success"


def test_api_get_ticket_details_not_found(client, mocker):
    mocker.patch(
        'app.services.booking_services.get_by_code',
        side_effect=AppException("Không tìm thấy thông tin vé!", status_code=404)
    )

    payload = {"code": "NOT_EXIST"}
    response = client.get('/api/bookings/details', json=payload)

    assert response.status_code == 404


def test_api_list_tickets_success(client, mocker):
    tickets = [
       TicketModel(code="TCK001", price=100000.0, seat=Seat(seat_code="A1", event=EventModel(name="Ev1"))),
        TicketModel(code="TCK002", price=200000.0, seat=Seat(seat_code="A2", event=EventModel(name="Ev1")))
    ]
    mocker.patch('app.services.booking_services.list_tickets', return_value=tickets)

    response = client.get('/api/bookings/list')

    assert response.status_code == 200
    res_data = response.get_json()
    assert res_data["status"] == "success"


def test_api_cancel_ticket_success(client, mocker):
    mocker.patch('app.services.booking_services.cancel_ticket', return_value=True)

    payload = {"ticket_code": "TCK00001", "method": "momo"}
    response = client.post('/api/bookings/cancel', json=payload)

    assert response.status_code == 200
    res_data = response.get_json()
    assert res_data["message"] == "Hủy vé thành công"


def test_api_cancel_ticket_validation_error(client):
    payload = {"method": "momo"}
    response = client.post('/api/bookings/cancel', json=payload)

    assert response.status_code == 400


def test_api_cancel_ticket_forbidden(client, mocker):
    mocker.patch(
        'app.services.booking_services.cancel_ticket',
        side_effect=AppException("Bạn không có quyền hủy vé này!", status_code=403)
    )

    payload = {"ticket_code": "TCK_OTHER_USER", "method": "momo"}
    response = client.post('/api/bookings/cancel', json=payload)

    assert response.status_code == 403