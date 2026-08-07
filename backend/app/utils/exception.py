# exceptions.py
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException


from app.errors.ErrorCode import ErrorCode
from app.utils.json import NewPackage, StatusResponse


class AppException(Exception):
    def __init__(self, error: str | ErrorCode, *args, status_code: int = None):
        super().__init__()

        # 1. Nếu tham số đầu tiên là ErrorCode Enum
        if isinstance(error, ErrorCode):
            raw_message = error.message
            # Ưu tiên status_code truyền vào, nếu không thì lấy status_code mặc định của Enum
            self.status_code = status_code or error.status_code
        # 2. Nếu tham số đầu tiên là chuỗi String
        else:
            raw_message = error
            self.status_code = status_code or 400

        # Nếu có truyền các tham số động (*args) -> Thay thế vào %s / %d
        if args:
            try:
                self.message = raw_message % args
            except TypeError:
                self.message = raw_message
        else:
            self.message = raw_message


def init_error_handlers(app):
    """Đăng ký các global error handlers vào app Flask"""

    # 1. Bắt tất cả AppException do dev tự raise
    @app.errorhandler(AppException)
    def handle_app_exception(e: AppException):
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code
        )

    # 2. Bắt các lỗi HTTP tiêu chuẩn của Flask/Werkzeug (404, 405, 400, v.v.)
    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.description,
            status_code=e.code
        )

    @app.errorhandler(ValidationError)
    def handle_marshmallow_validation(e: ValidationError):
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.messages,  # Trả về dict chi tiết các trường bị lỗi
            status_code=400
        )

    # 3. Bắt tất cả lỗi không lường trước (Crash, Bug, Lỗi 500)
    @app.errorhandler(Exception)
    def handle_global_exception(e: Exception):
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return NewPackage(
            status=StatusResponse.ERROR,
            message=ErrorCode.INTERNAL_SERVER_ERROR.message,
            status_code=500
        )