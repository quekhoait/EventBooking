from flask import Blueprint, request

from app.dto.booking_dto import CreateTicketRequestDTO, TicketResponse
from app.services import booking_services
from app.utils.json import NewPackage, StatusResponse

booking_api = Blueprint('booking_api', __name__, url_prefix='/bookings')


@booking_api.route('/create', methods=['POST'])
def create():
    data = request.get_json()
    data = CreateTicketRequestDTO().load(data)
    response = booking_services.create(data)
    result = TicketResponse().dump(response)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Tạo Thành công",
        data=result,
        status_code=200
    )