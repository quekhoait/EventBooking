# exceptions.py
from werkzeug.exceptions import HTTPException


from app.errors.ErrorCode import ErrorCode
from app.utils.json import NewPackage, StatusResponse


class AppException(Exception):
    def __init__(self, error: str | ErrorCode, *args, status_code: int = None):
        super().__init__()

        if isinstance(error, ErrorCode):
            raw_message = error.message
            self.status_code = status_code or error.status_code
        else:
            raw_message = error
            self.status_code = status_code or 400
        if args:
            try:
                self.message = raw_message % args
            except TypeError:
                self.message = raw_message
        else:
            self.message = raw_message


def init_error_handlers(app):

    @app.errorhandler(AppException)
    def handle_app_exception(e: AppException):
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.message,
            status_code=e.status_code
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        return NewPackage(
            status=StatusResponse.ERROR,
            message=e.description,
            status_code=e.code
        )

    @app.errorhandler(Exception)
    def handle_global_exception(e: Exception):
        app.logger.error(f"Unhandled Exception: {str(e)}", exc_info=True)
        return NewPackage(
            status=StatusResponse.ERROR,
            message=ErrorCode.INTERNAL_SERVER_ERROR.message,
            status_code=500
        )