import unittest

from app import create_app, db


class AppInitTestCase(unittest.TestCase):
    def test_create_app_initializes_database(self):
        app = create_app('development')
        with app.app_context():
            db.engine.connect()
            self.assertTrue(app.config['SQLALCHEMY_DATABASE_URI'])

    def test_create_app_registers_models(self):
        app = create_app('development')
        self.assertIn('user', db.metadata.tables)
        self.assertIn('event', db.metadata.tables)


if __name__ == '__main__':
    unittest.main()
