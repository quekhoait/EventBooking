from flask import Blueprint

from .booking_controller import booking_api

api = Blueprint('api', __name__, url_prefix='/api')
api.register_blueprint(booking_api)

