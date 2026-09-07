from app import db
from app.models import RoleEnum, Company
from app.utils.exception import AppException
from app.repositories import user_repo
from app.dto.user_dto import UserProfileDto
from marshmallow import ValidationError

from app.models.UserModel import UserPreference


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

        print(
            f"Updating profile for user {user_id} with data: {profile_data}", flush=True
        )

        updated_profile = user_repo.update_user_profile(user, profile_data)

        print(f"Updated profile for user {user_id}: {updated_profile}", flush=True)
        db.session.commit()
        return updated_profile
    except Exception as e:
        db.session.rollback()
        raise AppException(f"Failed to update profile: {str(e)}", status_code=500)
    except ValidationError as e:
        raise AppException(f"Validation error: {e.messages}", status_code=400)


def create_user_company(user_id, data, oauth_provider=None):

    user = user_repo.find_one(id=user_id)
    role = user.role
    company_id = data.get("company_id")

    if role == RoleEnum.STAFF.value:
        if company_id:
            company = Company.query.get(company_id)
            if not company:
                raise ValueError("Company không tồn tại")
        else:
            location_id = data.get("location_id")
            if not location_id:
                raise ValueError("location_id là bắt buộc khi tạo company")

            company = Company(
                name=data.get("company_name"),
                address=data.get("company_address"),
                tax_code=data.get("tax_code"),
                description=data.get("description"),
                location_id=location_id,
            )
            db.session.add(company)
            db.session.flush()

            return company

    return None
