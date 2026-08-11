import pytest
from unittest.mock import Mock

from app import create_app, db
from app.utils.exception import AppException


@pytest.fixture(autouse=True)
def app_context():
    app = create_app("testing_fake")

    ctx = app.app_context()
    ctx.push()

    db.create_all()

    yield app

    db.session.remove()
    db.drop_all()
    ctx.pop()


@pytest.fixture
def client(app_context):
    return app_context.test_client()


# ============================================================
# REGISTER
# ============================================================

def test_register_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()
    user.id = 1
    user.email = "test@gmail.com"
    user.username = "testuser"

    mock_service.return_value = user
    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
    }

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@gmail.com",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "password123",
            "role": "user",
        },
    )

    assert response.status_code == 201

    mock_service.assert_called_once()
    mock_dump.assert_called_once_with(user)


def test_register_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "invalid-email",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "password123",
            "role": "user",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_password_not_match(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@gmail.com",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "different",
            "role": "user",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_invalid_role(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@gmail.com",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "password123",
            "role": "invalid",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )

    mock_service.side_effect = AppException(
        "Email này đã được sử dụng",
        status_code=400,
    )

    response = client.post(
        "/api/auth/register",
        json={
            "email": "test@gmail.com",
            "username": "testuser",
            "password": "password123",
            "confirm_password": "password123",
            "role": "user",
        },
    )

    assert response.status_code == 400
    mock_service.assert_called_once()



def test_verify_otp_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()
    user.id = 1
    user.email = "test@gmail.com"
    user.username = "testuser"

    mock_service.return_value = user

    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
    }

    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "test@gmail.com",
            "verification_code": "123456",
        },
    )

    assert response.status_code == 200

    mock_service.assert_called_once()
    mock_dump.assert_called_once_with(user)


def test_verify_otp_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )

    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "invalid-email",
            "verification_code": "123456",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_verify_otp_missing_code(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )

    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "test@gmail.com",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_verify_otp_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )

    mock_service.side_effect = AppException(
        "Mã OTP không hợp lệ",
        status_code=400,
    )

    response = client.post(
        "/api/auth/verify-otp",
        json={
            "email": "test@gmail.com",
            "verification_code": "123456",
        },
    )

    assert response.status_code == 400
    mock_service.assert_called_once()


def test_resend_otp_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )

    mock_service.return_value = {
        "message": "OTP đã được gửi lại thành công"
    }

    response = client.post(
        "/api/auth/resend-otp",
        json={
            "email": "test@gmail.com",
        },
    )

    assert response.status_code == 200

    mock_service.assert_called_once_with("test@gmail.com")


def test_resend_otp_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )

    response = client.post(
        "/api/auth/resend-otp",
        json={
            "email": "invalid-email",
        },
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_resend_otp_missing_email(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )

    response = client.post(
        "/api/auth/resend-otp",
        json={},
    )

    assert response.status_code == 400
    mock_service.assert_not_called()


def test_resend_otp_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )

    mock_service.side_effect = AppException(
        "Người dùng không tồn tại",
        status_code=404,
    )

    response = client.post(
        "/api/auth/resend-otp",
        json={
            "email": "test@gmail.com",
        },
    )

    assert response.status_code == 404

    mock_service.assert_called_once_with("test@gmail.com")


# ============================================================
# GOOGLE LOGIN
# ============================================================

def test_google_login_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.initiate_google_login"
    )

    google_url = (
        "https://accounts.google.com/o/oauth2/auth"
        "?client_id=test"
    )

    mock_service.return_value = google_url

    response = client.get(
        "/api/auth/google/login"
    )

    assert response.status_code == 200

    mock_service.assert_called_once()


# ============================================================
# GOOGLE CALLBACK - GET
# ============================================================

def test_google_callback_get_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()
    user.id = 1
    user.email = "test@gmail.com"
    user.username = "testuser"

    mock_service.return_value = user

    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
    }

    response = client.get(
        "/api/auth/google/callback",
        query_string={
            "code": "google_code",
            "state": "test_state",
        },
    )

    assert response.status_code == 200

    mock_service.assert_called_once_with(
        {
            "code": "google_code",
            "state": "test_state",
        }
    )

    mock_dump.assert_called_once_with(user)


def test_google_callback_google_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    response = client.get(
        "/api/auth/google/callback",
        query_string={
            "error": "access_denied",
        },
    )

    assert response.status_code == 400

    mock_service.assert_not_called()


def test_google_callback_missing_code(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()

    mock_service.return_value = user
    mock_dump.return_value = {}

    response = client.get(
        "/api/auth/google/callback",
        query_string={
            "state": "test_state",
        },
    )

    mock_service.assert_called_once_with(
        {
            "code": None,
            "state": "test_state",
        }
    )


# ============================================================
# GOOGLE CALLBACK - POST
# ============================================================

def test_google_callback_post_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()

    mock_service.return_value = user

    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
    }

    data = {
        "code": "google_code",
        "state": "test_state",
    }

    response = client.post(
        "/api/auth/google/callback",
        json=data,
    )

    assert response.status_code == 200

    mock_service.assert_called_once_with(data)
    mock_dump.assert_called_once_with(user)


def test_google_callback_post_empty_data(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()

    mock_service.return_value = user
    mock_dump.return_value = {}

    response = client.post(
        "/api/auth/google/callback",
        json={},
    )

    assert response.status_code == 200

    mock_service.assert_called_once_with({})


def test_google_callback_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )

    mock_service.side_effect = AppException(
        "Failed to exchange code with Google",
        status_code=400,
    )

    response = client.post(
        "/api/auth/google/callback",
        json={
            "code": "invalid_code",
        },
    )

    assert response.status_code == 400

    mock_service.assert_called_once()
