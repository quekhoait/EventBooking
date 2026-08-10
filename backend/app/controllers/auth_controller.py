from flask_jwt_extended import jwt_required
from backend.app.dto.user_dto import UserResponseDto
from config import Config

from flask import Blueprint
from flask import request
from marshmallow import ValidationError
from app.dto import auth_dto

from app.utils.exception import AppException
from app.services import auth_services
from app.utils.json import NewPackage, StatusResponse

auth_api = Blueprint("auth_api", __name__, url_prefix="/auth")


@auth_api.route("/register", methods=["POST"])
def register():

    try:
        data = request.get_json()
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
        result = auth_dto.UserResponseDto().dump(user_response)

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
#             "auth/verify_otp.html",
#             email=email,
#             expires_at=None,
#             error="OTP has expired. Please request a new OTP.",
#         )

#     return render_template(
#         "auth/verify_otp.html", email=email, expires_at=otp.expires_at.isoformat()
#     )


@auth_api.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        validated_data = auth_dto.ResendOTPRequestDto().load(data)
        response = auth_services.re_send_otp(validated_data.email)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message={response["message"]},
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

    if request.method == "GET":
        data = {
            "code": request.args.get("code"),
            "state": request.args.get("state"),
        }

        error = request.args.get("error")
        if error:
            return NewPackage(
                status=StatusResponse.ERROR,
                message=f"Google Auth Error: {error}",
                status_code=400,
            )
    else:
        data = request.get_json(silent=True) or {}

    print(f"Received data from Google callback: {data}")
    user_response = auth_services.login_with_google(data)
    result = UserResponseDto().dump(user_response)
    print(f"User data to be sent in response: {result}")

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Đang nhập bằng Google thành công",
        data=result,
        status_code=200,
    )


@auth_api.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    validated_data = auth_dto.LoginRequestDto().load(data)
    user_response = auth_services.login(validated_data)
    result = auth_dto.UserResponseDto().dump(user_response)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Đăng nhập thành công",
        data=result,
        status_code=200,
    )


@auth_api.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    response = auth_services.logout()
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message=response["message"],
        status_code=200,
    )
