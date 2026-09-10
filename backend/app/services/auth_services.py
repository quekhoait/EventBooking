from datetime import datetime, timedelta
import traceback
from types import SimpleNamespace
from urllib.parse import urlencode

import requests
from config import Config
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    current_user,
    get_jwt_identity,
)

from app.utils.exception import AppException
from app.repositories import user_repo
from app import mail, db
from flask_mail import Message
from flask import current_app, url_for, session
import bcrypt

from app.models import UserProvider, RoleEnum, Company, User

import secrets
from urllib.parse import urlencode


def generate_token(user_id):
    access_token = create_access_token(identity=str(user_id))
    refresh_token = create_refresh_token(identity=str(user_id))
    return access_token, refresh_token


def _generate_otp(length=6):
    """Generate a random OTP code of the specified length."""
    import random
    import string

    characters = string.digits  # Use digits for OTP
    otp_code = "".join(random.choice(characters) for _ in range(length))
    return otp_code


def send_otp(email, otp_code):
    try:
        frontend_base_url = current_app.config.get(
            "FRONTEND_URL", "http://localhost:5173"
        )
        verify_url = f"{frontend_base_url}/verify-otp?email={email}"

        message = Message(
            subject="EventBooking - Verify your email",
            sender=current_app.config["MAIL_USERNAME"],
            recipients=[email],
        )

        message.body = f"""
            Xin chào,

            Mã OTP xác thực email của bạn là:

            {otp_code}

            Mã OTP có hiệu lực trong 2 phút.

            Bạn có thể xác thực email bằng cách nhấp vào liên kết sau:
            {verify_url}

            Vui lòng không chia sẻ mã OTP này với bất kỳ ai.

            Trân trọng,
            Đội ngũ hỗ trợ.
            """

        mail.send(message)

        print(f"[EMAIL] Sent OTP to {email}")

    except Exception as e:
        raise AppException(f"Gửi email OTP thất bại: {str(e)}", status_code=500)


def generate_hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _password_hash_bytes(password_hash):
    if isinstance(password_hash, bytes):
        return password_hash

    password_hash = str(password_hash)
    if password_hash.startswith("b'$2") and password_hash.endswith("'"):
        password_hash = password_hash[2:-1]
    return password_hash.encode("utf-8")


def register_with_email(data):
    # Lấy dữ liệu an toàn từ dict
    email = (
        data.get("email") if isinstance(data, dict) else getattr(data, "email", None)
    )
    username_input = (
        data.get("username")
        if isinstance(data, dict)
        else getattr(data, "username", None)
    )

    user = user_repo.find_one(email=email)
    if user:
        raise AppException("Email này đã được sử dụng", status_code=400)

    user = user_repo.find_one(username=username_input)
    if user:
        raise AppException("Tên người dùng đã tồn tại", status_code=400)

    try:
        username = user_repo.generate_username_unique(data.email, data.username)

        user = user_repo.create_user_email(
            email=email,
            username=username,
            password=generate_hash_password(password=data.password),
            role=RoleEnum.PENDING,
        )

        user_repo.create_user_provider(
            user_id=user.id,
            provider=(
                UserProvider.EMAIL.value if hasattr(UserProvider, "EMAIL") else "EMAIL"
            ),
            provider_id=email,
            refresh_token=None,
        )

        otp_code = str(_generate_otp(6)).strip()
        otp_hash = bcrypt.hashpw(otp_code.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )

        user_repo.create_email_otp(
            user_id=user.id,
            email=email,
            otp_code_hash=otp_hash,
            expires_at=datetime.now() + timedelta(minutes=2),
        )

        db.session.commit()

        send_otp(email, otp_code)
        return user

    except AppException as e:
        db.session.rollback()
        raise e
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        raise AppException(
            f"Đã xảy ra lỗi khi đăng ký người dùng: {repr(e)}", status_code=500
        )


def refresh_token():
    identity = get_jwt_identity()

    user = user_repo.find_one(id=identity)

    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)

    access_token = generate_token(user.id)[1]

    return {"access_token": access_token}


def verify_email_otp(data):
    user = user_repo.find_one(email=data.email)

    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)

    email_otp = user_repo.find_otp_laster_by_email(data.email)
    if not email_otp:
        raise AppException("Mã OTP không tồn tại", status_code=404)

    if not bcrypt.checkpw(
        data.verification_code.encode("utf-8"),
        email_otp.otp_code_hash.encode("utf-8"),
    ):
        raise AppException("Mã OTP không hợp lệ", status_code=400)

    user.is_verified = True

    db.session.commit()

    return user


def re_send_otp(email: str):
    user = user_repo.find_one(email=email)
    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)

    user_repo.delete_email_otp(user.email)  # Delete existing OTPs for the user

    otp_code = _generate_otp(6)  # Generate a new OTP code

    user_repo.create_email_otp(
        user_id=user.id,
        email=email,
        otp_code_hash=bcrypt.hashpw(otp_code.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        ),
        expires_at=datetime.now()
        + timedelta(minutes=2),  # Set the expiration time as needed
    )

    db.session.commit()

    send_otp(email, otp_code)
    return {"message": "OTP đã được gửi lại thành công"}


def initiate_google_login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state

    params = {
        "client_id": Config.GOOGLE_CLIENT_ID,
        "redirect_uri": Config.GOOGLE_REDIRECT_URL,
        "response_type": "code",
        "scope": Config.GOOGLE_CLIENT_SCOPE,
        "state": state,
        "prompt": "consent",
        "access_type": "offline",
    }

    return f"{Config.GOOGLE_AUTH_URL}?{urlencode(params)}"


def login_with_google(data):
    code = data.get("code") if isinstance(data, dict) else None
    if not code:
        raise AppException("Missing authorization code", status_code=400)

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": Config.GOOGLE_CLIENT_ID,
        "client_secret": Config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": Config.GOOGLE_REDIRECT_URL,
        "grant_type": "authorization_code",
    }

    token_res = requests.post(token_url, data=token_data)
    token_json = token_res.json()

    if token_res.status_code != 200 or "error" in token_json:
        raise AppException("Failed to exchange code with Google", status_code=400)

    google_access_token = token_json.get("access_token")

    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    userinfo_res = requests.get(
        userinfo_url, headers={"Authorization": f"Bearer {google_access_token}"}
    )
    google_user = userinfo_res.json()

    if userinfo_res.status_code != 200:
        raise AppException("Failed to fetch user profile from Google", status_code=400)

    google_data = SimpleNamespace(
        email=google_user.get("email"),
        username=google_user.get("name"),
        avatar=google_user.get("picture", "/static/image/icon_user.png"),
        provider_id=google_user.get("id"),
        refresh_token=token_json.get("refresh_token"),
    )

    auth_method = user_repo.find_by_provider(
        UserProvider.GOOGLE.value, google_data.provider_id
    )

    if auth_method:
        access_token, refresh_token = generate_token(auth_method.user_id)
        user = user_repo.find_one(id=auth_method.user_id)

        auth_method.refresh_token = refresh_token
        db.session.commit()

        payload = {
            "access_token": access_token,
            "user": user,
        }

        return payload

    user = user_repo.find_one(email=google_data.email)

    if not user:
        username = user_repo.generate_username_unique(
            google_data.email, google_data.username
        )
        user = user_repo.create_user_email(
            email=google_data.email,
            username=username,
            full_name=google_data.username,
            avatar=google_data.avatar,
            password=None,
            role=RoleEnum.PENDING,
            is_verified=True,
            is_active=True,
        )

    access_token, refresh_token = generate_token(user.id)

    user_repo.create_user_provider(
        user_id=user.id,
        provider=UserProvider.GOOGLE.value,
        provider_id=google_data.provider_id,
        refresh_token=refresh_token,
    )

    db.session.commit()

    payload = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }

    return payload


def login(data):
    user = user_repo.find_one(email=data.email)
    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)
    try:
        password_matches = bcrypt.checkpw(
            data.password.encode("utf-8"),
            _password_hash_bytes(user.password),
        )
    except (TypeError, ValueError):
        password_matches = False

    if not password_matches:
        raise AppException("Mật khẩu không đúng", status_code=401)

    print(f"[LOGIN] User {user.email} logged in successfully.")
    print(
        f"[LOGIN] User data: {user.id}, {user.username}, {user.email}, {user.role}, {user.is_active}, {user.is_verified}"
    )

    access_token, refresh_token = generate_token(user.id)

    user_provider = user_repo.find_by_provider(UserProvider.EMAIL.value, user.email)
    if user_provider:
        user_provider.refresh_token = refresh_token
        db.session.commit()

    has_preferences = user_repo.check_user_has_preferences(user.id)

    has_company = user.company_id is not None

    payload = {
        "access_token": access_token,
        "user": user,
        "has_preferences": has_preferences,
        "has_company": has_company,
    }
    return payload


def logout():
    user = current_user
    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)

    providers = user_repo.get_provider(user.id)
    for provider in providers:
        if provider.refresh_token:
            provider.refresh_token = None
            db.session.commit()
            return {"message": "Đã đăng xuất thành công"}

    return {"message": "Không có phương thức xác thực nào để đăng xuất."}


def update_user_role(data):
    user_id = (
        data.get("user_id")
        if isinstance(data, dict)
        else getattr(data, "user_id", None)
    )
    new_role_str = (
        data.get("role", "") if isinstance(data, dict) else getattr(data, "role", "")
    ).upper()

    if not user_id or new_role_str not in ["USER", "STAFF"]:
        raise AppException(
            "Thông tin vai trò hoặc người dùng không hợp lệ", status_code=400
        )

    user = user_repo.find_one(id=user_id)
    if not user:
        raise AppException("Không tìm thấy người dùng", status_code=404)

    user.role = RoleEnum[new_role_str]
    db.session.commit()

    return {
        "id": user.id,
        "role": (
            user.role.value if hasattr(user.role, "value") else str(user.role).lower()
        ),
    }
