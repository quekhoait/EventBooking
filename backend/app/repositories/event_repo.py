from datetime import datetime
from typing import Optional, Dict, Any

import math
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app import db
from app.models import EventModel, EventStatus, User, TicketModel, Seat, EventSeat, EventTicketType
from app.repositories import base_repo


def exists_by_company_name_and_time(
    company_id: int, name: str, event_start_time: datetime, exclude_event_id: int | None = None
) -> bool:
    """Kiểm tra sự kiện trùng tên và thời gian bắt đầu của cùng một công ty."""
    stmt = select(EventModel.id).where(
        EventModel.company_id == company_id,
        EventModel.name == name,
        EventModel.event_start_time == event_start_time
    )
    if exclude_event_id is not None:
        stmt = stmt.where(EventModel.id != exclude_event_id)
    return db.session.scalar(stmt) is not None

def get_events_load_more(
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    company_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status: Optional[EventStatus] = None,
    event_from_date: Optional[datetime] = None,
    event_to_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 10,
    include_deleted: bool = False
) -> tuple[list[EventModel], bool]:
    """
        Lấy danh sách sự kiện có lọc theo điều kiện và phân trang.

        :param keyword: Tìm kiếm theo tên hoặc mô tả sự kiện
        :param category_id: Lọc theo danh mục
        :param company_id: Lọc theo công ty tạo
        :param location_id: Lọc theo địa điểm
        :param status: Lọc theo trạng thái (DRAFT, PUBLISHED, CANCELLED)
        :param from_date: Lọc sự kiện diễn ra từ ngày
        :param to_date: Lọc sự kiện diễn ra đến ngày
        :param page: Trang hiện tại (mặc định 1)
        :param page_size: Số lượng items trên 1 trang (mặc định 10)
        :param include_deleted: Có lấy các bản ghi đã xóa mềm không
    """
    page = max(1, page)
    page_size = min(max(1, page_size), 100)

    # 1. Base Query
    stmt = select(EventModel).options(
        selectinload(EventModel.company),
        selectinload(EventModel.category),
        selectinload(EventModel.seats)
    )

    # Đánh dấu include_deleted nếu model dùng SoftDelete
    if include_deleted:
        stmt = stmt.execution_options(include_deleted=True)

    # 2. Thêm các điều kiện lọc (Dynamic Filters)
    conditions = []

    if keyword and keyword.strip():
        search_pattern = f"%{keyword.strip()}%"
        conditions.append(
            or_(
                EventModel.name.ilike(search_pattern),
                EventModel.description.ilike(search_pattern)
            )
        )


    if category_id is not None:
        conditions.append(EventModel.category_id == category_id)

    if company_id is not None:
        conditions.append(EventModel.company_id == company_id)

    if location_id is not None:
        conditions.append(EventModel.location_id == location_id)

    if status is not None:
        conditions.append(EventModel.status == status)

    if event_from_date is not None:
        conditions.append(EventModel.event_start_time >= event_from_date)

    if event_to_date is not None:
        conditions.append(EventModel.event_end_time <= event_to_date)

    if conditions:
        stmt = stmt.where(*conditions)

    # 3. Phân trang Load More: Lấy dư thêm 1 bản ghi (limit = page_size + 1)
    offset = (page - 1) * page_size
    stmt = stmt.order_by(EventModel.id.desc()).offset(offset).limit(page_size + 1)

    # 4. Thực thi DUY NHẤT 1 Query
    raw_items = list(db.session.scalars(stmt).all())

    # 5. Kiểm tra còn dữ liệu cho lần Load More tiếp theo không
    has_next = len(raw_items) > page_size


    return raw_items[:page_size], has_next

def get_event_by_id(event_id: int, include_deleted: bool = False) -> Optional[EventModel]:
    return base_repo.get_by_id(EventModel, event_id, include_deleted=include_deleted)

def delete_event(event: EventModel, hard_delete: bool = False) -> bool:
    # Hàm base_repo.delete sẽ tự kiểm tra isinstance(entity, SoftDeleteModel)
    # và gọi entity.soft_delete()
    return base_repo.delete(event, hard_delete=hard_delete)

def restore_event(event_id: int) -> bool:
    return base_repo.restore_by_id(EventModel, event_id)

def find_event_by_id(event_id):
    return db.session.query(EventModel).filter(EventModel.id == event_id).first()


def get_ticket_holder_emails(event_id: int) -> list[str]:
    stmt = (
        select(User.email)
        .join(TicketModel, TicketModel.user_id == User.id)
        .join(Seat, Seat.id == TicketModel.seat_id)
        .where(Seat.event_id == event_id)
        .distinct()
    )
    return [email for email in db.session.scalars(stmt).all() if email]


def get_tickets(event_id: int):
    results = (
        db.session.query(EventSeat, EventTicketType)
        .join(EventTicketType, EventSeat.event_ticket_type_id == EventTicketType.id)
        .filter(EventSeat.event_id == event_id)
        .all()
    )

    tickets = []
    for seat, ticket_type in results:
        tickets.append({
            "id": seat.id,
            "event_id": seat.event_id,
            "price": float(seat.price),
            "seat_total": seat.seat_total,
            "event_ticket_type_id": seat.event_ticket_type_id,
            "ticket_type": {
                "id": ticket_type.id,
                "name": ticket_type.name,
                "description": ticket_type.description,
            }
        })

    return tickets

def get_events_by_creator(
    creator_id: int,
    include_deleted: bool = False
) -> list[EventModel]:
    stmt = (
        select(EventModel)
        .where(EventModel.creator_id == creator_id)
        .options(
            selectinload(EventModel.company),
            selectinload(EventModel.category),
            selectinload(EventModel.seats)
        )
        .order_by(EventModel.id.desc())
    )

    if include_deleted:
        stmt = stmt.execution_options(include_deleted=True)

    return list(db.session.scalars(stmt).all())