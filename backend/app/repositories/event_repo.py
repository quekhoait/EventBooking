from app import db
from app.models import EventModel, TicketModel, Seat


def find_event_by_id(event_id):
    return db.session.query(EventModel).filter(EventModel.id == event_id).first()

