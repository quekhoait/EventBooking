from datetime import datetime

from flask import current_app

from app import db
from app.dto.pagination_dto import LoadMoreResponse
from app.errors.error_code import ErrorCode
from app.models import EventModel, LocationModel, Company, EventCategory, EventSeat, EventStatus, EventTicketType
from app.repositories import base_repo, event_repo
from app.utils.exception import AppException
from app.utils.signals import event_cancelled_signal


# =============================================================================
# PUBLIC: Create
# =============================================================================
def create_and_publish_event(event_dto, creator_id: int | None = None) -> EventModel:
    location, company, category = _validate_publish_event(event_dto)

    seats_dto_list = getattr(event_dto, 'event_seats', [])
    if not seats_dto_list:
        raise AppException(ErrorCode.EVENT_MUST_HAVE_SEATS)

    return _save_event_to_db(
        event_dto,
        status=EventStatus.PUBLISHED,
        location_name=location.full_name,
        creator_id=creator_id,
    )


def create_draft_event(event_dto, creator_id: int | None = None) -> EventModel:
    location_name = _get_location_name(getattr(event_dto, 'location_id', None))
    return _save_event_to_db(
        event_dto,
        status=EventStatus.DRAFT,
        location_name=location_name,
        creator_id=creator_id,
    )


# =============================================================================
# PUBLIC: Read
# =============================================================================
def get_event_detail(event_id: int) -> EventModel:
    return _find_event(event_id)


def get_events_load_more(
        page: int = 1,
        page_size: int = 10,
        **filters
) -> LoadMoreResponse[EventModel]:
    items, has_next = event_repo.get_events_load_more(
        status=EventStatus.PUBLISHED,
        **filters
    )
    return LoadMoreResponse(items=items, page=page, page_size=page_size, has_next=has_next)


def get_events_by_creator(
    creator_id: int,
    include_deleted: bool = False
) -> list[EventModel]:
    return event_repo.get_events_by_creator(creator_id=creator_id, include_deleted=include_deleted)


def get_tickets(event_id: int):
    if not event_id:
        return None
    return event_repo.get_tickets(event_id)


# =============================================================================
# PUBLIC: Update
# =============================================================================
def update_event(event_id: int, event_dto) -> EventModel:
    event = _find_event(event_id)

    if event.status == EventStatus.CANCELLED:
        raise AppException(ErrorCode.EVENT_CANNOT_UPDATE_CANCELLED)

    event_data = dict(vars(event_dto))
    seats_dto_list = event_data.pop('event_seats', None)

    _validate_update_references(event, event_data)
    _validate_update_time_logic(event, event_data)
    _validate_update_duplicate(event, event_data)

    new_location_id = event_data.get('location_id')
    if new_location_id and new_location_id != event.location_id:
        event.location_name = _get_location_name(new_location_id)

    for key, value in event_data.items():
        if value is not None and hasattr(event, key):
            setattr(event, key, value)

    if seats_dto_list is not None:
        EventSeat.query.filter_by(event_id=event.id).delete()
        _save_event_seats(event.id, seats_dto_list, validate_ticket_type=True)

    return _commit(event)


def publish_event(event_id: int) -> EventModel:
    event = _find_event(event_id)

    if event.status == EventStatus.PUBLISHED:
        raise AppException("Sự kiện này đã được xuất bản trước đó.")

    if event.status == EventStatus.CANCELLED:
        raise AppException("Sự kiện đã bị hủy, không thể xuất bản.")

    if not event.seats or len(event.seats) == 0:
        raise AppException(ErrorCode.EVENT_MUST_HAVE_SEATS)

    location, company, category = _validate_publish_event(event, exclude_event_id=event_id)

    event.status = EventStatus.PUBLISHED
    event.location_name = location.full_name() if callable(
        getattr(location, 'full_name', None)) else location.full_name

    return _commit(event)


# =============================================================================
# PUBLIC: Delete / Cancel / Restore
# =============================================================================
def delete_event(event_id: int) -> bool:
    event = _find_event(event_id)

    if event.status == EventStatus.PUBLISHED:
        raise AppException(ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED)

    return event_repo.delete_event(event)


def cancel_event(event_id: int) -> EventModel:
    event = _find_event(event_id)

    if event.status == EventStatus.CANCELLED:
        raise AppException(ErrorCode.EVENT_ALREADY_CANCELLED)

    if event.status != EventStatus.PUBLISHED:
        raise AppException(ErrorCode.EVENT_CANCEL_NOT_ALLOWED)

    event.status = EventStatus.CANCELLED
    saved_event = _commit(event)

    event_cancelled_signal.send(
        current_app._get_current_object(),
        event=saved_event
    )
    return saved_event


def restore_event(event_id: int) -> bool:
    _find_event(event_id, include_deleted=True)
    return event_repo.restore_event(event_id)


# =============================================================================
# PRIVATE: Find
# =============================================================================
def _find_event(event_id: int, include_deleted: bool = False) -> EventModel:
    event = event_repo.get_event_by_id(event_id, include_deleted=include_deleted)
    if not event:
        raise AppException(ErrorCode.EVENT_NOT_FOUND)
    return event


# =============================================================================
# PRIVATE: Validate — References
# =============================================================================
def _validate_references(location_id, company_id, category_id):
    if location_id and not base_repo.get_by_id(LocationModel, location_id):
        raise AppException(ErrorCode.LOCATION_NOT_FOUND)
    if company_id and not base_repo.get_by_id(Company, company_id):
        raise AppException(ErrorCode.COMPANY_NOT_FOUND)
    if category_id and not base_repo.get_by_id(EventCategory, category_id):
        raise AppException(ErrorCode.CATEGORY_NOT_FOUND)


def _validate_update_references(event: EventModel, event_data: dict):
    location_id = event_data.get('location_id')
    if location_id and location_id != event.location_id:
        if not base_repo.get_by_id(LocationModel, location_id):
            raise AppException(ErrorCode.LOCATION_NOT_FOUND)

    company_id = event_data.get('company_id')
    if company_id and company_id != event.company_id:
        if not base_repo.get_by_id(Company, company_id):
            raise AppException(ErrorCode.COMPANY_NOT_FOUND)

    category_id = event_data.get('category_id')
    if category_id and category_id != event.category_id:
        if not base_repo.get_by_id(EventCategory, category_id):
            raise AppException(ErrorCode.CATEGORY_NOT_FOUND)


# =============================================================================
# PRIVATE: Validate — Time Logic
# =============================================================================
def _validate_time_logic(event_start_time, event_end_time, start_time, end_time):
    now = datetime.now()

    if event_start_time and event_start_time < now:
        raise AppException(ErrorCode.EVENT_START_TIME_IN_PAST)

    if start_time and event_start_time and start_time > event_start_time:
        raise AppException(ErrorCode.TICKET_SALE_AFTER_EVENT_START)

    if end_time and event_end_time and end_time > event_end_time:
        raise AppException(ErrorCode.TICKET_SALE_END_INVALID)


def _validate_update_time_logic(event: EventModel, event_data: dict):
    time_fields = ['event_start_time', 'event_end_time', 'start_time', 'end_time']
    if not any(f in event_data for f in time_fields):
        return

    _validate_time_logic(
        event_data.get('event_start_time') or event.event_start_time,
        event_data.get('event_end_time') or event.event_end_time,
        event_data.get('start_time') or event.start_time,
        event_data.get('end_time') or event.end_time,
    )


# =============================================================================
# PRIVATE: Validate — Duplicate
# =============================================================================
def _validate_duplicate(company_id, name, event_start_time, exclude_event_id=None):
    if event_repo.exists_by_company_name_and_time(
        company_id=company_id,
        name=name,
        event_start_time=event_start_time,
        exclude_event_id=exclude_event_id,
    ):
        raise AppException(ErrorCode.EVENT_NAME_EXISTS)


def _validate_update_duplicate(event: EventModel, event_data: dict):
    if 'name' not in event_data and 'event_start_time' not in event_data:
        return

    _validate_duplicate(
        company_id=event_data.get('company_id') or event.company_id,
        name=event_data.get('name') or event.name,
        event_start_time=event_data.get('event_start_time') or event.event_start_time,
        exclude_event_id=event.id,
    )


# =============================================================================
# PRIVATE: Validate — Full (Publish)
# =============================================================================
def _validate_publish_event(event_dto, exclude_event_id: int | None = None):
    location = base_repo.get_by_id(LocationModel, event_dto.location_id)
    if not location:
        raise AppException(ErrorCode.LOCATION_NOT_FOUND)

    company = base_repo.get_by_id(Company, event_dto.company_id)
    if not company:
        raise AppException(ErrorCode.COMPANY_NOT_FOUND)

    category = base_repo.get_by_id(EventCategory, event_dto.category_id)
    if not category:
        raise AppException(ErrorCode.CATEGORY_NOT_FOUND)

    _validate_time_logic(event_dto.event_start_time, event_dto.event_end_time, event_dto.start_time, event_dto.end_time)
    _validate_duplicate(event_dto.company_id, event_dto.name, event_dto.event_start_time, exclude_event_id)

    return location, company, category


# =============================================================================
# PRIVATE: Persist
# =============================================================================
def _save_event_to_db(event_dto, status: EventStatus, **kwargs) -> EventModel:
    event_data = dict(vars(event_dto))
    seats_dto_list = event_data.pop('event_seats', [])
    event_data.update(kwargs)

    event = EventModel(**event_data)
    event.status = status
    db.session.add(event)
    db.session.flush()

    if seats_dto_list:
        _save_event_seats(event.id, seats_dto_list)

    return _commit(event)


def _save_event_seats(event_id: int, seats_dto_list: list, validate_ticket_type: bool = False):
    for seat_dto in seats_dto_list:
        seat_data = vars(seat_dto) if not isinstance(seat_dto, dict) else seat_dto

        if validate_ticket_type:
            ticket_type_id = seat_data.get('event_ticket_type_id')
            if not base_repo.get_by_id(EventTicketType, ticket_type_id):
                raise AppException(f"Loại vé có ID {ticket_type_id} không tồn tại.")

        db.session.add(EventSeat(event_id=event_id, **seat_data))


def _commit(event):
    try:
        db.session.commit()
        db.session.refresh(event)
        return event
    except Exception as e:
        db.session.rollback()
        raise e


# =============================================================================
# PRIVATE: Helpers
# =============================================================================
def _get_location_name(location_id: int | None) -> str | None:
    if not location_id:
        return None
    location = base_repo.get_by_id(LocationModel, location_id)
    return location.full_name if location else None
