import os
import pytest
from flask import Flask
from faker import Faker
from app import db
from app.controllers import api as api_blueprint
from flask_jwt_extended import JWTManager

fake = Faker('vi_VN')

def create_test_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("TEST_DATABASE_URI")
    app.config["TESTING"] = True
    app.config["PAGE_SIZE"] = 2
    app.config["JWT_SECRET_KEY"] = "test-secret-key"
    JWTManager(app)

    app.register_blueprint(api_blueprint)
    db.init_app(app)
    return app

@pytest.fixture(scope="session")
def test_app():
    app = create_test_app()
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture(scope="function")
def test_session(test_app):
    connection = db.engine.connect()
    transaction = connection.begin()
    session = db._make_scoped_session(options={"bind": connection, "binds": {}})
    db.session = session
    yield session

    session.close()
    transaction.rollback()
    connection.close()




# @pytest.fixture
# def client(test_app):
#     return test_app.test_client()
#
# @pytest.fixture
# def mock_jwt(mocker):
#     mocker.patch('flask_jwt_extended.view_decorators.verify_jwt_in_request', return_value=None)
#     mocker.patch('flask_jwt_extended.utils.get_jwt_identity', return_value=4)
#     mocker.patch('flask_jwt_extended.utils.get_jwt', return_value={'sub': 4})