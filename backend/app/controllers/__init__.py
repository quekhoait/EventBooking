from flask import Blueprint

from .booking_controller import booking_api
<<<<<<<<< Temporary merge branch 1
from .auth_controller import auth_api
=======
from .payment_controller import payment_api
>>>>>>> 6c5f404f3d36c6e5283c62669ce7d726b1ea7fcd

api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(booking_api)
<<<<<<< HEAD
api.register_blueprint(auth_api)
=======
api.register_blueprint(payment_api)

>>>>>>> 6c5f404f3d36c6e5283c62669ce7d726b1ea7fcd
