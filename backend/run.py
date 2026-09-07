from app import create_app, db, socketio
from app.models import *

app = create_app()
if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    print(app.url_map)
    socketio.run(app, debug=True, host="0.0.0.0", port=8000)
