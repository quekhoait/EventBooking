from datetime import datetime, timedelta
import email
from types import SimpleNamespace

import requests
from config import Config
from flask_jwt_extended import create_access_token, create_refresh_token

from app.dto.auth_dto import LoginDto, RegisterDto
from app.utils.exception import AppException
from app.repositories import user_repo
from app import mail, db
from flask_mail import Message
from flask import current_app, url_for
import bcrypt

from app.models import UserProvider


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
Your OTP code is:

{otp_code}

Verify your email:
{verify_url}

This code will expire in 5 minutes.
"""

        mail.send(message)

        print(f"[EMAIL] Sent OTP to {email}")

    except Exception as e:
        print("[EMAIL ERROR]", repr(e))
        raise


def register_with_email(data: RegisterDto):
    user = user_repo.find_one(email=data.email)

    if user:
        raise AppException("Email already exists", status_code=400)

    user = user_repo.find_one(username=data.username)
    if user:
        raise AppException("Username already exists", status_code=400)

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
        return (user, otp)
    except Exception as e:
        raise AppException(
            f"Error occurred while registering user: {str(e)}", status_code=500
        )


def verify_email_otp(data):
    user = user_repo.find_one(email=data.email)

    print(f"Data :", data)

    print(f"User :", user)
    print(f"User ID :", user.id if user else None)
    print(f"User Email :", user.email if user else None)
    print(f"User is_verified :", user.is_verified if user else None)

    if not user:
        raise AppException("User not found", status_code=404)

    email_otp = user_repo.find_otp_laster_by_email(data.email)
    if not email_otp:
        raise AppException("OTP not found", status_code=404)

    if not bcrypt.checkpw(
        data.verification_code.encode("utf-8"),
        email_otp.otp_code_hash.encode("utf-8"),
    ):
        raise AppException("Invalid OTP", status_code=400)

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
        raise AppException("User not found", status_code=404)

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
    return {"message": "OTP sent successfully"}


def login(data: LoginDto):
    user = user_repo.find_one(email=data.email)
    if not user:
        raise AppException("User not found", status_code=404)
    if not bcrypt.checkpw(data.password.encode("utf-8"), user.password.encode("utf-8")):
        raise AppException("Invalid password", status_code=401)

    return user
