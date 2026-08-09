from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.utils.json import NewPackage, StatusResponse
from app.services import user_services

user_api = Blueprint("user_api", __name__, url_prefix="/user")


@user_api.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    print(f"Current user ID from JWT: {current_user_id}", flush=True)

    user = user_services.get_profile(user_id=current_user_id)
    print(f"Retrieved user profile: {user}", flush=True)

    if not user:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="User not found",
            status_code=404,
            data={"user_id": current_user_id},
        )

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Profile retrieved successfully",
        data={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_verified": user.is_verified,
        },
        status_code=200,
    )
