import pytest
from app import create_app, db
from tests.test_manage_event.gen_data import create_event


@pytest.fixture(autouse=True)
def app_context():
    app = create_app('testing_fake')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app_context):
    return app_context.test_client()

@pytest.fixture
def test_session(app_context):
    yield db.session
    db.session.rollback()

@pytest.fixture
def event(test_session):
    return create_event(test_session)