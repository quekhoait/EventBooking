from flask import Blueprint, request

from app.dto.event_dto import EventDraftSchema, EventPublishSchema
from app.models import EventStatus
from app.services import event_service
from app.utils.json import NewPackage, StatusResponse

event_bp = Blueprint('event', __name__)

# Khai báo 2 instance Schema
event_draft_schema = EventDraftSchema()
event_publish_schema = EventPublishSchema()


@event_bp.route('/events', methods=['POST'])
def create_event():
    json_data = request.get_json() or {}

    # 1. Đọc status thô từ JSON gửi lên (không phân biệt hoa/thường)
    raw_status = str(json_data.get('status', '')).upper()

    # 2. Quyết định Schema validate & Service handler
    if raw_status == EventStatus.PUBLISHED.value: # hoặc EventStatus.PUBLISHED.name tùy cách khai báo Enum
        event_dto = event_publish_schema.load(json_data)
        created_event = event_service.create_and_publish_event(event_dto)
        message = "Xuất bản sự kiện thành công"
    else:
        event_dto = event_draft_schema.load(json_data)
        created_event = event_service.create_draft_event(event_dto)
        message = "Lưu nháp sự kiện thành công"

    # 3. Trả về response
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={"id": created_event.id},
        message=message,
        status_code=201
    )