import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_caching import Cache
from authlib.integrations.flask_client import OAuth
import cloudinary

from app.utils.exception import init_error_handlers
from config import config

db = SQLAlchemy()
ma = Marshmallow()

cache = Cache()
jwt = JWTManager()
oauth = OAuth()

def create_app(config_name=None):
    app = Flask(__name__, template_folder='templates', static_folder='static')

    selected_config = config_name or os.environ.get('FLASK_ENV', 'development')
    config_obj = config.get(selected_config, config['default'])
    app.config.from_object(config_obj)

    db.init_app(app)
    cache.init_app(app)
    jwt.init_app(app)

    from app import models
    migrate = Migrate(app, db)

    CORS(app)
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

    from .controllers import api as controller_blueprint
    from .routes import routes
    from app.controllers.event_controller import event_bp
    from app.controllers.demo_controller import demo_bp

    app.register_blueprint(controller_blueprint)
    app.register_blueprint(routes)
    app.register_blueprint(demo_bp)

    app.register_blueprint(event_bp)

    return app