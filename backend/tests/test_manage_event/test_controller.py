from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.errors.error_code import ErrorCode
from app.models import EventStatus
from app.utils.exception import AppException
from tests.test_manage_event.gen_data import make_event_payload, make_mock_event


# ==============================================================================
# 1. TEST POST /events (TẠO SỰ KIỆN - DRAFT & PUBLISHED)
# ==============================================================================
class TestCreateEventRoute:

    @patch("app.services.event_service.create_draft_event")
    def test_create_draft_event_success(self, mock_create_draft, client):
        """Tạo nháp sự kiện thành công (status != PUBLISHED hoặc không truyền status)."""
        mock_create_draft.return_value = SimpleNamespace(id=1)

        payload = make_event_payload(status="draft")
        res = client.post("/events", json=payload)

        assert res.status_code == 201
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["data"]["id"] == 1
        assert res.json["message"] == "Lưu nháp sự kiện thành công"
        mock_create_draft.assert_called_once()

    @patch("app.services.event_service.create_and_publish_event")
    def test_create_and_publish_event_success(self, mock_create_publish, client):
        """Tạo và xuất bản sự kiện thành công (status == 'PUBLISHED')."""
        mock_create_publish.return_value = SimpleNamespace(id=2)

        payload = make_event_payload(name="Đại Nhạc Hội 2026", status="published")
        res = client.post("/events", json=payload)
        print("\n--- SCHEMA VALIDATION ERROR ---:", res.json)


        assert res.status_code == 201
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["data"]["id"] == 2
        assert res.json["message"] == "Xuất bản sự kiện thành công"
        mock_create_publish.assert_called_once()


class TestCreateReportRoute:

    @patch("app.controllers.event_controller.socketio.emit")
    @patch("app.services.event_service.get_event_creator_id", return_value=2)
    @patch("app.services.event_service.create_report")
    def test_create_report_notifies_reporter_and_organizer(
        self, mock_create_report, mock_get_creator, mock_emit, client
    ):
        mock_create_report.return_value = SimpleNamespace(
            id=10, user_id=1, event_id=5, name="Vấn đề", content="Nội dung"
        )

        response = client.post(
            "/api/events/5/report",
            json={"user_id": 1, "event_id": 5, "name": "Vấn đề", "content": "Nội dung"},
        )

        assert response.status_code == 200
        mock_get_creator.assert_called_once_with(5)
        assert mock_emit.call_count == 2
        rooms = {call.kwargs["to"] for call in mock_emit.call_args_list}
        assert rooms == {"user:1", "user:2"}
        assert all(call.args[0] == "report_created" for call in mock_emit.call_args_list)


# ==============================================================================
# 2. TEST GET /events/<id> (CHI TIẾT SỰ KIỆN)
# ==============================================================================
class TestGetEventDetailRoute:

    @patch("app.services.event_service.get_event_detail")
    def test_get_event_detail_success(self, mock_get_detail, client):
        """Lấy chi tiết sự kiện thành công."""
        mock_get_detail.return_value = make_mock_event(id=1, name="Đại Nhạc Hội 2026")

        res = client.get("/events/1")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["data"]["id"] == 1
        assert res.json["message"] == "Lấy thông tin chi tiết sự kiện thành công"
        mock_get_detail.assert_called_once_with(1)

    @patch("app.services.event_service.get_event_detail")
    def test_get_event_detail_not_found(self, mock_get_detail, client):
        """Trả về 404 khi không tìm thấy sự kiện."""
        mock_get_detail.side_effect = AppException(ErrorCode.EVENT_NOT_FOUND)

        res = client.get("/events/999")

        assert res.status_code == 404
        assert res.json["status"].upper() == "ERROR"
        assert res.json["message"] == ErrorCode.EVENT_NOT_FOUND.message


# ==============================================================================
# 3. TEST PATCH /events/<id> (CẬP NHẬT SỰ KIỆN)
# ==============================================================================
class TestUpdateEventRoute:

    @patch("app.services.event_service.update_event")
    def test_update_event_success(self, mock_update, client):
        """Cập nhật thông tin sự kiện thành công."""
        mock_update.return_value = make_mock_event(id=1, name="Tên Sự Kiện Mới")

        payload = {"name": "Tên Sự Kiện Mới"}
        res = client.patch("/events/1", json=payload)

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Cập nhật sự kiện thành công"
        mock_update.assert_called_once()


# ==============================================================================
# 4. TEST GET /events (DANH SÁCH SỰ KIỆN / LOAD MORE)
# ==============================================================================
class TestGetEventsListRoute:

    @patch("app.services.event_service.get_events_load_more")
    def test_get_events_list_success(self, mock_get_list, client):
        """Lấy danh sách sự kiện phân trang thành công."""
        mock_item = make_mock_event(id=1, name="Đại Nhạc Hội 2026")

        mock_response_dto = SimpleNamespace(
            items=[mock_item],
            page=1,
            page_size=10,
            has_next=False
        )
        mock_get_list.return_value = mock_response_dto

        res = client.get("/events?page=1&page_size=10")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert "items" in res.json["data"]
        assert res.json["data"]["page"] == 1
        assert res.json["data"]["has_next"] is False
        mock_get_list.assert_called_once()


# ==============================================================================
# 5. TEST DELETE /events/<id> (XÓA SỰ KIỆN)
# ==============================================================================
class TestDeleteEventRoute:

    @patch("app.services.event_service.delete_event")
    def test_delete_event_success(self, mock_delete, client):
        """Xóa sự kiện thành công (HTTP 204)."""
        mock_delete.return_value = None

        res = client.delete("/events/1")

        assert res.status_code == 204
        assert res.data == b""
        mock_delete.assert_called_once_with(1)

    @patch("app.services.event_service.delete_event")
    def test_delete_published_event_fails(self, mock_delete, client):
        """Báo lỗi khi cố xóa sự kiện đã xuất bản (PUBLISHED)."""
        mock_delete.side_effect = AppException(ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED)

        res = client.delete("/events/1")

        assert res.status_code == 400
        assert res.json["status"].upper() == "ERROR"
        assert res.json["message"] == ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED.message


# ==============================================================================
# 6. TEST PATCH /events/<id>/cancel (HỦY SỰ KIỆN)
# ==============================================================================
class TestCancelEventRoute:

    @patch("app.services.event_service.cancel_event")
    def test_cancel_event_success(self, mock_cancel, client):
        """Hủy sự kiện thành công."""
        mock_cancel.return_value = make_mock_event(id=1, status=EventStatus.CANCELLED)

        res = client.patch("/events/1/cancel")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Hủy sự kiện thành công."
        mock_cancel.assert_called_once_with(1)


# ==============================================================================
# 7. TEST PATCH /events/<id>/restore (KHÔI PHỤC SỰ KIỆN)
# ==============================================================================
class TestRestoreEventRoute:

    @patch("app.services.event_service.restore_event")
    def test_restore_event_success(self, mock_restore, client):
        """Khôi phục sự kiện thành công."""
        mock_restore.return_value = None

        res = client.patch("/events/1/restore")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json.get("data") is None
        assert res.json["message"] == "Khôi phục sự kiện thành công."
        mock_restore.assert_called_once_with(1)


# ==============================================================================
# 8. TEST PATCH /events/<id>/publish (XUẤT BẢN SỰ KIỆN TRỰC TIẾP)
# ==============================================================================
class TestPublishEventRoute:

    @patch("app.services.event_service.publish_event")
    def test_publish_event_success(self, mock_publish, client):
        """Xuất bản sự kiện thành công."""
        mock_publish.return_value = make_mock_event(id=1, status=EventStatus.PUBLISHED)

        res = client.patch("/events/1/publish")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Xuất bản sự kiện thành công."
        mock_publish.assert_called_once_with(1)