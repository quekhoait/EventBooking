from enum import Enum

class ErrorCode(Enum):
    """
    Định nghĩa các lỗi nghiệp vụ hệ thống.
    Format: KEY = (message, status_code)
    """
    # ==========================================
    # 1. Auth & User Errors
    # ==========================================
    UNAUTHORIZED = ("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn", 401)
    FORBIDDEN = ("Bạn không có quyền thực hiện thao tác này", 403)
    ACCOUNT_LOCKED = ("Tài khoản của bạn đã bị khóa", 403)
    USER_NOT_FOUND = ("Người dùng không tồn tại", 404)
    USER_ALREADY_EXISTS = ("Email hoặc số điện thoại đã được đăng ký", 409)
    WRONG_PASSWORD = ("Mật khẩu không chính xác", 400)
    INVALID_TOKEN = ("Token không hợp lệ hoặc đã hết hạn", 401)

    # ==========================================
    # 2. Client & System Errors
    # ==========================================
    INVALID_INPUT = ("Dữ liệu gửi lên không hợp lệ", 400)
    NOT_FOUND = ("Tài nguyên yêu cầu không tồn tại", 404)
    ALREADY_EXISTS = ("Dữ liệu đã tồn tại trong hệ thống", 409)
    INTERNAL_SERVER_ERROR = ("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau", 500)
    FILE_TOO_LARGE = ("Kích thước file vượt quá giới hạn cho phép", 400)
    INVALID_FILE_TYPE = ("Định dạng file không hỗ trợ", 400)

    # ==========================================
    # 3. Location & Company Errors
    # ==========================================
    LOCATION_NOT_FOUND = ("Vị trí địa lý không tồn tại", 404)
    COMPANY_NOT_FOUND = ("Công ty/Ban tổ chức không tồn tại", 404)
    COMPANY_INACTIVE = ("Công ty chưa được kích hoạt hoặc đã ngưng hoạt động", 400)

    # ==========================================
    # 4. Event Category Errors
    # ==========================================
    CATEGORY_NOT_FOUND = ("Danh mục sự kiện không tồn tại", 404)

    # ==========================================
    # 5. Event Validation Errors (Nghiep vu Event)
    # ==========================================
    EVENT_NOT_FOUND = ("Sự kiện không tồn tại", 404)
    EVENT_NAME_EXISTS = ("Tên sự kiện đã tồn tại trong khoảng thời gian này", 409)
    EVENT_START_TIME_IN_PAST = ("Thời gian bắt đầu sự kiện phải ở tương lai", 400)
    EVENT_END_TIME_INVALID = ("Thời gian kết thúc sự kiện phải sau thời gian bắt đầu", 400)
    TICKET_SALE_AFTER_EVENT_START = ("Thời gian mở bán vé phải trước hoặc bằng thời gian bắt đầu sự kiện", 400)
    TICKET_SALE_END_INVALID = ("Thời gian kết thúc bán vé không hợp lệ", 400)
    EVENT_NOT_EDITABLE = ("Sự kiện đã xuất bản hoặc đang diễn ra, không thể chỉnh sửa", 400)
    EVENT_HAS_NO_TICKETS = ("Sự kiện chưa có thông tin hạng vé/sơ đồ ghế, không thể xuất bản", 400)
    EVENT_ALREADY_PUBLISHED = ("Sự kiện đã được xuất bản trước đó", 400)
    EVENT_CANCELLED = ("Sự kiện đã bị hủy", 400)

    # ==========================================
    # 6. Ticket & Seat Errors (Đặt vé & Ghế)
    # ==========================================
    TICKET_NOT_FOUND = ("Hạng vé không tồn tại", 404)
    TICKET_OUT_OF_STOCK = ("Vé đã hết lượt đăng ký/đặt mua", 400)
    SEAT_NOT_FOUND = ("Ghế ngồi không tồn tại", 404)
    SEAT_ALREADY_BOOKED = ("Ghế đã được đặt hoặc đang giữ chỗ bởi người khác", 409)
    SEAT_HOLD_EXPIRED = ("Thời gian giữ chỗ ghế đã hết hạn", 400)
    INVALID_SEAT_SELECTION = ("Lựa chọn vị trí ghế không hợp lệ", 400)

    # ==========================================
    # 7. Order & Payment Errors (Thanh toán)
    # ==========================================
    ORDER_NOT_FOUND = ("Đơn hàng không tồn tại", 404)
    ORDER_EXPIRED = ("Đơn hàng đã hết hạn thanh toán", 400)
    ORDER_ALREADY_PAID = ("Đơn hàng này đã được thanh toán trước đó", 400)
    PAYMENT_FAILED = ("Thanh toán thất bại, vui lòng kiểm tra lại", 400)

    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code