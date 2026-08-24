from unittest.mock import patch

import pytest
from app import db
from app import create_app
from app.models import PaymentModel, PaymentStatus


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

MOMO_CREATE_RESPONSE = {
    "payUrl": "https://test-payment.momo.vn/pay/gate",
}

def test_api_not_found(client):
    response = client.get('/api/payments/momo')
    assert response.status_code == 404

@pytest.mark.parametrize("invalid_payload", [
    {},
    {"ticket_code": "TCK001"},
    {"method": "momo"},
])
def test_api_create_payment_validation_error(client, logged_in_user, invalid_payload):
    response = client.post('/api/payments/create', json=invalid_payload)
    assert response.status_code == 400

def test_create_momo_payment_success(client, logged_in_user):
    with patch('app.services.payment_services.create') as mock_create:
        mock_create.return_value = MOMO_CREATE_RESPONSE
        payload = {
            "ticket_code": "TKA00001",
            "method": "momo",
        }
        response = client.post('/api/payments/create', json=payload)
    assert response.status_code == 201
    res_data = response.json
    assert res_data['status'] == 'success'

def test_api_create_payment_unauthorized(client):
    payload = {"ticket_code": "TCK00001", "method": "momo"}
    response = client.post('/api/payments/create', json=payload)
    assert response.status_code == 401


def test_api_callback_payment_success(client, mocker):
    mock_payment = PaymentModel(code="PAY001", ticket_code="TCK00001", status=PaymentStatus.SUCCESS)
    mocker.patch('app.services.payment_services.callback', return_value=mock_payment)
    mock_send_ticket = mocker.patch('app.services.booking_services.send_ticket')
    payload = {
        "partnerCode": "MOMO",
        "orderId": "PAY001",
        "resultCode": 0,
        "amount": 100000
    }
    response = client.post('/api/payments/momo/callback', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Payment successful"
    mock_send_ticket.assert_called_once_with("TCK00001")

def test_api_refund_payment_success(client, logged_in_user, mocker):
    mocker.patch('app.services.payment_services.refund', return_value={"status": "REFUNDED"})

    payload = {"ticket_code": "TCK00001", "method": "momo"}
    response = client.post('/api/payments/refund', json=payload)

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Refund payment successful"

def test_api_transaction_payment_success(client, logged_in_user, mocker):
    mock_result = {"resultCode": 0, "message": "Success", "amount": 100000}
    mocker.patch('app.services.payment_services.transaction', return_value=mock_result)

    payload = {"orderId": "PAY001"}
    response = client.post('/api/payments/momo/transaction', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "success"
    assert data["data"]["resultCode"] == 0

