import pytest
from unittest.mock import Mock
from flask_jwt_extended import create_access_token

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

    mock_service.return_value = {
        "user": user,
        "access_token": "mock_token"
    }
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
    mock_dump.assert_called_once_with({"user": user, "access_token": "mock_token"})


def test_register_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "invalid-email", "password": "password123", "confirm_password": "password123", "role": "user"}
    )
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_password_not_match(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "test@gmail.com", "password": "password123", "confirm_password": "diff", "role": "user"}
    )
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_invalid_role(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "test@gmail.com", "password": "password123", "confirm_password": "password123", "role": "invalid"}
    )
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_register_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.register_with_email"
    )
    mock_service.side_effect = AppException("Email này đã được sử dụng", status_code=400)
    response = client.post(
        "/api/auth/register",
        json={"email": "test@gmail.com", "password": "password123", "confirm_password": "password123", "role": "user"}
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

    mock_service.return_value = {
        "user": user,
        "access_token": "mock_token"
    }
    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
    }

    response = client.post(
        "/api/auth/verify-otp",
        json={"email": "test@gmail.com", "verification_code": "123456"},
    )

    assert response.status_code == 200
    mock_service.assert_called_once()
    mock_dump.assert_called_once_with({"user": user, "access_token": "mock_token"})


def test_verify_otp_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )
    response = client.post("/api/auth/verify-otp", json={"email": "invalid"})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_verify_otp_missing_code(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )
    response = client.post("/api/auth/verify-otp", json={"email": "test@gmail.com"})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_verify_otp_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.verify_email_otp"
    )
    mock_service.side_effect = AppException("Mã OTP không hợp lệ", status_code=400)
    response = client.post("/api/auth/verify-otp", json={"email": "test@gmail.com", "verification_code": "123456"})
    assert response.status_code == 400
    mock_service.assert_called_once()


def test_resend_otp_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )
    mock_service.return_value = {"message": "OTP đã được gửi lại thành công"}
    response = client.post("/api/auth/resend-otp", json={"email": "test@gmail.com"})
    assert response.status_code == 200
    mock_service.assert_called_once_with("test@gmail.com")


def test_resend_otp_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )
    response = client.post("/api/auth/resend-otp", json={"email": "invalid"})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_resend_otp_missing_email(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )
    response = client.post("/api/auth/resend-otp", json={})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_resend_otp_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.re_send_otp"
    )
    mock_service.side_effect = AppException("Người dùng không tồn tại", status_code=404)
    response = client.post("/api/auth/resend-otp", json={"email": "test@gmail.com"})
    assert response.status_code == 404
    mock_service.assert_called_once_with("test@gmail.com")


def test_google_login_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.initiate_google_login"
    )
    mock_service.return_value = "https://accounts.google.com/o/oauth2/auth"
    response = client.get("/api/auth/google/login")
    assert response.status_code == 200
    mock_service.assert_called_once()


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
    user.role = "user"

    mock_service.return_value = {
        "user": user,
        "access_token": "mock_token"
    }
    mock_dump.return_value = {
        "id": 1,
        "email": "test@gmail.com",
        "username": "testuser",
        "role": "user"
    }

    response = client.get(
        "/api/auth/google/callback",
        query_string={"code": "google_code", "state": "test_state"},
    )

    assert response.status_code == 302
    mock_service.assert_called_once_with({"code": "google_code", "state": "test_state"})
    mock_dump.assert_called_once_with({"user": user, "access_token": "mock_token"})


def test_google_callback_google_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )
    response = client.get("/api/auth/google/callback", query_string={"error": "access_denied"})
    assert response.status_code in (302, 400)
    mock_service.assert_not_called()


def test_google_callback_missing_code(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )
    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )
    user = Mock()
    mock_service.return_value = {"user": user, "access_token": "mock_token"}
    mock_dump.return_value = {}

    response = client.get("/api/auth/google/callback", query_string={"state": "test_state"})
    mock_service.assert_called_once_with({"code": None, "state": "test_state"})


def test_google_callback_post_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )
    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()
    mock_service.return_value = {"user": user, "access_token": "mock_token"}
    mock_dump.return_value = {"id": 1, "email": "test@gmail.com"}

    data = {"code": "google_code", "state": "test_state"}
    response = client.post("/api/auth/google/callback", json=data)

    assert response.status_code == 200
    mock_service.assert_called_once_with(data)
    mock_dump.assert_called_once_with({"user": user, "access_token": "mock_token"})


def test_google_callback_post_empty_data(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )
    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )
    user = Mock()
    mock_service.return_value = {"user": user, "access_token": "mock_token"}
    mock_dump.return_value = {}

    response = client.post("/api/auth/google/callback", json={})
    assert response.status_code == 200
    mock_service.assert_called_once_with({})


def test_google_callback_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login_with_google"
    )
    mock_service.side_effect = AppException("Failed to exchange code", status_code=400)
    response = client.post("/api/auth/google/callback", json={"code": "invalid"})
    assert response.status_code == 400
    mock_service.assert_called_once()


def test_login_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login"
    )
    mock_dump = mocker.patch(
        "app.controllers.auth_controller.UserResponseDto.dump"
    )

    user = Mock()
    user.role = "user"
    user.is_active = True
    
    mock_service.return_value = {"user": user, "access_token": "mock_token"}
    mock_dump.return_value = {"id": 1, "email": "test@gmail.com"}

    response = client.post(
        "/api/auth/login",
        json={"email": "test@gmail.com", "password": "password123"},
    )

    assert response.status_code == 200
    mock_service.assert_called_once()
    mock_dump.assert_called_once_with({"user": user, "access_token": "mock_token"})


def test_login_validation_error(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login"
    )
    response = client.post("/api/auth/login", json={"email": "invalid", "password": "123"})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_login_missing_password(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login"
    )
    response = client.post("/api/auth/login", json={"email": "test@gmail.com"})
    assert response.status_code == 400
    mock_service.assert_not_called()


def test_login_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.login"
    )
    mock_service.side_effect = AppException("Mật khẩu không đúng", status_code=401)
    response = client.post("/api/auth/login", json={"email": "test@gmail.com", "password": "wrong"})
    assert response.status_code == 401
    mock_service.assert_called_once()


def test_logout_success(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.logout"
    )
    mock_service.return_value = {"message": "Đã đăng xuất thành công"}
    access_token = create_access_token(identity="1")

    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    assert response.json["message"] == "Đã đăng xuất thành công"
    mock_service.assert_called_once()


def test_logout_without_token(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.logout"
    )
    response = client.post("/api/auth/logout")
    assert response.status_code == 401
    mock_service.assert_not_called()


def test_logout_app_exception(client, mocker):
    mock_service = mocker.patch(
        "app.controllers.auth_controller.auth_services.logout"
    )
    mock_service.side_effect = AppException("Người dùng không tồn tại", status_code=404)
    access_token = create_access_token(identity="1")

    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 404
    mock_service.assert_called_once()