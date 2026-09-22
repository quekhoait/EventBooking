from http.client import responses

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.dto.booking_dto import DiscountEvent,DiscountSchema, DiscountEventResponse, CreateTicketRequestDTO, TicketDetailRequest, TicketResponse, TicketDetailResponse, \
    TicketListResponse
from app.dto.payment_dto import PaymentRequest
from app.services import booking_services
from app.utils.json import NewPackage, StatusResponse
from app.utils.middleware import require_organizer

booking_api = Blueprint('booking_api', __name__, url_prefix='/bookings')


@booking_api.route('/create', methods=['POST'])
@jwt_required()
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
@booking_api.route('/details/<string:code>', methods=['GET'])
@jwt_required()
def get_details(code):
    response = booking_services.get_by_code(code)
    result = TicketDetailResponse().dump(response)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Lấy dữ liệu thành công",
        data=result,
        status_code=200
    )



#xem lịch sử (lấy toàn bộ vé của user)
@booking_api.route('/list', methods=['GET'])
@jwt_required()
def list_tickets():
    response = booking_services.list_tickets()
    result = TicketListResponse(many=True).dump(response)
    return NewPackage(status=StatusResponse.SUCCESS,
        message="Lấy dữ liệu thành công",
        data=result,
        status_code=200)

# Lấy toàn bộ vé của các sự kiện do organizer tạo
@booking_api.route('/organizer/tickets/<string:code>', methods=['GET'])
@jwt_required()
def list_organizer_tickets(code):
    response = booking_services.list_tickets_by_event_creator(code)
    result = TicketDetailResponse().dump(response)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Lấy danh sách vé các sự kiện thành công",
        data=result,
        status_code=200
    )

@booking_api.route('/organizer/tickets/<string:code>/checkin', methods=['POST'])
@jwt_required()
def checkin_organizer_ticket(code):
    response = booking_services.checkin_ticket_by_event_creator(code)
    result = TicketDetailResponse().dump(response)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Check-in vé thành công",
        data=result,
        status_code=200
    )

#hủy vé\
@booking_api.route('/cancel', methods=['POST'])
@jwt_required()
def cancel():
    data = request.get_json()
    data = PaymentRequest().load(data)
    booking_services.cancel_ticket(data)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="Hủy vé thành công",
        status_code=200)


@booking_api.route('/discount', methods=['POST'])
@jwt_required()
def createDiscount():
    data=request.get_json()
    data=DiscountSchema().load(data =data)
    schema = booking_services.create_discount(data=data)
    result = DiscountSchema().dump(schema)
    return NewPackage(  
        status=StatusResponse.SUCCESS,
        message="Tạo mã khuyến mãi thành công",
        data=result,
        status_code=200)
    

@booking_api.route('/discount', methods=['GET'])
@jwt_required()
def getDiscount():
    data = request.args.to_dict()
    res = DiscountEvent().load(data=data)
    schema = booking_services.get_discount(res)
    result = DiscountEventResponse().dump(schema)
    return NewPackage(  
        status=StatusResponse.SUCCESS,
        message="Lấy mã khuyến mãi thành công",
        data=result,
        status_code=200)