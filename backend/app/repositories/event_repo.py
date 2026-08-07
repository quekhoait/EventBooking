from datetime import datetime

from sqlalchemy import select

from app import db
from app.models import EventModel


def exists_by_company_name_and_time(
    company_id: int, name: str, event_start_time: datetime
) -> bool:
    """Kiểm tra sự kiện trùng tên và thời gian bắt đầu của cùng một công ty."""
    stmt = select(EventModel.id).where(
        EventModel.company_id == company_id,
        EventModel.name == name,
        EventModel.event_start_time == event_start_time
    )
    return db.session.scalar(stmt) is not None