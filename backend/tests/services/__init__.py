import pytest

from app import create_app, db


@pytest.fixture(autouse=True)
def app_context(test_app):
    app = create_app()
    app_context = app.app_context()
    app_context.push()
    db.create_all()

    yield app

    db.session.remove()
    db.drop_all()
    app_context.pop()


@pytest.fixture(autouse=True)
def test_client(app_context):
    return app_context.test_client()
