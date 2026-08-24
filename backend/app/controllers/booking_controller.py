from http.client import responses

from flask import Blueprint, request

from app.dto.booking_dto import CreateTicketRequestDTO, TicketDetailRequest, TicketResponse, TicketDetailResponse, \
    TicketListResponse
from app.dto.payment_dto import PaymentRequest
from app.services import booking_services
from app.utils.json import NewPackage, StatusResponse

booking_api = Blueprint('booking_api', __name__, url_prefix='/bookings')


@booking_api.route('/create', methods=['POST'])
# @jwt_required()
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

#xem chi tiet vé
@booking_api.route('/details', methods=['GET'])
# @jwt_required()
def get_details():
    data = request.get_json()
    validated_data = TicketDetailRequest().load(data)
    response = booking_services.get_by_code(validated_data)
    result = TicketDetailResponse().dump(response)
    return NewPackage(status=StatusResponse.SUCCESS,
        message="Lấy dữ liệu thành công",
        data=result,
        status_code=200 )



#xem lịch sử (lấy toàn bộ vé của user)
@booking_api.route('/list', methods=['GET'])
# @jwt_required()
def list_tickets():
    response = booking_services.list_tickets()
    result = TicketListResponse(many=True).dump(response)
    return NewPackage(status=StatusResponse.SUCCESS,
        message="Lấy dữ liệu thành công",
        data=result,
        status_code=200)

#hủy vé\
@booking_api.route('/cancel', methods=['POST'])
# @jwt_required()
def cancel():
    data = request.get_json()
    data = PaymentRequest().load(data)
    booking_services.cancel_ticket(data)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Hủy vé thành công",
        status_code=200)