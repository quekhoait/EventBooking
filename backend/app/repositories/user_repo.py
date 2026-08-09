from datetime import datetime, timezone
import re
import uuid

from app.models import User
from app import db
from app.models.UserModel import EmailOTP, UserAuthMethod, UserProvider


def find_one(**kwargs):
    return User.query.filter_by(**kwargs).first()


def create_user_email(email, username, password, role=None, is_verified=False):

    user = User(
        email=email,
        username=username,
        password=password,
        role=role,
        is_verified=is_verified,
    )

    db.session.add(user)
    db.session.flush()
    return user


def update(user):
    db.session.commit()
    return user


def find_by_provider(provider, provider_id):
    return UserAuthMethod.query.filter_by(
        provider=provider, provider_id=provider_id
    ).first()


def find_by_user_provider(user_id, provider):
    return UserAuthMethod.query.filter_by(user_id=user_id, provider=provider).first()


def create_user_provider(user_id, provider, provider_id, refresh_token):
    auth_method = UserAuthMethod(
        user_id=user_id,
        provider=provider,
        provider_id=provider_id,
        refresh_token=refresh_token,
    )
    db.session.add(auth_method)
    db.session.flush()
    return auth_method


def find_otp_laster_by_email(email):
    return EmailOTP.query.filter_by(email=email).order_by(EmailOTP.id.desc()).first()


def create_email_otp(user_id, email, otp_code_hash, expires_at):
    email_otp = EmailOTP(
        user_id=user_id,
        email=email,
        otp_code_hash=otp_code_hash,
        expires_at=expires_at,
    )
    db.session.add(email_otp)
    db.session.flush()
    return email_otp


def get_active_otp(email):
    return (
        EmailOTP.query.filter(
            EmailOTP.email == email, EmailOTP.expires_at > datetime.now(timezone.utc)
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )


def delete_email_otp(email):
    email_otps = EmailOTP.query.filter(EmailOTP.email == email).all()

    for otp in email_otps:
        db.session.delete(otp)

    db.session.commit()


def get_profile(user_id):
    return User.query.filter_by(id=user_id).first()
