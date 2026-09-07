from http.client import responses

from flask_jwt_extended import jwt_required
import urllib
from app.dto.user_dto import UserResponseDto

from flask import Blueprint, redirect
from flask import request
from marshmallow import ValidationError
from app.dto import auth_dto, user_dto

from app.utils.exception import AppException
from app.services import auth_services
from app.utils.json import NewPackage, StatusResponse
from app.models.UserModel import RoleEnum, UserPreference

auth_api = Blueprint("auth_api", __name__, url_prefix="/auth")


@auth_api.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        print(f"Received registration data: {data}")
        validated_data = auth_dto.RegisterRequestDto().load(data)
        user_response = auth_services.register_with_email(validated_data)
        result = UserResponseDto().dump(user_response)
        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Đã gửi OTP đến email của bạn. Vui lòng kiểm tra email để xác thực tài khoản.",
            data=result,
            status_code=201,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Validation error",
            data=e.messages,
            status_code=400,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )


@auth_api.route("/verify-otp", methods=["POST"])
def verify_otp():

    try:
        data = request.get_json()
        validated_data = auth_dto.VerifyEmailRequestDto().load(data)
        user_response = auth_services.verify_email_otp(validated_data)
        result = user_dto.UserResponseDto().dump(user_response)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Xác thực email thành công",
            data=result,
            status_code=200,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Validation error",
            data=e.messages,
            status_code=400,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )


# @auth_api.route("/verify-email", methods=["GET"])
# def verify_email_page():

#     email = request.args.get("email")

#     if not email:
#         return "Email is required", 400

#     # Lấy OTP hiện tại của email
#     otp = user_repo.get_active_otp(email)

#     if not otp:
#         return render_template(
#             "services/verify_otp.html",
#             email=email,
#             expires_at=None,
#             error="OTP has expired. Please request a new OTP.",
#         )

#     return render_template(
#         "services/verify_otp.html", email=email, expires_at=otp.expires_at.isoformat()
#     )


@auth_api.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        validated_data = auth_dto.ResendOTPRequestDto().load(data)
        response = auth_services.re_send_otp(validated_data.email)
        result = response["message"]
        return NewPackage(
            status=StatusResponse.SUCCESS,
            message=result,
            status_code=200,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Validation error",
            data=e.messages,
            status_code=400,
        )


# trả về link đăng nhập
@auth_api.route("/google/login", methods=["GET"])
def initiate_google_login():
    init_url = auth_services.initiate_google_login()

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Đã tạo liên kết đăng nhập Google thành công.",
        data={"auth_url": init_url},
        status_code=200,
    )


@auth_api.route("/google/callback", methods=["POST", "GET"])
def handle_google_callback():
    frontend_base_url = "http://localhost:5173"

    if request.method == "GET":
        error = request.args.get("error")
        if error:
            error_params = urllib.parse.urlencode({"error": error})
            return redirect(f"{frontend_base_url}/login?{error_params}")
        data = {
            "code": request.args.get("code"),
            "state": request.args.get("state"),
        }
    else:
        data = request.get_json(silent=True) or {}

    print(f"Received data from Google callback: {data}")

    user_response = auth_services.login_with_google(data)
    result = UserResponseDto().dump(user_response["user"])
    print(f"User data to be sent in response: {result}")

    if request.method == "GET":
        raw_role = result.get("role")
        if isinstance(raw_role, RoleEnum):
            clean_role = raw_role.value
        elif isinstance(raw_role, str):
            clean_role = raw_role.replace("RoleEnum.", "").lower()
        else:
            clean_role = "pending"

        params = urllib.parse.urlencode(
            {
                "token": user_response.get("access_token", ""),
                "role": clean_role,  # Trả về chuỗi sạch: "pending"
                "username": result.get("username", ""),
                "id": result.get("id", ""),
                "email": result.get("email", ""),
                "has_preferences": "true" if result.get("has_preferences") else "false",
            }
        )
        return redirect(f"{frontend_base_url}/auth/google/callback?{params}")

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Đăng nhập bằng Google thành công",
        data=result,
        status_code=200,
    )


@auth_api.route("/update-role", methods=["POST"])
def update_user_role():
    data = request.get_json(silent=True) or {}

    result = auth_services.update_user_role(data)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Cập nhật vai trò thành công",
        data=result,
        status_code=200,
    )


@auth_api.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        validated_data = auth_dto.LoginRequestDto().load(data)
        user_response = auth_services.login(validated_data)
        access_token = user_response.get("access_token")
        result = user_dto.UserResponseDto().dump(user_response["user"])
        has_preferences = user_response.get("has_preferences")
        print(f"User data to be sent in response: {result}")
        print(f"Access token to be sent in response: {access_token}")
        print(f"Has preferences: {has_preferences}")

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Đăng nhập thành công",
            data={
                "user": result,
                "access_token": access_token,
                "has_preferences": has_preferences,
            },
            status_code=200,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Validation error",
            data=e.messages,
            status_code=400,
        )


@auth_api.route("/refresh_token", methods=["POST"])
@jwt_required()
def refresh_token():
    response = auth_services.refresh_token()
    result = response["message"]
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message=result,
        status_code=200,
    )


@auth_api.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = auth_services.logout()
    result = response["message"]
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message=result,
        status_code=200,
    )
