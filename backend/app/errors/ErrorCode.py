# error_codes.py
from enum import Enum

class ErrorCode(Enum):
    """
    Định nghĩa các lỗi nghiệp vụ hệ thống.
    Format: KEY = (message, status_code)
    """
    # --- Auth & User Errors ---
    UNAUTHORIZED = ("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn", 401)
    FORBIDDEN = ("Bạn không có quyền thực hiện thao tác này", 403)
    ACCOUNT_LOCKED = ("Tài khoản của bạn đã bị khóa", 403)
    USER_NOT_FOUND = ("Người dùng '%s' không tồn tại", 404)
    WRONG_PASSWORD = ("Mật khẩu không chính xác", 400)
    # --- Client Request Errors ---
    INVALID_INPUT = ("Dữ liệu gửi lên không hợp lệ", 400)
    NOT_FOUND = ("Tài nguyên yêu cầu không tồn tại", 404)
    ALREADY_EXISTS = ("%s '%s' đã tồn tại trong hệ thống", 409)

    # --- System Errors ---
    INTERNAL_SERVER_ERROR = ("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau", 500)

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code