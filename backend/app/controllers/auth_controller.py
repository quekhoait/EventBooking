import secrets
from urllib.parse import urlencode
from config import Config

from flask import Blueprint, redirect, render_template, session
from flask import request
from marshmallow import ValidationError

from app.dto.auth_dto import LoginDto, RegisterDto, VerifyEmailDto, GoogleLoginDto
from app.utils.exception import AppException
from app.services import auth_services
from app.utils.json import NewPackage, StatusResponse
from app.repositories import user_repo

auth_api = Blueprint("auth_api", __name__, url_prefix="/auth")


@auth_api.route("/register", methods=["POST"])
def register():

    try:
        data = request.get_json()
        validated_data = RegisterDto().load(data)
        user, otp = auth_services.register_with_email(validated_data)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="OTP sent successfully. Please check your email for the verification code.",
            data={"user_id": user.id, "email": user.email},
            status_code=201,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Invalid input data",
            data={"errors": e.messages},
            status_code=400,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )


# @auth_api.route("/verify-otp", methods=["POST"])
# def verify_otp():

#     try:

#         data = request.get_json()

#         validated_data = VerifyEmailDto().load(data)

#         user = auth_services.verify_email_otp(validated_data)

#         return NewPackage(
#             status=StatusResponse.SUCCESS,
#             message="User registered successfully",
#             data={
#                 "user_id": user.id,
#                 "email": user.email,
#             },
#             status_code=200,
#         )

#     except ValidationError as e:

#         return NewPackage(
#             status=StatusResponse.ERROR,
#             message="Invalid OTP data",
#             data={"errors": e.messages},
#             status_code=400,
#         )

#     except AppException as e:

#         return NewPackage(
#             status=StatusResponse.ERROR,
#             message=e.message,
#             status_code=e.status_code,
#         )


@auth_api.route("/verify-email", methods=["GET"])
def verify_email_page():

    email = request.args.get("email")

    if not email:
        return "Email is required", 400

    # Lấy OTP hiện tại của email
    otp = user_repo.get_active_otp(email)

    if not otp:
        return render_template(
            "auth/verify_otp.html",
            email=email,
            expires_at=None,
            error="OTP has expired. Please request a new OTP.",
        )

    return render_template(
        "auth/verify_otp.html", email=email, expires_at=otp.expires_at.isoformat()
    )


@auth_api.route("/verify-otp", methods=["POST"])
def verify_otp():

    email = request.form.get("email")

    try:
        data = request.form.to_dict()
        validated_data = VerifyEmailDto().load(data)
        user = auth_services.verify_email_otp(validated_data)

        return render_template("auth/verify_success.html", user=user)

    except ValidationError as e:

        otp = user_repo.get_active_otp(email)

        return (
            render_template(
                "auth/verify_otp.html",
                email=email,
                expires_at=(otp.expires_at.isoformat() if otp else None),
                error="Invalid OTP. Please try again.",
            ),
            400,
        )

    except AppException as e:

        otp = user_repo.get_active_otp(email)

        return (
            render_template(
                "auth/verify_otp.html",
                email=email,
                expires_at=(otp.expires_at.isoformat() if otp else None),
                error=e.message,
            ),
            e.status_code,
        )


@auth_api.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json()
        email = data.get("email")
        if not email:
            return NewPackage(
                status=StatusResponse.ERROR,
                message="Email is required",
                status_code=400,
            )

        result = auth_services.re_send_otp(email)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="OTP resent successfully",
            status_code=200,
        )

    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )


@auth_api.route("/google/login", methods=["GET"])
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

    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Google auth URL generated",
        data={"auth_url": url},
        status_code=200,
    )


@auth_api.route("/google/callback", methods=["POST", "GET"])
def handle_google_callback():
    try:

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

        result = auth_services.login_with_google(data)
        print(f"Google login result: {result}")

        user = {
            "id": result.id,
            "email": result.email,
            "username": result.username,
            "is_verified": result.is_verified,
        }

        print(f"User data to be sent in response: {user}")
        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Google login successful",
            data=user,
            status_code=200,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Invalid input data",
            data={"errors": e.messages},
            status_code=400,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )


@auth_api.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        validated_data = LoginDto().load(data)
        result = auth_services.login(validated_data)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Login successful",
            data=result,
            status_code=200,
        )
    except ValidationError as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message="Invalid input data",
            data={"errors": e.messages},
            status_code=400,
        )
    except AppException as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code,
        )
