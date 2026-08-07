from datetime import datetime

from app import db
from app.errors.error_code import ErrorCode
from app.models import EventModel, LocationModel, Company, EventCategory, EventSeat, EventStatus
from app.repositories import base_repo, event_repo
from app.utils.exception import AppException


def create_and_publish_event(event_dto) -> EventModel:
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

    if event_dto.start_time > event_dto.event_start_time:
        raise AppException(ErrorCode.TICKET_SALE_AFTER_EVENT_START)

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

    event_data = dict(vars(event_dto))
    seats_dto_list = event_data.pop('event_seats', [])

    if not seats_dto_list:
        raise AppException(ErrorCode.EVENT_MUST_HAVE_SEATS)

    try:
        event = EventModel(**event_data)
        event.status = EventStatus.PUBLISHED
        event.location_name = location.full_name

        db.session.add(event)
        db.session.flush()

        for seat_dto in seats_dto_list:
            seat_data = vars(seat_dto)
            event_seat = EventSeat(
                event_id=event.id,
                **seat_data
            )
            db.session.add(event_seat)

        db.session.commit()
        db.session.refresh(event)


        return event

    except Exception as e:
        db.session.rollback()
        raise e



def create_draft_event(event_dto) -> EventModel:
    event_data = dict(vars(event_dto))
    seats_dto_list = event_data.pop('event_seats', [])

    location_id = getattr(event_dto, 'location_id', None)

    location = None
    if location_id:
        location = base_repo.get_by_id(LocationModel, location_id)

    try:
        event = EventModel(**event_data)
        event.status = EventStatus.DRAFT
        if location:
            event.location_name = location.full_name

        db.session.add(event)
        db.session.flush()

        for seat_dto in seats_dto_list:
            seat_data = vars(seat_dto)
            db.session.add(EventSeat(event_id=event.id, **seat_data))

        db.session.commit()
        db.session.refresh(event)
        return event

    except Exception as e:
        db.session.rollback()
        raise e