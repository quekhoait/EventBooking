from app.models import EventModel

def find_event_by_id(event_id):
    return EventModel.query.get(event_id)