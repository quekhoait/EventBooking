import pytest
from types import SimpleNamespace
from unittest.mock import Mock
from tests.conftest import test_app

from app.dto.auth_dto import RegisterRequestDto
from app.services import auth_services
from app.utils.exception import AppException
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity

@pytest.fixture
def user_repo_mock(mocker):
    return mocker.patch(
        "app.services.auth_services.user_repo",
    )

@pytest.fixture
def current_user_mock(mocker):
    user = mocker.Mock()
    mocker.patch(
        "app.services.auth_services.current_user",
        new=user,
    )
    return user

@pytest.fixture
def db_mock(mocker):
    return mocker.patch(
        "app.services.auth_services.db",
    )


@pytest.fixture
def send_otp_mock(mocker):
    return mocker.patch(
        "app.services.auth_services.send_otp",
    )


@pytest.fixture
def jwt_mock(mocker):
    mocker.patch(
        "app.services.auth_services.create_access_token",
        return_value="access_token",
    )
    mocker.patch(
        "app.services.auth_services.create_refresh_token",
        return_value="refresh_token",
    )


@pytest.fixture
def requests_mock(mocker):
    post = mocker.patch(
        "app.services.auth_services.requests.post"
    )
    get = mocker.patch(
        "app.services.auth_services.requests.get"
    )
    return post, get


@pytest.fixture
def user():
    user = Mock()
    user.id = 1
    user.email = "test@gmail.com"
    user.username = "testuser"
    user.password = None
    user.is_verified = False
    return user


@pytest.fixture
def register_data():
    return RegisterRequestDto().load({
        "email": "test@gmail.com",
        "username": "testuser",
        "password": "password123",
        "confirm_password": "password123",
        "role": "user",
    })


def test_generate_token(user, jwt_mock):
    result = auth_services.generate_token(user)

    assert result == (
        "access_token",
        "refresh_token",
    )


@pytest.mark.parametrize(
    "length",
    [1, 4, 6, 8, 10],
)
def test_generate_otp(length):
    result = auth_services._generate_otp(length)

    assert len(result) == length
    assert result.isdigit()


def test_hash_password():
    password = "password123"

    result = auth_services.bcrypt.hashpw(
        password.encode("utf-8"),
        auth_services.bcrypt.gensalt(),
    )

    assert auth_services.bcrypt.checkpw(
        password.encode("utf-8"),
        result,
    )


def test_send_otp(mocker, test_app):
    mocker.patch(
        "app.services.auth_services.url_for",
        return_value="http://localhost/verify",
    )

    message_mock = mocker.patch(
        "app.services.auth_services.Message"
    )

    mail_mock = mocker.patch(
        "app.services.auth_services.mail"
    )

    test_app.config["MAIL_USERNAME"] = "test@gmail.com"

    auth_services.send_otp(
        "test@gmail.com",
        "123456",
    )

    message_mock.assert_called_once()

    mail_mock.send.assert_called_once()

def test_send_otp_error(mocker):
    mocker.patch(
        "app.services.auth_services.url_for",
        side_effect=Exception("mail error"),
    )

    with pytest.raises(AppException) as exc:
        auth_services.send_otp(
            "test@gmail.com",
            "123456",
        )

    assert exc.value.status_code == 500


def test_register_with_email_success(
    user_repo_mock,
    db_mock,
    send_otp_mock,
    register_data,
    mocker,
    user,
):
    user_repo_mock.find_one.side_effect = [
        None,
        None,
    ]

    user_repo_mock.generate_username_unique.return_value = (
        "testuser"
    )

    user_repo_mock.create_user_email.return_value = user

    mocker.patch(
        "app.services.auth_services._generate_otp",
        return_value="123456",
    )

    result = auth_services.register_with_email(
        register_data
    )

    assert result == user


@pytest.mark.parametrize(
    "find_results, status_code",
    [
        ([Mock()], 400),
        ([None, Mock()], 400),
    ],
)
def test_register_with_email_duplicate(
    user_repo_mock,
    register_data,
    find_results,
    status_code,
):
    user_repo_mock.find_one.side_effect = find_results

    with pytest.raises(AppException) as exc:
        auth_services.register_with_email(
            register_data
        )

    assert exc.value.status_code == status_code


def test_register_with_email_exception(
    user_repo_mock,
    register_data,
):
    user_repo_mock.find_one.side_effect = [
        None,
        None,
    ]

    user_repo_mock.generate_username_unique.side_effect = (
        Exception("database error")
    )

    with pytest.raises(AppException) as exc:
        auth_services.register_with_email(
            register_data
        )

    assert exc.value.status_code == 500


@pytest.mark.parametrize(
    "user_value, otp_value, status_code",
    [
        (None, None, 404),
        (Mock(), None, 404),
    ],
)
def test_verify_email_otp_not_found(
    user_repo_mock,
    user_value,
    otp_value,
    status_code,
):
    user_repo_mock.find_one.return_value = user_value
    user_repo_mock.find_otp_laster_by_email.return_value = otp_value

    data = SimpleNamespace(
        email="test@gmail.com",
        verification_code="123456",
    )

    with pytest.raises(AppException) as exc:
        auth_services.verify_email_otp(data)

    assert exc.value.status_code == status_code


def test_verify_email_otp_invalid_code(
    user_repo_mock,
    user,
):
    otp = Mock()

    otp.otp_code_hash = (
        auth_services.bcrypt.hashpw(
            b"123456",
            auth_services.bcrypt.gensalt(),
        ).decode("utf-8")
    )

    user_repo_mock.find_one.return_value = user
    user_repo_mock.find_otp_laster_by_email.return_value = otp

    data = SimpleNamespace(
        email="test@gmail.com",
        verification_code="999999",
    )

    with pytest.raises(AppException) as exc:
        auth_services.verify_email_otp(data)

    assert exc.value.status_code == 400


def test_verify_email_otp_success(
    user_repo_mock,
    db_mock,
    jwt_mock,
    user,
):
    otp = Mock()

    otp.otp_code_hash = (
        auth_services.bcrypt.hashpw(
            b"123456",
            auth_services.bcrypt.gensalt(),
        ).decode("utf-8")
    )

    provider = Mock()
    provider.refresh_token = None

    user_repo_mock.find_one.return_value = user
    user_repo_mock.find_otp_laster_by_email.return_value = otp
    user_repo_mock.find_by_user_provider.return_value = provider

    data = SimpleNamespace(
        email="test@gmail.com",
        verification_code="123456",
    )

    result = auth_services.verify_email_otp(data)

    assert result == user
    assert user.is_verified is True
    assert provider.refresh_token == "refresh_token"


def test_re_send_otp_success(
    user_repo_mock,
    db_mock,
    send_otp_mock,
    mocker,
    user,
):
    user_repo_mock.find_one.return_value = user

    mocker.patch(
        "app.services.auth_services._generate_otp",
        return_value="123456",
    )

    result = auth_services.re_send_otp(
        "test@gmail.com"
    )

    assert result == {
        "message": "OTP đã được gửi lại thành công"
    }


def test_re_send_otp_user_not_found(
    user_repo_mock,
):
    user_repo_mock.find_one.return_value = None

    with pytest.raises(AppException) as exc:
        auth_services.re_send_otp(
            "test@gmail.com"
        )

    assert exc.value.status_code == 404


def test_initiate_google_login(mocker):
    session_mock = {}

    mocker.patch(
        "app.services.auth_services.session",
        session_mock,
    )

    mocker.patch(
        "app.services.auth_services.secrets.token_urlsafe",
        return_value="test-state",
    )

    result = auth_services.initiate_google_login()

    assert result.startswith(
        auth_services.Config.GOOGLE_AUTH_URL
    )

    assert "client_id=" in result
    assert "redirect_uri=" in result
    assert "state=test-state" in result
    assert session_mock["oauth_state"] == "test-state"


def test_login_with_google_existing_provider(
    requests_mock,
    user_repo_mock,
    db_mock,
    user,
):
    post_mock, get_mock = requests_mock

    post_mock.return_value.status_code = 200
    post_mock.return_value.json.return_value = {
        "access_token": "google_access_token",
        "refresh_token": "google_refresh_token",
    }

    get_mock.return_value.status_code = 200
    get_mock.return_value.json.return_value = {
        "id": "google123",
        "email": "test@gmail.com",
        "name": "Test User",
    }

    provider = Mock()
    provider.user_id = 1
    provider.refresh_token = None

    user_repo_mock.find_by_provider.return_value = provider
    user_repo_mock.find_one.return_value = user

    result = auth_services.login_with_google({
        "code": "google_code"
    })

    assert result == user
    assert provider.refresh_token == "google_refresh_token"


def test_login_with_google_existing_email(
    requests_mock,
    user_repo_mock,
    db_mock,
    user,
):
    post_mock, get_mock = requests_mock

    post_mock.return_value.status_code = 200
    post_mock.return_value.json.return_value = {
        "access_token": "google_access_token",
        "refresh_token": "google_refresh_token",
    }

    get_mock.return_value.status_code = 200
    get_mock.return_value.json.return_value = {
        "id": "google123",
        "email": "test@gmail.com",
        "name": "Test User",
    }

    user_repo_mock.find_by_provider.return_value = None
    user_repo_mock.find_one.return_value = user

    result = auth_services.login_with_google({
        "code": "google_code"
    })

    assert result == user


def test_login_with_google_new_user(
    requests_mock,
    user_repo_mock,
    db_mock,
):
    post_mock, get_mock = requests_mock

    post_mock.return_value.status_code = 200
    post_mock.return_value.json.return_value = {
        "access_token": "google_access_token",
        "refresh_token": "google_refresh_token",
    }

    get_mock.return_value.status_code = 200
    get_mock.return_value.json.return_value = {
        "id": "google123",
        "email": "test@gmail.com",
        "name": "Test User",
    }

    user = Mock()
    user.id = 1

    user_repo_mock.find_by_provider.return_value = None
    user_repo_mock.find_one.return_value = None
    user_repo_mock.generate_unique_username.return_value = "testuser"
    user_repo_mock.create_user_email.return_value = user

    result = auth_services.login_with_google({
        "code": "google_code"
    })

    assert result == user

#1
@pytest.mark.parametrize(
    "response",
    [
        {"error": "invalid_grant"},
        {"error": "invalid_client"},
        {"error": "server_error"},
    ],
)
def test_login_with_google_token_error(requests_mock, response):
    post_mock, _ = requests_mock

    post_mock.return_value.status_code = 400
    post_mock.return_value.json.return_value = response

    with pytest.raises(AppException) as exc:
        auth_services.login_with_google({
            "code": "invalid_code"
        })

    assert exc.value.status_code == 400
    assert exc.value.message == "Failed to exchange code with Google"


def test_login_with_google_userinfo_error(
    requests_mock,
):
    post_mock, get_mock = requests_mock

    post_mock.return_value.status_code = 200
    post_mock.return_value.json.return_value = {
        "access_token": "google_access_token",
    }

    get_mock.return_value.status_code = 400
    get_mock.return_value.json.return_value = {
        "error": "invalid_token",
    }

    with pytest.raises(AppException) as exc:
        auth_services.login_with_google({
            "code": "google_code"
        })

    assert exc.value.status_code == 400


def test_login_success(
    user_repo_mock,
    jwt_mock,
    user,
):
    password = "password123"

    user.password = (
        auth_services.bcrypt.hashpw(
            password.encode("utf-8"),
            auth_services.bcrypt.gensalt(),
        ).decode("utf-8")
    )

    user_repo_mock.find_one.return_value = user

    data = SimpleNamespace(
        email="test@gmail.com",
        password=password,
    )

    result = auth_services.login(data)

    assert result == user


@pytest.mark.parametrize(
    "user_value, password, status_code",
    [
        (None, "password123", 404),
        (Mock(), "wrong_password", 401),
    ],
)
def test_login_error(
    user_repo_mock,
    user_value,
    password,
    status_code,
):
    if user_value:
        user_value.password = (
            auth_services.bcrypt.hashpw(
                b"password123",
                auth_services.bcrypt.gensalt(),
            ).decode("utf-8")
        )

    user_repo_mock.find_one.return_value = user_value

    data = SimpleNamespace(
        email="test@gmail.com",
        password=password,
    )

    with pytest.raises(AppException) as exc:
        auth_services.login(data)

    assert exc.value.status_code == status_code


def test_logout_success(
    user_repo_mock,
    db_mock,
    current_user_mock,
    user,
):
    provider = Mock()
    provider.refresh_token = "refresh_token"

    current_user_mock.return_value = user
    user_repo_mock.get_provider.return_value = [
        provider
    ]

    result = auth_services.logout()

    assert result == {
        "message": "Đã đăng xuất thành công"
    }

    assert provider.refresh_token is None


def test_logout_user_not_found(mocker):
    mocker.patch.object(
        auth_services,
        "current_user",
        None,
    )

    with pytest.raises(AppException) as exc:
        auth_services.logout()

    assert exc.value.message == "Người dùng không tồn tại"
    assert exc.value.status_code == 404


def test_logout_without_refresh_token(
    user_repo_mock,
    current_user_mock,
    user,
):
    provider = Mock()
    provider.refresh_token = None

    current_user_mock.return_value = user
    user_repo_mock.get_provider.return_value = [
        provider
    ]

    result = auth_services.logout()

    assert result == {
        "message": "Không có phương thức xác thực nào để đăng xuất."
    }