from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.services import payment_services, booking_services
from app.dto.payment_dto import PaymentRequest
from app.utils.errors import APIError
from app.utils.json import NewPackage, StatusResponse
import os


payment_api = Blueprint('payment', __name__, url_prefix = '/payments')

@payment_api.route('/create', methods=['POST'])
# @jwt_required()
def create():
    res = payment_services.create(PaymentRequest().load(request.get_json()))
    return NewPackage(status=StatusResponse.SUCCESS, message="Create payment successful",data=res,status_code=201)

@payment_api.route('/<string:method>/callback', methods=['POST'])
def callback(method):
    print(">>> ĐÃ NHẬN ĐƯỢC IPN TỪ MOMO! <<<")
    payment = payment_services.callback(method, request.get_json())
    booking_services.send_ticket(payment.ticket_code)
    return NewPackage(status=StatusResponse.SUCCESS, message="Payment successful",status_code=200)

@payment_api.route('/refund', methods = ['POST'])
@jwt_required()
def refund():
    res = payment_services.refund(PaymentRequest().load(request.get_json()))
    return NewPackage(status=StatusResponse.SUCCESS, message="Refund payment successful", data=res, status_code=201)

@payment_api.route('/<string:method>/transaction', methods=['POST'])
@jwt_required()
def transaction(method):
    data = request.get_json()
    result = payment_services.transaction(method, data)
    return NewPackage(status=StatusResponse.SUCCESS, message= "success", data=result,  status_code=200)


