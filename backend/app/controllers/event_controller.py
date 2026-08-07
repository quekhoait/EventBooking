# controllers/event_controller.py
from flask import Blueprint, request

from app.dto.event_dto import EventCreateSchema
from app.services import event_service
from app.utils.json import NewPackage, StatusResponse

event_bp = Blueprint('event', __name__)
event_create_schema = EventCreateSchema()


@event_bp.route('/events', methods=['POST'])
def create_event():
    json_data = request.get_json() or {}

    event_obj = event_create_schema.load(json_data)

    created_event = event_service.create_event(event_obj)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data={"id": created_event.id},
        message="Tạo sự kiện thành công",
        status_code=201
    )