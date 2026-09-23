from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import true

from app import create_app, db, socketio, user_room
from app.dto.event_dto import (
    EventDraftSchema,
    EventPublishSchema,
    EventDetailResponseSchema,
    EventUpdateSchema,
    EventFilterQuerySchema,
    EventListResponseSchema,
    EventTicketTypeSchema,
    EventSeatDetailSchema,
    ReportEventResponse,
    ReportEventSchema,
)
from app.errors.error_code import ErrorCode
from app.models import EventStatus, UserModel
from app.services import event_service
from app.utils.exception import AppException
from app.utils.middleware import require_organizer
from app.utils.json import NewPackage, StatusResponse
from app.utils.validation import upload_image_file
from tests.test_manage_event.gen_data import make_event_payload, make_mock_event


# ==============================================================================
# BLUEPRINT DEFINITION (As provided in your snippet)
# ==============================================================================
event_bp = Blueprint('event', __name__)

event_draft_schema = EventDraftSchema()
event_publish_schema = EventPublishSchema()
event_detail_schema = EventDetailResponseSchema()
event_update_schema = EventUpdateSchema()
event_filter_schema = EventFilterQuerySchema()
event_list_schema = EventListResponseSchema(many=True)


def _parse_event_payload():
    content_type = request.content_type or ""

    if "application/json" in content_type:
        return request.get_json() or {}

    json_data = request.form.to_dict()

    image_file = request.files.get("image")
    if image_file and image_file.filename:
        json_data["image"] = upload_image_file(image_file, folder="events/images")

    event_seats = json_data.get("event_seats")
    if isinstance(event_seats, str):
        try:
            json_data["event_seats"] = json.loads(event_seats) if event_seats.strip() else []
        except ValueError:
            json_data["event_seats"] = []

    return json_data


@event_bp.route("/events", methods=["POST"])
def create_event():
    json_data = _parse_event_payload()
    user = require_organizer()
    creator_id = user.id
    json_data["company_id"] = user.company_id

    raw_status = str(json_data.get('status', EventStatus.PUBLISHED.name)).upper()
    if raw_status == EventStatus.PUBLISHED.name:
        event_dto = event_publish_schema.load(json_data)
        created_event = event_service.create_and_publish_event(event_dto)
        message = "Xuất bản sự kiện thành công"
    else:
        event_dto = event_draft_schema.load(json_data)
        created_event = event_service.create_draft_event(event_dto)
        message = "Lưu nháp sự kiện thành công"

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={"id": created_event.id},
        message=message,
        status_code=201
    )


@event_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event_detail(event_id: int):
    event = event_service.get_event_detail(event_id)
    event_data = event_detail_schema.dump(event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Lấy thông tin chi tiết sự kiện thành công",
        status_code=200
    )


@event_bp.route('/events/<int:event_id>', methods=['PATCH'])
@jwt_required()
def update_event(event_id: int):
    json_data = _parse_event_payload()
    require_organizer()

    event_dto = event_update_schema.load(json_data)
    updated_event = event_service.update_event(event_id, event_dto)
    event_data = event_detail_schema.dump(updated_event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Cập nhật sự kiện thành công",
        status_code=200
    )


@event_bp.route('/events', methods=['GET'])
def get_events():
    query_params = event_filter_schema.load(request.args)
    response_dto = event_service.get_events_load_more(**vars(query_params))
    serialized_items = event_list_schema.dump(response_dto.items, many=True)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={
            "items": serialized_items,
            "page": response_dto.page,
            "page_size": response_dto.page_size,
            "has_next": response_dto.has_next
        },
        message="Lấy danh sách sự kiện thành công",
        status_code=200
    )


@event_bp.route('/events/creator/<int:creator_id>', methods=['GET'])
def get_events_by_creator(creator_id: int):
    events = event_service.get_events_by_creator(creator_id=creator_id)
    serialized_items = event_list_schema.dump(events, many=True)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=serialized_items,
        message="Lấy danh sách sự kiện theo người tạo thành công",
        status_code=200,
    )


@event_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id: int):
    require_organizer()
    event_service.delete_event(event_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Xóa sự kiện thành công.",
        status_code=204
    )


@event_bp.route('/events/<int:event_id>/cancel', methods=['PATCH'])
@jwt_required()
def cancel_event(event_id: int):
    require_organizer()
    event = event_service.cancel_event(event_id)
    event_data = event_detail_schema.dump(event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Hủy sự kiện thành công.",
        status_code=200
    )


@event_bp.route('/events/<int:event_id>/restore', methods=['PATCH'])
@jwt_required()
def restore_event(event_id: int):
    require_organizer()
    event_service.restore_event(event_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Khôi phục sự kiện thành công.",
        status_code=200
    )


@event_bp.route('/events/<int:event_id>/publish', methods=['PATCH'])
@jwt_required()
def publish_event(event_id: int):
    require_organizer()
    published_event = event_service.publish_event(event_id)
    event_data = event_detail_schema.dump(published_event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Xuất bản sự kiện thành công.",
        status_code=200
    )


@event_bp.route('/events/<int:event_id>/tickets', methods=['GET'])
def get_tickets(event_id: int):
    data = event_service.get_tickets(event_id)
    tickets = EventSeatDetailSchema(many=True).dump(data)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=tickets,
        message="Lấy loại vé thành công!",
        status_code=200,
    )


@event_bp.route("/events/<int:event_id>/chatbox", methods=["GET"])
def get_chatbox_status(event_id: int):
    is_enabled = event_service.get_is_chatbox_enabled(event_id)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={"is_chatbox_enabled": is_enabled},
        message="Lấy trạng thái chatbox thành công!",
        status_code=200,
    )


@event_bp.route("/events/<int:event_id>/chatbox", methods=["PATCH"])
def update_chatbox_status(event_id: int):
    json_data = request.get_json() or {}
    is_enabled = json_data.get("is_chatbox_enabled")
    if is_enabled is None:
        return NewPackage(
            status=StatusResponse.FAILURE,
            data=None,
            message="Thiếu trường 'is_chatbox_enabled' trong payload.",
            status_code=400,
        )

    updated_status = event_service.set_is_chatbox_enabled(event_id, is_enabled)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={"is_chatbox_enabled": updated_status},
        message="Cập nhật trạng thái chatbox thành công!",
        status_code=200,
    )


@event_bp.route('/events/<int:event_id>/report', methods=['POST'])
def createReport(event_id: int):
    payload = ReportEventSchema().load(request.get_json())
    result = event_service.create_report(event_id=event_id, data=payload)
    schema = ReportEventResponse().dump(result)
    organizer_id = event_service.get_event_creator_id(event_id)
    notification = {
        "type": "report_created",
        "report": schema,
        "event_id": event_id,
        "message": "Có báo cáo mới cho sự kiện của bạn",
    }
    recipient_ids = {result.user_id, organizer_id}
    for recipient_id in recipient_ids:
        if recipient_id is not None:
            socketio.emit(
                "report_created",
                notification,
                to=user_room(recipient_id),
            )
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=schema,
        message="Tạo báo cáo thành công",
        status_code=200
    )


@event_bp.route('/events/<int:event_id>/report', methods=['GET'])
@jwt_required()
def getReport(event_id: int):
    user_id = get_jwt_identity()
    res = event_service.get_report(event_id=event_id, user_id=user_id)
    schema = ReportEventResponse(many=True).dump(res)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=schema,
        message="lấy báo cáo thành công",
        status_code=200
    )


@event_bp.route('/events/report_user', methods=['GET'])
@jwt_required()
def getReportUser():
    user_id = get_jwt_identity()
    res = event_service.get_report_by_userId(user_id=user_id)
    schema = ReportEventResponse(many=True).dump(res)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=schema,
        message="lấy báo cáo thành công",
        status_code=200
    )


# ==============================================================================
# TEST SUITE
# ==============================================================================

class TestCreateEventRoute:

    @patch("app.services.event_service.create_draft_event")
    def test_create_draft_event_success(self, mock_create_draft, client):
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
        mock_create_publish.return_value = SimpleNamespace(id=2)
        payload = make_event_payload(name="Đại Nhạc Hội 2026", status="published")
        res = client.post("/events", json=payload)

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


class TestGetEventDetailRoute:

    @patch("app.services.event_service.get_event_detail")
    def test_get_event_detail_success(self, mock_get_detail, client):
        mock_get_detail.return_value = make_mock_event(id=1, name="Đại Nhạc Hội 2026")
        res = client.get("/events/1")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["data"]["id"] == 1
        assert res.json["message"] == "Lấy thông tin chi tiết sự kiện thành công"
        mock_get_detail.assert_called_once_with(1)

    @patch("app.services.event_service.get_event_detail")
    def test_get_event_detail_not_found(self, mock_get_detail, client):
        mock_get_detail.side_effect = AppException(ErrorCode.EVENT_NOT_FOUND)
        res = client.get("/events/999")

        assert res.status_code == 404
        assert res.json["status"].upper() == "ERROR"
        assert res.json["message"] == ErrorCode.EVENT_NOT_FOUND.message


class TestUpdateEventRoute:

    @patch("app.services.event_service.update_event")
    def test_update_event_success(self, mock_update, client):
        mock_update.return_value = make_mock_event(id=1, name="Tên Sự Kiện Mới")
        payload = {"name": "Tên Sự Kiện Mới"}
        res = client.patch("/events/1", json=payload)

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Cập nhật sự kiện thành công"
        mock_update.assert_called_once()


class TestGetEventsListRoute:

    @patch("app.services.event_service.get_events_load_more")
    def test_get_events_list_success(self, mock_get_list, client):
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


class TestDeleteEventRoute:

    @patch("app.services.event_service.delete_event")
    def test_delete_event_success(self, mock_delete, client):
        mock_delete.return_value = None
        res = client.delete("/events/1")

        assert res.status_code == 204
        assert res.data == b""
        mock_delete.assert_called_once_with(1)

    @patch("app.services.event_service.delete_event")
    def test_delete_published_event_fails(self, mock_delete, client):
        mock_delete.side_effect = AppException(ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED)
        res = client.delete("/events/1")

        assert res.status_code == 400
        assert res.json["status"].upper() == "ERROR"
        assert res.json["message"] == ErrorCode.EVENT_CANNOT_DELETE_PUBLISHED.message


class TestCancelEventRoute:

    @patch("app.services.event_service.cancel_event")
    def test_cancel_event_success(self, mock_cancel, client):
        mock_cancel.return_value = make_mock_event(id=1, status=EventStatus.CANCELLED)
        res = client.patch("/events/1/cancel")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Hủy sự kiện thành công."
        mock_cancel.assert_called_once_with(1)


class TestRestoreEventRoute:

    @patch("app.services.event_service.restore_event")
    def test_restore_event_success(self, mock_restore, client):
        mock_restore.return_value = None
        res = client.patch("/events/1/restore")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json.get("data") is None
        assert res.json["message"] == "Khôi phục sự kiện thành công."
        mock_restore.assert_called_once_with(1)


class TestPublishEventRoute:

    @patch("app.services.event_service.publish_event")
    def test_publish_event_success(self, mock_publish, client):
        mock_publish.return_value = make_mock_event(id=1, status=EventStatus.PUBLISHED)
        res = client.patch("/events/1/publish")

        assert res.status_code == 200
        assert res.json["status"].upper() == "SUCCESS"
        assert res.json["message"] == "Xuất bản sự kiện thành công."
        mock_publish.assert_called_once_with(1)