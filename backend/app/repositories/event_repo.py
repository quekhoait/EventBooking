from sqlalchemy.orm import joinedload

from app.models import EventModel, TicketModel, Seat


def find_event_by_id(event_id):
    return EventModel.query.get(event_id)

