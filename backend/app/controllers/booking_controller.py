from flask import Blueprint

booking_api = Blueprint('booking_api', __name__, url_prefix='/bookings')


@booking_api.route('/create', methods=['POST'])
def create():
    return {"message": "Booking endpoint is ready"}, 200

