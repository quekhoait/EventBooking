from datetime import datetime
from types import SimpleNamespace

from app.models import EventModel, EventStatus, LocationModel, Company


def create_event(
        test_session,
        name: str = "Sự kiện ra mắt sản phẩm",
        company_id: int | None = 1,
        status: EventStatus = EventStatus.DRAFT,
        event_start_time: datetime | None = None,
        event_end_time: datetime | None = None,
        category_id: int | None = None,
        location_id: int | None = None,
        max_per_user: int = 5,
        **kwargs
) -> EventModel:
    # Thiết lập thời gian mặc định nếu không truyền vào
    if event_start_time is None:
        event_start_time = datetime(2026, 9, 1, 9, 0, 0)
    if event_end_time is None:
        event_end_time = datetime(2026, 9, 1, 12, 0, 0)

    event = EventModel(
        name=name,
        company_id=company_id,
        status=status,
        event_start_time=event_start_time,
        event_end_time=event_end_time,
        category_id=category_id,
        location_id=location_id,
        max_per_user=max_per_user,
        description=kwargs.pop("description", "Mô tả sự kiện mẫu"),
        image=kwargs.pop("image", "https://example.com/event.jpg"),
        location_name=kwargs.pop("location_name", "Hội trường A"),
        **kwargs
    )

    test_session.add(event)
    test_session.commit()
    return event


def create_location(
    test_session,
    name: str = "Hà Nội",
    parent_id: int | None = None
) -> LocationModel:
    """Helper tạo Location mẫu trong DB."""
    location = LocationModel(name=name, parent_id=parent_id)
    test_session.add(location)
    test_session.commit()
    return location


def create_company(
    test_session,
    name: str = "Công ty Công Nghệ A",
    location_id: int | None = None
) -> Company:
    """Helper tạo Company mẫu trong DB."""
    company = Company(
        name=name,
        address="123 Đường ABC",
        tax_code="0101234567",
        location_id=location_id
    )
    test_session.add(company)
    test_session.commit()
    return company

def make_event_payload(**overrides):
    """Tạo payload hợp lệ gửi lên API /events, hỗ trợ override các trường."""
    default_payload = {
        "name": "Đại Nhạc Hội 2026",
        "status": "draft",
        "company_id": 1,
        "category_id": 1,
        "location_id": 1,
        "image": "https://example.com/images/banner.jpg",
        "start_time": "2026-12-01T08:00:00",
        "end_time": "2026-12-01T22:00:00",
        "event_start_time": "2026-12-01T08:00:00",
        "event_end_time": "2026-12-01T12:00:00",
        "event_seats": [
            {"seat_total": 100, "price": 500000.0, "event_ticket_type_id": 1}
        ]
    }
    default_payload.update(overrides)
    return default_payload

def make_mock_event(**overrides):
    """Tạo mock object EventModel chứa đầy đủ thuộc tính để Marshmallow .dump() không bị AttributeError (500)."""
    now = datetime(2026, 1, 1, 0, 0, 0)

    default_company = SimpleNamespace(
        id=1,
        name="Công ty ABC",
        address="123 Đường ABC",
        description="Mô tả công ty"
    )
    default_category = SimpleNamespace(
        id=1,
        name="Âm nhạc"
    )
    default_location = SimpleNamespace(
        id=1,
        name="TP.HCM",
        address="123 Lê Lợi"
    )

    defaults = {
        "id": 1,
        "name": "Đại Nhạc Hội 2026",
        "description": "Mô tả sự kiện mẫu",
        "status": EventStatus.PUBLISHED,
        "company_id": 1,
        "category_id": 1,
        "location_id": 1,
        "image": "https://example.com/banner.jpg",
        "location_name": "Hội trường A",
        "max_per_user": 5,
        "start_time": datetime(2026, 12, 1, 8, 0, 0),
        "end_time": datetime(2026, 12, 1, 22, 0, 0),
        "event_start_time": datetime(2026, 12, 1, 8, 0, 0),
        "event_end_time": datetime(2026, 12, 1, 12, 0, 0),
        "created_at": now,
        "updated_at": now,
        "company": default_company,
        "category": default_category,
        "location": default_location,
        "event_seats": []
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)