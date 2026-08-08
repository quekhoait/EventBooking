from datetime import datetime
from typing import Tuple

from app import db
from app.dto.pagination_dto import LoadMoreResponse
from app.errors.error_code import ErrorCode
from app.models import EventModel, LocationModel, Company, EventCategory, EventSeat, EventStatus, EventTicketType
from app.repositories import base_repo, event_repo
from app.utils.exception import AppException


def create_and_publish_event(event_dto) -> EventModel:
    location = _validate_publish_event(event_dto)

    seats_dto_list = getattr(event_dto, 'event_seats', [])
    if not seats_dto_list:
        raise AppException(ErrorCode.EVENT_MUST_HAVE_SEATS)

    # 3. Tạo và lưu Event
    location_name = location.full_name()
    return _save_event_to_db(event_dto, status=EventStatus.PUBLISHED, location_name=location_name)


def create_draft_event(event_dto) -> EventModel:
    location_id = getattr(event_dto, 'location_id', None)
    location_name = _get_location_name(location_id)
    return _save_event_to_db(event_dto, status=EventStatus.DRAFT, location_name=location_name)


def get_event_detail(event_id: int) -> EventModel:
    """Lấy thông tin chi tiết một sự kiện theo ID."""
    event = base_repo.get_by_id(EventModel, event_id)
    if not event:
        raise AppException(ErrorCode.EVENT_NOT_FOUND)
    return event


def update_event(event_id: int, event_dto) -> EventModel:
    # 1. Tìm event theo ID
    event = get_event_detail(event_id)

    event_data = dict(vars(event_dto))

    # Tách danh sách ghế nếu có truyền lên
    seats_dto_list = event_data.pop('event_seats', None)

    # 2. Xử lý location_name nếu location_id thay đổi
    new_location_id = event_data.get('location_id')
    if new_location_id and new_location_id != event.location_id:
        event.location_name = _get_location_name(new_location_id)

    # 3. Cập nhật các trường thông tin chung của Event
    for key, value in event_data.items():
        if value is not None and hasattr(event, key):
            setattr(event, key, value)

    try:
        # 4. Cập nhật danh sách ghế (nếu truyền vào)
        if seats_dto_list is not None:
            EventSeat.query.filter_by(event_id=event.id).delete()
            _save_event_seats(event.id, seats_dto_list, validate_ticket_type=True)

        db.session.commit()
        db.session.refresh(event)
        return event

    except Exception as e:
        db.session.rollback()
        raise e


def get_events_load_more(
        page: int = 1,
        page_size: int = 10,
        **filters
) -> LoadMoreResponse[EventModel]:

    items, has_next = event_repo.get_events_load_more(
        status=EventStatus.PUBLISHED,
        **filters
    )

    return LoadMoreResponse(
        items=items,
        page=page,
        page_size=page_size,
        has_next=has_next
    )


def _validate_publish_event(event_dto):
    """Kiểm tra toàn bộ điều kiện ràng buộc trước khi Publish Event."""
    now = datetime.now()

    # 1. Kiểm tra sự tồn tại của Location, Company, Category
    location = base_repo.get_by_id(LocationModel, event_dto.location_id)
    if not location:
        raise AppException(ErrorCode.LOCATION_NOT_FOUND)

    company = base_repo.get_by_id(Company, event_dto.company_id)
    if not company:
        raise AppException(ErrorCode.COMPANY_NOT_FOUND)

    category = base_repo.get_by_id(EventCategory, event_dto.category_id)
    if not category:
        raise AppException(ErrorCode.CATEGORY_NOT_FOUND)

    # 2. Kiểm tra logic thời gian
    if event_dto.event_start_time < now:
        raise AppException(ErrorCode.EVENT_START_TIME_IN_PAST)

    if event_dto.start_time > event_dto.event_start_time:
        raise AppException(ErrorCode.TICKET_SALE_AFTER_EVENT_START)

    if event_dto.end_time > event_dto.event_end_time:
        raise AppException(ErrorCode.TICKET_SALE_END_INVALID)

    # 3. Kiểm tra trùng lặp
    is_duplicated = event_repo.exists_by_company_name_and_time(
        company_id=event_dto.company_id,
        name=event_dto.name,
        event_start_time=event_dto.event_start_time
    )
    if is_duplicated:
        raise AppException(ErrorCode.EVENT_NAME_EXISTS)

    return location, company, category


def _save_event_seats(event_id: int, seats_dto_list: list, validate_ticket_type: bool = False):
    """Thêm danh sách ghế cho Event."""
    for seat_dto in seats_dto_list:
        seat_data = vars(seat_dto) if not isinstance(seat_dto, dict) else seat_dto

        if validate_ticket_type:
            ticket_type_id = seat_data.get('event_ticket_type_id')
            ticket_type = base_repo.get_by_id(EventTicketType, ticket_type_id)
            if not ticket_type:
                raise AppException(f"Loại vé có ID {ticket_type_id} không tồn tại.")

        db.session.add(EventSeat(event_id=event_id, **seat_data))


def _save_event_to_db(event_dto, status: EventStatus, **kwargs) -> EventModel:
    """Hàm dùng chung cho việc khởi tạo Event & Seats vào DB."""
    event_data = dict(vars(event_dto))
    seats_dto_list = event_data.pop('event_seats', [])

    event_data.update(kwargs)
    try:
        event = EventModel(**event_data)
        event.status = status

        db.session.add(event)
        db.session.flush()

        if seats_dto_list:
            _save_event_seats(event.id, seats_dto_list)

        db.session.commit()
        db.session.refresh(event)
        return event

    except Exception as e:
        db.session.rollback()
        raise e


def _get_location_name(location_id: int | None) -> str | None:
    """Tra cứu Location và trả về name nếu tồn tại."""
    if not location_id:
        return None
    location = base_repo.get_by_id(LocationModel, location_id)
    if not location:
        return None
    return location.full_name()