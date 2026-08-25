from app import db
from app.utils.exception import AppException
from app.repositories import user_repo
from app.dto.user_dto import UserProfileDto
from marshmallow import ValidationError


def get_profile(user_id):
    profile = user_repo.get_profile(user_id)
    if not profile:
        raise AppException("Profile not found", status_code=404)
    return profile


def update_profile(user_id, profile_data: UserProfileDto):
    try:
        user = user_repo.find_one(id=user_id)
        if not user:
            raise AppException("User not found", status_code=404)

        updated_profile = user_repo.update_user_profile(user, profile_data)
        db.session.commit()
        return updated_profile
    except Exception as e:
        db.session.rollback()
        raise AppException(f"Failed to update profile: {str(e)}", status_code=500)
    except ValidationError as e:
        raise AppException(f"Validation error: {e.messages}", status_code=400)
