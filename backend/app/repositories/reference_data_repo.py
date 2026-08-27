# app/services/reference_data_service.py

from app.models import EventCategory, LocationModel, UserPreference
from app.repositories import base_repo
from app import db
from app.repositories.user_repo import find_valid_category_ids


def find_user_preferences(user_id):
    return UserPreference.query.filter_by(user_id=user_id).all()


def check_user_has_preferences(user_id):
    return UserPreference.query.filter_by(user_id=user_id).first() is not None


def get_user_preferred_category_ids(user_id):
    preferences = find_user_preferences(user_id)
    return [p.category_id for p in preferences]


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


def update_user_preferences(user_id, category_ids):
    """Xóa preferences cũ và thêm danh sách mới."""
    valid_ids = find_valid_category_ids(category_ids)

    # Xóa toàn bộ preferences hiện tại
    UserPreference.query.filter_by(user_id=user_id).delete()

    # Thêm lại các category hợp lệ
    for cat_id in set(valid_ids):
        pref = UserPreference(user_id=user_id, category_id=cat_id)
        db.session.add(pref)

    db.session.commit()
    return list(set(valid_ids))


def delete_single_preference(user_id, category_id):
    """Xóa 1 preference của user."""
    pref = UserPreference.query.filter_by(
        user_id=user_id, category_id=category_id
    ).first()
    if pref:
        db.session.delete(pref)
        db.session.commit()
        return True
    return False


def delete_all_user_preferences(user_id):
    """Xóa tất cả preferences của user."""
    UserPreference.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return True
