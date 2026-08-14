from flask import Blueprint, request

from app.dto.event_dto import EventDraftSchema, EventPublishSchema, EventDetailResponseSchema, EventUpdateSchema, \
    EventFilterQuerySchema, EventListResponseSchema
from app.models import EventStatus
from app.services import event_service
from app.utils.json import NewPackage, StatusResponse

event_bp = Blueprint('event', __name__)

# Khai báo 2 instance Schema
event_draft_schema = EventDraftSchema()
event_publish_schema = EventPublishSchema()
event_detail_schema = EventDetailResponseSchema()
event_update_schema = EventUpdateSchema()
event_filter_schema = EventFilterQuerySchema()
event_list_schema = EventListResponseSchema(many=True)

@event_bp.route('/events', methods=['POST'])
def create_event():
    json_data = request.get_json() or {}

    # 1. Đọc status thô từ JSON gửi lên (không phân biệt hoa/thường)
    raw_status = str(json_data.get('status', '')).upper()

    # 2. Quyết định Schema validate & Service handler
    if raw_status == EventStatus.PUBLISHED.name: # hoặc EventStatus.PUBLISHED.name tùy cách khai báo Enum
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

@event_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event_detail(event_id: int):
    # 1. Gọi service lấy dữ liệu sự kiện
    event = event_service.get_event_detail(event_id)

    # 2. Serialize model thành dict JSON
    event_data = event_detail_schema.dump(event)

    # 3. Trả về response chuẩn
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Lấy thông tin chi tiết sự kiện thành công",
        status_code=200
    )

@event_bp.route('/events/<int:event_id>', methods=['PATCH'])
def update_event(event_id: int):
    json_data = request.get_json() or {}

    # 1. Validate & Parse payload bằng EventUpdateSchema
    event_dto = event_update_schema.load(json_data)

    # 2. Gọi service cập nhật
    updated_event = event_service.update_event(event_id, event_dto)

    # 3. Serialize dữ liệu sự kiện sau khi cập nhật để trả về
    event_data = event_detail_schema.dump(updated_event)

    # 4. Trả response
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Cập nhật sự kiện thành công",
        status_code=200
    )

@event_bp.route('/events', methods=['GET'])
def get_events():
    # 1. Validate & Parse query parameters từ URL qua Schema
    query_params = event_filter_schema.load(request.args)

    # 2. Gọi service xử lý Load More (truy vấn 1 query duy nhất)
    response_dto = event_service.get_events_load_more(
        **vars(query_params)
    )

    # 3. Serialize danh sách EventModel -> JSON List qua Response Schema
    serialized_items = event_list_schema.dump(response_dto.items, many=True)

    # 4. Đóng gói kết quả trả về
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

@event_bp.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id: int):
    event_service.delete_event(event_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Xóa sự kiện thành công.",
        status_code=204
    )

@event_bp.route('/events/<int:event_id>/cancel', methods=['PATCH'])
def cancel_event(event_id: int):
    event = event_service.cancel_event(event_id)
    event_data = event_detail_schema.dump(event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Hủy sự kiện thành công.",
        status_code=200
    )

@event_bp.route('/events/<int:event_id>/restore', methods=['PATCH'])
def restore_event(event_id: int):
    event_service.restore_event(event_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Khôi phục sự kiện thành công.",
        status_code=200
    )

@event_bp.route('/events/<int:event_id>/publish', methods=['PATCH'])
def publish_event(event_id: int):
    # Gọi Service thực hiện xuất bản
    published_event = event_service.publish_event(event_id)

    # Serialize kết quả chi tiết sự kiện đã xuất bản
    event_data = event_detail_schema.dump(published_event)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=event_data,
        message="Xuất bản sự kiện thành công.",
        status_code=200
    )