from flask import Blueprint
from .event_controller import event_bp
from .booking_controller import booking_api
from .auth_controller import auth_api
from .event_controller import event_bp
from .payment_controller import payment_api
from .reference_data_controller import data_api

api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(booking_api)
api.register_blueprint(payment_api)
api.register_blueprint(event_bp)
api.register_blueprint(auth_api)
api.register_blueprint(data_api)
