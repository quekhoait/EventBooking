from datetime import datetime
from types import SimpleNamespace
import pytest
from freezegun import freeze_time

from app.errors.error_code import ErrorCode
from app.models import (
    Company,
    EventCategory,
    EventModel,
    EventSeat,
    EventStatus,
    EventTicketType,
    LocationModel,
)
from app.services import event_service
from app.utils.exception import AppException
from tests.test_manage_event.gen_data import create_location, create_company, create_event

# Mốc thời gian cố định cho toàn bộ suite test
FROZEN_NOW = "2026-01-01 08:00:00"


# ==============================================================================
# FIXTURES & DTO HELPERS
# ==============================================================================

@pytest.fixture
def db_deps(test_session):
    """Khởi tạo dữ liệu cơ bản (Location, Company, Category, TicketType) trong DB."""
    # Location phân cấp: Việt Nam -> Hà Nội
    country = create_location(test_session, name="Việt Nam")
    city = create_location(test_session, name="Hà Nội", parent_id=country.id)

    # Company gắn liền với Location
    company = create_company(
        test_session, name="Công ty Công Nghệ A", location_id=city.id
    )

    # Thêm Category và TicketType
    category = EventCategory(name="Âm Nhạc")
    ticket_type = EventTicketType(name="Vé VIP")
    test_session.add_all([category, ticket_type])
    test_session.commit()

    return {
        "location": city,
        "company": company,
        "category": category,
        "ticket_type": ticket_type,
    }


def make_event_dto(db_deps, **kwargs):
    """Helper tạo DTO chứa mốc thời gian cố định (sau ngày 2026-01-01)."""
    defaults = {
        "name": "Đại Nhạc Hội 2026",
        "company_id": db_deps["company"].id,
        "location_id": db_deps["location"].id,
        "category_id": db_deps["category"].id,
        # Thời gian cố định
        "event_start_time": datetime(2026, 1, 20, 19, 0, 0),
        "event_end_time": datetime(2026, 1, 20, 22, 0, 0),
        "start_time": datetime(2026, 1, 5, 8, 0, 0),
        "end_time": datetime(2026, 1, 19, 23, 59, 0),
        "event_seats": [
            {
                "seat_total": 100,
                "price": 500000.0,
                "event_ticket_type_id": db_deps["ticket_type"].id,
            }
        ],
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


# ==============================================================================
# 1. TEST CREATE & PUBLISH EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestCreateAndPublishEvent:

    def test_create_and_publish_success(self, test_session, db_deps):
        """Tạo & Xuất bản thành công -> Status = PUBLISHED, location_name đúng phân cấp."""
        dto = make_event_dto(db_deps)

        event = event_service.create_and_publish_event(dto)

        assert event.id is not None
        assert event.status == EventStatus.PUBLISHED
        assert event.location_name == "Hà Nội, Việt Nam"

    def test_create_and_publish_without_seats_fails(self, test_session, db_deps):
        """Báo lỗi khi tạo sự kiện xuất bản mà không truyền danh sách ghế."""
        dto = make_event_dto(db_deps, event_seats=[])

        with pytest.raises(AppException) as exc_info:
            event_service.create_and_publish_event(dto)
        assert exc_info.value.error_code == ErrorCode.EVENT_MUST_HAVE_SEATS


# ==============================================================================
# 2. TEST CREATE DRAFT EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestCreateDraftEvent:

    def test_create_draft_success(self, test_session, db_deps):
        """Tạo sự kiện nháp thành công -> Status = DRAFT."""
        dto = make_event_dto(db_deps)

        event = event_service.create_draft_event(dto)

        assert event.id is not None
        assert event.status == EventStatus.DRAFT


# ==============================================================================
# 3. TEST GET EVENT DETAIL
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestGetEventDetail:

    def test_get_detail_success(self, test_session, db_deps):
        """Lấy chi tiết sự kiện thành công."""
        created = create_event(
            test_session,
            name="Sự Kiện Nhạc Trẻ",
            company_id=db_deps["company"].id,
        )

        event = event_service.get_event_detail(created.id)

        assert event.id == created.id
        assert event.name == "Sự Kiện Nhạc Trẻ"

    def test_get_detail_not_found(self, test_session):
        """Báo lỗi khi tìm kiếm ID không tồn tại."""
        with pytest.raises(AppException) as exc_info:
            event_service.get_event_detail(99999)
        assert exc_info.value.error_code == ErrorCode.EVENT_NOT_FOUND


# ==============================================================================
# 4. TEST UPDATE EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestUpdateEvent:

    def test_update_info_and_seats_success(self, test_session, db_deps):
        """Cập nhật tên và làm sạch/thay thế danh sách ghế."""
        event = create_event(
            test_session, name="Tên Cũ", company_id=db_deps["company"].id
        )

        update_dto = SimpleNamespace(
            name="Tên Mới Được Cập Nhật",
            event_seats=[
                {
                    "seat_total": 200,
                    "price": 150000.0,
                    "event_ticket_type_id": db_deps["ticket_type"].id,
                }
            ],
        )

        updated_event = event_service.update_event(event.id, update_dto)

        assert updated_event.name == "Tên Mới Được Cập Nhật"

        # Kiểm tra ghế cũ đã xóa và ghi đè ghế mới
        seats = test_session.query(EventSeat).filter_by(event_id=event.id).all()
        assert len(seats) == 1
        assert seats[0].seat_total == 200


# ==============================================================================
# 5. TEST DELETE EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestDeleteEvent:

    def test_delete_draft_event_success(self, test_session, db_deps):
        """Xóa thành công sự kiện ở trạng thái DRAFT."""
        event = create_event(
            test_session,
            status=EventStatus.DRAFT,
            company_id=db_deps["company"].id,
        )

        result = event_service.delete_event(event.id)

        assert result is True

    def test_delete_published_event_fails(self, test_session, db_deps):
        """Không cho phép xóa sự kiện đã PUBLISHED."""
        event = create_event(
            test_session,
            status=EventStatus.PUBLISHED,
            company_id=db_deps["company"].id,
        )

        with pytest.raises(AppException) as exc_info:
            event_service.delete_event(event.id)
        assert exc_info.value.error_code == ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED


# ==============================================================================
# 6. TEST CANCEL EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestCancelEvent:

    def test_cancel_event_success(self, test_session, db_deps):
        """Chuyển trạng thái sang CANCELLED thành công."""
        event = create_event(
            test_session,
            status=EventStatus.PUBLISHED,
            company_id=db_deps["company"].id,
        )

        canceled = event_service.cancel_event(event.id)

        assert canceled.status == EventStatus.CANCELLED

    def test_cancel_already_cancelled_fails(self, test_session, db_deps):
        """Báo lỗi khi cố hủy sự kiện đã bị hủy trước đó."""
        event = create_event(
            test_session,
            status=EventStatus.CANCELLED,
            company_id=db_deps["company"].id,
        )

        with pytest.raises(AppException) as exc_info:
            event_service.cancel_event(event.id)
        assert exc_info.value.error_code == ErrorCode.EVENT_ALREADY_CANCELLED


# ==============================================================================
# 7. TEST PUBLISH EVENT
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestPublishEvent:

    def test_publish_draft_event_success(self, test_session, db_deps):
        """Xuất bản sự kiện DRAFT (đã cài đặt ghế)."""
        event = create_event(
            test_session,
            status=EventStatus.DRAFT,
            company_id=db_deps["company"].id,
            location_id=db_deps["location"].id,
            category_id=db_deps["category"].id,
            event_start_time=datetime(2026, 1, 20, 19, 0),
            event_end_time=datetime(2026, 1, 20, 22, 0),
            start_time=datetime(2026, 1, 2, 8, 0),
            end_time=datetime(2026, 1, 19, 23, 59),
        )

        # Gắn ghế vào Event
        seat = EventSeat(
            event_id=event.id,
            seat_total=50,
            price=200000.0,
            event_ticket_type_id=db_deps["ticket_type"].id,
        )
        test_session.add(seat)
        test_session.commit()

        published = event_service.publish_event(event.id)

        assert published.status == EventStatus.PUBLISHED
        assert published.location_name == "Hà Nội, Việt Nam"

    def test_publish_without_seats_fails(self, test_session, db_deps):
        """Báo lỗi khi xuất bản sự kiện chưa cài đặt ghế."""
        event = create_event(
            test_session,
            status=EventStatus.DRAFT,
            company_id=db_deps["company"].id,
        )

        with pytest.raises(AppException) as exc_info:
            event_service.publish_event(event.id)
        assert exc_info.value.error_code == ErrorCode.EVENT_MUST_HAVE_SEATS


# ==============================================================================
# 8. TEST VALIDATE LOGIC
# ==============================================================================
@freeze_time(FROZEN_NOW)
class TestValidatePublishEvent:

    def test_validate_past_start_time_fails(self, test_session, db_deps):
        """Báo lỗi EVENT_START_TIME_IN_PAST khi event_start_time bé hơn FROZEN_NOW (2026-01-01)."""
        dto = make_event_dto(
            db_deps,
            event_start_time=datetime(2025, 12, 31, 20, 0, 0)
        )

        with pytest.raises(AppException) as exc_info:
            event_service._validate_publish_event(dto)
        assert exc_info.value.error_code == ErrorCode.EVENT_START_TIME_IN_PAST