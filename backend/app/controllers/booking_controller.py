from flask import Blueprint, request
booking_api = Blueprint('booking_api', __name__, url_prefix='/bookings')


@booking_api.route('/create', methods=['POST'])
def create():
    data = request.json()
    data = BookingRe

