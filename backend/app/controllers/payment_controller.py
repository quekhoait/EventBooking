from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.services import payment_services
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





