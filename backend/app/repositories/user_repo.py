from datetime import datetime, timezone
import re
import uuid

from app.models import User
from app import db
from app.models.UserModel import EmailOTP, UserAuthMethod, UserPreference, UserProvider
from app.models.EventModel import EventCategory


def find_one(**kwargs):
    return User.query.filter_by(**kwargs).first()


def generate_username_unique(email, username=None):
    if not username:
        username = email.split("@")[0]

    unique_username = username
    counter = 1
    while find_one(username=unique_username):
        unique_username = f"{username}_{counter}"
        counter += 1

    return unique_username


def create_user_email(
    email,
    username,
    password,
    full_name=None,
    role=None,
    avatar=None,
    is_verified=False,
    is_active=True,
):

    user = User(
        email=email,
        username=username,
        full_name=full_name,
        password=password,
        role=role,
        is_verified=is_verified,
        avatar=avatar,
        is_active=is_active,
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


def get_provider(user_id):
    return UserAuthMethod.query.filter_by(user_id=user_id).all()


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


def update_user_profile(user, profile_data):
    for key, value in profile_data.items():
        setattr(user, key, value)
    db.session.commit()
    return user


def find_user_preferences(user_id):
    return UserPreference.query.filter_by(user_id=user_id).all()


def check_user_has_preferences(user_id):
    return UserPreference.query.filter_by(user_id=user_id).first() is not None


def get_user_preferred_category_ids(user_id):
    preferences = find_user_preferences(user_id)
    return [p.category_id for p in preferences]


def get_all_active_categories():
    return EventCategory.query.all()


def find_valid_category_ids(category_ids):
    categories = EventCategory.query.filter(EventCategory.id.in_(category_ids)).all()
    return [c.id for c in categories]


def add_user_preferences(user_id, category_ids):
    existing_ids = set(get_user_preferred_category_ids(user_id))
    valid_ids = find_valid_category_ids(category_ids)

    new_records = []
    for cat_id in valid_ids:
        if cat_id not in existing_ids:
            pref = UserPreference(user_id=user_id, category_id=cat_id)
            db.session.add(pref)
            new_records.append(pref)

    db.session.commit()
    return [p.category_id for p in new_records]
