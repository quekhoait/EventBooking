import unittest

from app import create_app, db


class AppInitTestCase(unittest.TestCase):
    def test_create_app_initializes_database(self):
        app = create_app('development')
        with app.app_context():
            db.engine.connect()
            self.assertTrue(app.config['SQLALCHEMY_DATABASE_URI'])


if __name__ == '__main__':
    unittest.main()
