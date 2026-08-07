# app/services/demo_service.py
from app.errors.ErrorCode import ErrorCode
from app.utils.exception import AppException

class DemoService:
    @staticmethod
    def process_test_logic(error_type: str | None):
        """
        Xử lý logic nghiệp vụ và raise exception nếu có lỗi
        """
        if error_type == 'enum':
            # Bắn lỗi nghiệp vụ Enum tĩnh
            raise AppException(ErrorCode.FORBIDDEN)

        elif error_type == 'custom':
            # Bắn lỗi tùy chỉnh message và status_code trực tiếp
            raise AppException("Bạn không đủ năng lượng để thực hiện thao tác này!", status_code=400)

        # === DEMO CASE TRUYỀN THAM SỐ ĐỘNG VÀO %s ===
        elif error_type == 'formatted':
            # Truyền 1 tham số động "alex@gmail.com" vào %s của USER_NOT_FOUND
            raise AppException(ErrorCode.USER_NOT_FOUND, "alex@gmail.com")

        elif error_type == 'formatted_multi':
            # Truyền 2 tham số động vào %s của ALREADY_EXISTS
            raise AppException(ErrorCode.ALREADY_EXISTS, "Danh mục", "Vé Ca Nhạc")

        elif error_type == 'bug':
            # Giả lập crash code hệ thống trong Service (Lỗi 500)
            result = 1 / 0

        # Trả về dữ liệu kết quả cho Controller nếu mọi thứ hợp lệ
        return {
            "user": "Demo User",
            "status": "Active"
        }