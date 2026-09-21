import json

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import true

from app.dto.event_dto import EventDraftSchema, EventPublishSchema, EventDetailResponseSchema, EventUpdateSchema, \
    EventFilterQuerySchema, EventListResponseSchema, EventTicketTypeSchema,ReportEventResponse, EventSeatDetailSchema, ReportEventSchema
from app.models import EventStatus, UserModel
from app.services import event_service
from app import socketio, user_room
from app.utils.middleware import require_organizer
from app.utils.json import NewPackage, StatusResponse
from app.utils.validation import upload_image_file


event_bp = Blueprint('event', __name__)

event_draft_schema = EventDraftSchema()
event_publish_schema = EventPublishSchema()
event_detail_schema = EventDetailResponseSchema()
event_update_schema = EventUpdateSchema()
event_filter_schema = EventFilterQuerySchema()
event_list_schema = EventListResponseSchema(many=True)


def _parse_event_payload():
    """Đọc payload từ JSON hoặc formData (multipart/form-data), upload ảnh nếu có."""
    content_type = request.content_type or ""

    if "application/json" in content_type:
        return request.get_json() or {}

    json_data = request.form.to_dict()

    # Upload ảnh từ file lên Cloudinary
    image_file = request.files.get("image")
    if image_file and image_file.filename:
        json_data["image"] = upload_image_file(image_file, folder="events/images")


    # Parse danh sách ghế nếu được gửi dạng chuỗi JSON trong form
    event_seats = json_data.get("event_seats")
    if isinstance(event_seats, str):
        try:
            json_data["event_seats"] = json.loads(event_seats) if event_seats.strip() else []
        except ValueError:
            json_data["event_seats"] = []

    return json_data

@event_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    json_data = _parse_event_payload()
    user = require_organizer()
    creator_id = user.id
    json_data["company_id"] = user.company_id

    raw_status = str(json_data.get('status', EventStatus.PUBLISHED.name)).upper()
    if raw_status == EventStatus.PUBLISHED.name:
        event_dto = event_publish_schema.load(json_data)
        created_event = event_service.create_and_publish_event(event_dto, creator_id=creator_id)
        message = "Xuất bản sự kiện thành công"
    else:
        event_dto = event_draft_schema.load(json_data)
        created_event = event_service.create_draft_event(event_dto, creator_id=creator_id)
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

    response_dto = event_service.get_events_load_more(
        **vars(query_params)
    )

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

@event_bp.route('/events/<int:event_id>/tickets', methods=['GET'])
def get_tickets(event_id: int):
    data = event_service.get_tickets(event_id)
    tickets = EventSeatDetailSchema(many=True).dump(data)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=tickets,
        message="Lấy loại vé thành công!",
        status_code=200
    )
    
@event_bp.route('/events/<int:event_id>/report', methods=['POST'])
def createReport(event_id: int):
    payload = ReportEventSchema().load(request.get_json()  )
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
def getReport(event_id:int):
    user_id = 2
    res = event_service.get_report(event_id=event_id, user_id=user_id)
    schema = ReportEventResponse(many=True).dump(res)
    return NewPackage(
            status=StatusResponse.SUCCESS,
            data=schema,
            message="lấy báo cáo thành công",
            status_code=200
        )
    
@event_bp.route('/events/report_user', methods=['GET'])
def getReportUser():
    user_id =1
    res = event_service.get_report_by_userId(user_id=user_id)
    schema = ReportEventResponse(many=True).dump(res)
    return NewPackage(
            status=StatusResponse.SUCCESS,
            data=schema,
            message="lấy báo cáo thành công",
            status_code=200
        )