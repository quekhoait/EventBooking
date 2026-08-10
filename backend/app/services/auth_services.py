from datetime import datetime, timedelta
import email
from types import SimpleNamespace
from urllib.parse import urlencode

import requests
from config import Config
from flask_jwt_extended import create_access_token, create_refresh_token, current_user

from app.dto.auth_dto import LoginDto, LoginRequestDto, RegisterDto
from app.utils.exception import AppException
from app.repositories import user_repo
from app import mail, db
from flask_mail import Message
from flask import current_app, url_for, session
import bcrypt

from app.models import UserProvider

import secrets
from urllib.parse import urlencode


def generate_token(user):
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
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
        verify_url = url_for(
            "api.auth_api.verify_email_page", email=email, _external=True
        )

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


def register_with_email(data: RegisterDto):
    user = user_repo.find_one(email=data.email)

    if user:
        raise AppException("Email này đã được sử dụng", status_code=400)

    user = user_repo.find_one(username=data.username)
    if user:
        raise AppException("Tên người dùng đã tồn tại", status_code=400)

    try:
        otp_code = _generate_otp(6)  # Generate a random OTP code
        password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())
        user = user_repo.create_user_email(
            email=data.email,
            username=data.username,
            password=password_hash,
            role=data.role,
        )

        user_repo.create_user_provider(
            user_id=user.id,
            provider=UserProvider.EMAIL.value,
            provider_id=data.email,
            refresh_token=None,
        )

        otp = user_repo.create_email_otp(
            user_id=user.id,
            email=data.email,
            otp_code_hash=bcrypt.hashpw(otp_code.encode("utf-8"), bcrypt.gensalt()),
            expires_at=datetime.now()
            + timedelta(minutes=2),  # Set the expiration time as needed
        )

        db.session.commit()
        print(
            f"[OTP] Generated OTP for {data.email}: {otp_code}"
        )  # Log the OTP for debugging
        print(
            f"[OTP] OTP expires at: {otp.expires_at}"
        )  # Log the expiration time for debugging

        send_otp(data.email, otp_code)  # Send the OTP to the user's email)
        return user
    except Exception as e:
        raise AppException(
            f"Đã xảy ra lỗi khi đăng ký người dùng: {str(e)}", status_code=500
        )


def verify_email_otp(data):
    user = user_repo.find_one(email=data.email)

    print(f"Data :", data)

    print(f"User :", user)
    print(f"User ID :", user.id if user else None)
    print(f"User Email :", user.email if user else None)
    print(f"User is_verified :", user.is_verified if user else None)

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
    provider = user_repo.find_by_user_provider(user.id, UserProvider.EMAIL.value)
    if provider:
        refresh_token = generate_token(user)[1]
        provider.refresh_token = refresh_token

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
        otp_code_hash=bcrypt.hashpw(otp_code.encode("utf-8"), bcrypt.gensalt()),
        expires_at=datetime.now()
        + timedelta(minutes=2),  # Set the expiration time as needed
    )

    db.session.commit()

    send_otp(email, otp_code)
    return {"message": "OTP đã được gửi lại thành công"}


# khởi tạo đăng nhập với google, trả về link đăng nhập
def initiate_google_login():
    state = secrets.token_urlsafe(16)
    session["oauth_state"] = state
    google_auth_url = Config.GOOGLE_AUTH_URL
    params = {
        "client_id": Config.GOOGLE_CLIENT_ID,
        "redirect_uri": Config.GOOGLE_REDIRECT_URL,
        "response_type": "code",
        "scope": Config.GOOGLE_CLIENT_SCOPE,
        "state": state,
        "prompt": "consent",
        "access_type": "offline",
    }

    url = f"{google_auth_url}?{urlencode(params)}"

    return url


def login_with_google(data):

    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": data["code"],
        "client_id": Config.GOOGLE_CLIENT_ID,
        "client_secret": Config.GOOGLE_CLIENT_SECRET,
        "redirect_uri": Config.GOOGLE_REDIRECT_URL,
        "grant_type": "authorization_code",
    }

    token_res = requests.post(token_url, data=token_data)
    token_json = token_res.json()

    if token_res.status_code != 200 or "error" in token_json:
        raise AppException(
            message=token_json.get(
                "error_description", "Failed to exchange code with Google"
            ),
            status_code=400,
        )

    access_token = token_json.get("access_token")

    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    userinfo_res = requests.get(
        userinfo_url, headers={"Authorization": f"Bearer {access_token}"}
    )
    google_user = userinfo_res.json()

    if userinfo_res.status_code != 200:
        raise AppException("Failed to fetch user profile from Google", status_code=400)

    data = SimpleNamespace(
        email=google_user.get("email"),
        username=google_user.get("name"),
        provider_id=google_user.get("id"),
        refresh_token=token_json.get("refresh_token"),
        # role="user",  # Default role for Google users
    )

    print(f"Google user data: {data}")
    auth_method = user_repo.find_by_provider(
        UserProvider.GOOGLE.value, data.provider_id
    )

    if auth_method:
        user = user_repo.find_one(id=auth_method.user_id)
        auth_method.refresh_token = data.refresh_token
        db.session.commit()

        return user

    user = user_repo.find_one(email=data.email)

    if not user:
        # lấy user name trước @
        username = user_repo.generate_unique_username(data.email, data.username)
        user = user_repo.create_user_email(
            email=data.email,
            username=username,
            password=None,
            is_verified=True,  # Google users are considered verified
        )

    user_repo.create_user_provider(
        user_id=user.id,
        provider=UserProvider.GOOGLE.value,
        provider_id=data.provider_id,
        refresh_token=data.refresh_token,
    )

    db.session.commit()
    return user


def login(data: LoginRequestDto):
    user = user_repo.find_one(email=data.email)
    if not user:
        raise AppException("Người dùng không tồn tại", status_code=404)
    if not bcrypt.checkpw(data.password.encode("utf-8"), user.password.encode("utf-8")):
        raise AppException("Mật khẩu không đúng", status_code=401)

    access_token, refresh_token = generate_token(user)
    return user


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
