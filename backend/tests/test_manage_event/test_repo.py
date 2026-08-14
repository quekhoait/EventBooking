from datetime import datetime, timedelta

from app.models import EventStatus, EventModel
from app.repositories.event_repo import exists_by_company_name_and_time, get_events_load_more
from tests.test_manage_event.conftest import event
from tests.test_manage_event.gen_data import create_event


class TestExistsByCompanyNameAndTime:
    def test_exists_success(self, test_session):
        """1. Trường hợp tìm thấy sự kiện trùng hoàn toàn (company_id, name, event_start_time) -> Trả về True"""
        event = create_event(
            test_session,
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )

        result = exists_by_company_name_and_time(
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )

        assert result is True

    def test_not_exists_when_db_is_empty(self, test_session):
        """2. Trường hợp Database trống hoàn toàn -> Trả về False"""
        result = exists_by_company_name_and_time(
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )

        assert result is False

    def test_not_exists_when_mismatched_fields(self, test_session):
        """3. Trường hợp lệch 1 trong các thông tin (company_id / name / start_time) -> Trả về False"""
        create_event(
            test_session,
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )

        # Sai company_id
        assert exists_by_company_name_and_time(
            company_id=2, name="Sự kiện A", event_start_time=datetime(2026, 9, 1, 9, 0)
        ) is False

        # Sai name
        assert exists_by_company_name_and_time(
            company_id=1, name="Sự kiện B", event_start_time=datetime(2026, 9, 1, 9, 0)
        ) is False

        # Sai event_start_time
        assert exists_by_company_name_and_time(
            company_id=1, name="Sự kiện A", event_start_time=datetime(2026, 9, 2, 9, 0)
        ) is False

    def test_exclude_self_event_id_on_update(self, test_session):
        """4. Case Update: Đang update sự kiện A và truyền exclude_event_id chính là A -> Trả về False (Cho phép lưu)"""
        event_a = create_event(
            test_session,
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )

        result = exists_by_company_name_and_time(
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
            exclude_event_id=event_a.id,
        )

        assert result is False

    def test_exclude_other_event_id_conflicts_with_existing(self, test_session):
        """5. Case Update: Đang update sự kiện B (exclude B) nhưng đụng thông tin với sự kiện A -> Trả về True (Báo trùng)"""
        event_a = create_event(
            test_session,
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
        )
        event_b = create_event(
            test_session,
            company_id=1,
            name="Sự kiện B",
            event_start_time=datetime(2026, 9, 2, 9, 0),
        )

        # Giả sử đang sửa Event B để thành tên & giờ giống Event A
        result = exists_by_company_name_and_time(
            company_id=1,
            name="Sự kiện A",
            event_start_time=datetime(2026, 9, 1, 9, 0),
            exclude_event_id=event_b.id,
        )

        assert result is True


class TestGetEventsLoadMore:

    def test_load_more_pagination_has_next(self, test_session):
        """Test thuật toán Load More: Tạo 3 items, lấy page_size=2 -> trả về 2 items và has_next=True"""
        for i in range(3):
            create_event(test_session, name=f"Event {i}")

        items, has_next = get_events_load_more(page=1, page_size=2)

        assert len(items) == 2
        assert has_next is True

    def test_load_more_pagination_no_has_next(self, test_session):
        """Lấy nốt trang cuối -> has_next=False"""
        for i in range(3):
            create_event(test_session, name=f"Event {i}")

        items, has_next = get_events_load_more(page=2, page_size=2)

        assert len(items) == 1
        assert has_next is False

    def test_filter_by_keyword_in_name_or_description(self, test_session):
        """Test search keyword theo cả tên hoặc mô tả"""
        create_event(test_session, name="Đại nhạc hội EDM", description="Sự kiện âm nhạc")
        create_event(test_session, name="Hội thảo Tech", description="Chủ đề EDM và AI")
        create_event(test_session, name="Triển lãm tranh", description="Hội họa cổ điển")

        # Search 'edm' (không phân biệt hoa thường)
        items, _ = get_events_load_more(keyword="edm")

        assert len(items) == 2

    def test_filter_by_status_and_category(self, test_session):
        """Test lọc kết hợp status và category_id"""
        create_event(test_session, category_id=1, status=EventStatus.PUBLISHED)
        create_event(test_session, category_id=1, status=EventStatus.DRAFT)
        create_event(test_session, category_id=2, status=EventStatus.PUBLISHED)

        items, _ = get_events_load_more(category_id=1, status=EventStatus.PUBLISHED)

        assert len(items) == 1
        assert items[0].category_id == 1
        assert items[0].status == EventStatus.PUBLISHED

    def test_filter_by_date_range(self, test_session):
        """Test lọc sự kiện nằm trong khoảng thời gian"""
        now = datetime(2026, 9, 1, 9, 0)

        # Sự kiện 1: Bắt đầu 2026-09-01, Kết thúc 2026-09-01
        create_event(test_session, event_start_time=now, event_end_time=now + timedelta(hours=2))

        # Sự kiện 2: Bắt đầu 2026-09-10
        create_event(test_session, event_start_time=now + timedelta(days=9),
                     event_end_time=now + timedelta(days=9, hours=2))

        # Tìm các sự kiện diễn ra trong ngày 2026-09-01
        items, _ = get_events_load_more(
            event_from_date=now - timedelta(hours=1),
            event_to_date=now + timedelta(hours=3)
        )

        assert len(items) == 1

    def test_pagination_boundary_limits(self, test_session):
        """2. Test ép biên page < 1 và page_size > 100"""
        create_event(test_session)

        # Truyền page = -5 -> Hàm tự ép max(1, -5) = 1 (Không bị crash SQL)
        items, _ = get_events_load_more(page=-5)
        assert len(items) == 1

        events = [
            EventModel(name=f"Event {i}", company_id=1)
            for i in range(105)
        ]
        test_session.add_all(events)
        test_session.commit()
        items, has_next = get_events_load_more(page_size=200)

        assert len(items) == 100
        assert has_next is True

    def test_order_by_id_descending(self, test_session):
        """3. Test sự kiện mới tạo (ID lớn hơn) phải xếp lên đầu"""
        e1 = create_event(test_session, name="Sự kiện cũ")
        e2 = create_event(test_session, name="Sự kiện mới")

        items, _ = get_events_load_more()

        assert items[0].id == e2.id  # ID lớn hơn đứng trước
        assert items[1].id == e1.id

    def test_whitespace_keyword_ignored(self, test_session):
        """4. Test keyword chỉ chứa khoảng trắng '   ' thì không filter lung tung"""
        create_event(test_session, name="Sự kiện 1")
        create_event(test_session, name="Sự kiện 2")

        # keyword="   " -> strip() thành rỗng -> lấy đủ 2 items
        items, _ = get_events_load_more(keyword="   ")
        assert len(items) == 2

    def test_filter_by_company_and_location(self, test_session):
        """5. Test lọc theo company_id và location_id"""
        create_event(test_session, company_id=1, location_id=10)
        create_event(test_session, company_id=2, location_id=20)

        items, _ = get_events_load_more(company_id=1, location_id=10)
        assert len(items) == 1
        assert items[0].company_id == 1
        assert items[0].location_id == 10

    def test_no_results_found(self, test_session):
        """6. Test không tìm thấy kết quả phù hợp"""
        create_event(test_session, name="Sự kiện A")

        items, has_next = get_events_load_more(keyword="Từ khóa không tồn tại 12345")

        assert items == []
        assert has_next is False