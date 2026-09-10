from gevent import monkey

monkey.patch_all()  

import os
from app import create_app, db, socketio
from app.models import *

app = create_app()

if __name__ == "__main__":
  with app.app_context():
    db.create_all()

  print(app.url_map)

  port = int(os.environ.get("PORT", 8000))

  socketio.run(app, host="0.0.0.0", port=port)