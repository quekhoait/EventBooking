# app/services/reference_data_service.py

from app.models import EventCategory, LocationModel
from app.repositories import base_repo
from app import db
from app.repositories import reference_data_repo as ref_repo
from app.repositories import user_repo
from app.utils.exception import AppException, ErrorCode


def get_all_categories():
    """Lấy tất cả danh mục."""
    return base_repo.get_all(EventCategory)


def get_all_locations():
    """Lấy tất cả địa điểm (dạng cây)."""
    # Lấy tất cả location gốc (parent_id = None)
    locations = LocationModel.query.filter(LocationModel.parent_id.is_(None)).all()
    return locations


def get_location_tree():
    """Lấy cây địa điểm đầy đủ."""
    # Lấy tất cả location
    all_locations = base_repo.get_all(LocationModel)

    # Tạo dict để map id -> object
    location_map = {loc.id: loc for loc in all_locations}

    # Lấy các location gốc
    roots = [loc for loc in all_locations if loc.parent_id is None]

    # Hàm build tree
    def build_tree(location):
        children = [loc for loc in all_locations if loc.parent_id == location.id]
        return {
            "id": location.id,
            "name": location.name,
            "full_name": location.full_name,
            "parent_id": location.parent_id,
            "children": [build_tree(child) for child in children],
        }

    return [build_tree(root) for root in roots]


def get_user_preferences(user_id: int):
    """Lấy danh sách các thể loại yêu thích của người dùng."""
    if not user_id:
        raise AppException(ErrorCode.INVALID_REQUEST, "user_id không được để trống")

    # Kiểm tra user có tồn tại không
    user = user_repo.find_one(id=user_id)
    if not user:
        raise AppException(ErrorCode.USER_NOT_FOUND, "Người dùng không tồn tại")

    preferences = user_repo.find_user_preferences(user_id)

    return [
        {
            "category_id": pref.category_id,
            "category_name": pref.category.name if pref.category else None,
        }
        for pref in preferences
    ]


def check_has_preferences(user_id: int) -> bool:
    """Kiểm tra nhanh xem user đã chọn thể loại nào chưa."""
    if not user_id:
        return False
    return user_repo.check_user_has_preferences(user_id)


def update_user_preferences(user_id: int, category_ids: list):
    """
    Cập nhật danh sách thể loại yêu thích (Ghi đè):
    - Validate danh sách category_ids có hợp lệ trong DB không.
    - Cập nhật và trả về trạng thái preferences.
    """
    if not user_id:
        raise AppException(ErrorCode.INVALID_REQUEST, "user_id không được để trống")

    if not isinstance(category_ids, list):
        raise AppException(
            ErrorCode.INVALID_REQUEST, "category_ids phải là dạng mảng/danh sách"
        )

    user = user_repo.find_one(id=user_id)
    if not user:
        raise AppException(ErrorCode.USER_NOT_FOUND, "Người dùng không tồn tại")

    # Validate danh mục hợp lệ
    unique_ids = list(set(category_ids))
    if unique_ids:
        valid_ids = user_repo.find_valid_category_ids(unique_ids)
        invalid_ids = set(unique_ids) - set(valid_ids)
        if invalid_ids:
            raise AppException(
                ErrorCode.CATEGORY_NOT_FOUND,
                f"Có danh mục không tồn tại: {list(invalid_ids)}",
            )

    # Ghi đè vào database thông qua repo
    updated_ids = ref_repo.update_user_preferences(user_id, unique_ids)

    return {
        "user_id": user_id,
        "category_ids": updated_ids,
        "has_preferences": len(updated_ids) > 0,
    }


def add_user_preferences(user_id: int, category_ids: list):
    """Thêm bổ sung các thể loại vào danh sách hiện có (không ghi đè)."""
    if not user_id:
        raise AppException(ErrorCode.INVALID_REQUEST, "user_id không được để trống")

    if not isinstance(category_ids, list):
        raise AppException(
            ErrorCode.INVALID_REQUEST, "category_ids phải là dạng mảng/danh sách"
        )

    user = user_repo.find_one(id=user_id)
    if not user:
        raise AppException(ErrorCode.USER_NOT_FOUND, "Người dùng không tồn tại")

    added_ids = ref_repo.add_user_preferences(user_id, category_ids)

    return {
        "user_id": user_id,
        "added_category_ids": added_ids,
        "all_category_ids": ref_repo.get_user_preferred_category_ids(user_id),
    }


def delete_user_preference(user_id: int, category_id: int):
    """Xóa 1 thể loại khỏi danh sách yêu thích của người dùng."""
    if not user_id or not category_id:
        raise AppException(
            ErrorCode.INVALID_REQUEST, "user_id và category_id không được để trống"
        )

    success = ref_repo.delete_single_preference(user_id, category_id)
    if not success:
        raise AppException(
            ErrorCode.NOT_FOUND, "Không tìm thấy thể loại này trong danh sách của bạn"
        )

    return True


def clear_user_preferences(user_id: int):
    """Xóa toàn bộ sở thích của người dùng."""
    if not user_id:
        raise AppException(ErrorCode.INVALID_REQUEST, "user_id không được để trống")

    ref_repo.delete_all_user_preferences(user_id)
    return True
