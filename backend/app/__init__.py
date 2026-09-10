import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_caching import Cache
from authlib.integrations.flask_client import OAuth
import cloudinary
from flask_migrate import Migrate

from app.utils.exception import init_error_handlers
from config import config
from flask_mail import Mail
from flask_socketio import SocketIO, join_room
from flask_admin import Admin

mail = Mail()
db = SQLAlchemy()
cache = Cache()
jwt = JWTManager()
oauth = OAuth()
migrate = Migrate()
socketio = SocketIO(manage_session=False)


def user_room(user_id):
    return f"user:{user_id}"


@socketio.on('join_user_room')
def join_user_room(data):
    user_id = (data or {}).get('user_id')
    if user_id is not None:
        join_room(user_room(user_id))


def create_app(config_name=None):
    app = Flask(__name__, template_folder='templates', static_folder='static')

    selected_config = config_name or os.environ.get('FLASK_ENV')
    if not selected_config:
        selected_config = 'production' if os.environ.get('RENDER') else 'development'
    config_obj = config.get(selected_config, config['default'])
    app.config.from_object(config_obj)
    config_obj.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)
    jwt.init_app(app)
    allowed_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://event-booking-n325.vercel.app",  # Thêm domain Vercel của bạn vào đây
        ]

    socketio.init_app(app, cors_allowed_origins=allowed_origins)

    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )
    oauth.init_app(app)
    init_error_handlers(app)

    if app.config.get('GOOGLE_CLIENT_ID') and app.config.get('GOOGLE_CLIENT_SECRET'):
        oauth.register(
            name='google',
            client_id=app.config['GOOGLE_CLIENT_ID'],
            client_secret=app.config['GOOGLE_CLIENT_SECRET'],
            server_metadata_url=app.config['GOOGLE_SERVER_METADATA_URL'],
            client_kwargs={'scope': app.config['GOOGLE_CLIENT_SCOPE']},
        )

    if app.config.get('CLOUDINARY_CLOUD_NAME'):
        cloudinary.config(
            cloud_name=app.config['CLOUDINARY_CLOUD_NAME'],
            api_key=app.config['CLOUDINARY_API_KEY'],
            api_secret=app.config['CLOUDINARY_API_SECRET'],
        )
    from app.admin.dashboard import AdminDashboardView, register_admin_dashboard
    from app.admin.events import register_event_admin
    from app.admin.organizers import register_organizer_admin

    admin = Admin(
        app,
        name='Trang Quản Trị',
        index_view=AdminDashboardView(name='Tổng quan', endpoint='admin-dashboard'),
    )

    register_admin_dashboard(admin)
    register_event_admin(admin)
    register_organizer_admin(admin)

    from .controllers import api as controller_blueprint
    from .routes import routes
    app.register_blueprint(controller_blueprint)
    app.register_blueprint(routes)
    from app.pattern.method_payment import payment_context
    payment_context.init_app(app.config)
    return app