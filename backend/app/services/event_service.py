from datetime import datetime

from app.errors.error_code import ErrorCode
from app.models import EventModel, LocationModel, Company, EventCategory
from app.repositories import base_repo, event_repo
from app.utils.exception import AppException


def create_event(event_dto) -> EventModel:
    now = datetime.now()

    # 1. Kiểm tra sự tồn tại của Location
    location = base_repo.get_by_id(LocationModel, event_dto.location_id)
    if not location:
        raise AppException(ErrorCode.LOCATION_NOT_FOUND)

    # 2. Kiểm tra sự tồn tại của Company
    company = base_repo.get_by_id(Company, event_dto.company_id)
    if not company:
        raise AppException(ErrorCode.COMPANY_NOT_FOUND)

    # 3. Kiểm tra sự tồn tại của Category
    category = base_repo.get_by_id(EventCategory, event_dto.category_id)
    if not category:
        raise AppException(ErrorCode.CATEGORY_NOT_FOUND)

    # 4. Kiểm tra logic thời gian với hiện tại
    if event_dto.event_start_time < now:
        raise AppException(ErrorCode.EVENT_START_TIME_IN_PAST)

    # Ngày mở bán vé (start_time) <= Ngày bắt đầu sự kiện (event_start_time)
    if event_dto.start_time > event_dto.event_start_time:
        raise AppException(ErrorCode.TICKET_SALE_AFTER_EVENT_START)

    # Ngày đóng bán vé (end_time) <= Ngày kết thúc sự kiện (event_end_time)
    if event_dto.end_time > event_dto.event_end_time:
        raise AppException(ErrorCode.TICKET_SALE_END_INVALID)

    # 5. Kiểm tra trùng lặp
    is_duplicated = event_repo.exists_by_company_name_and_time(
        company_id=event_dto.company_id,
        name=event_dto.name,
        event_start_time=event_dto.event_start_time
    )
    if is_duplicated:
        raise AppException(ErrorCode.EVENT_NAME_EXISTS)

    event_data = vars(event_dto)
    event = EventModel(**event_data)

    # Gán location_name lấy từ full_name (đã viết ở bước trước)
    event.location_name = location.full_name

    return base_repo.save(event)