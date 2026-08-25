from flask import Blueprint

from .booking_controller import booking_api
from .auth_controller import auth_api
from .payment_controller import payment_api

api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(booking_api)
api.register_blueprint(payment_api)

api.register_blueprint(auth_api)
