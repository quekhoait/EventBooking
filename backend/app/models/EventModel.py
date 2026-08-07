from enum import Enum
from app import db
from .BaseModel import BaseModel
from .SoftDeleteModel import SoftDeleteModel



class EventStatus(Enum):
    DRAFT = 'draft'
    PUBLISHED = 'published'
    CANCELLED = 'cancelled'


class EventCategory(BaseModel):
    __tablename__ = 'event_category'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)

    events = db.relationship('EventModel', backref='category', lazy=True)
    
class EventModel(SoftDeleteModel):
    __tablename__ = 'event'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    image = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)

    max_per_user = db.Column(db.Integer, default=5)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    #thời gian diễn ra sự kiện
    event_start_time = db.Column(db.DateTime, nullable=True)
    event_end_time = db.Column(db.DateTime, nullable=True)

    status = db.Column(db.Enum(EventStatus), default=EventStatus.DRAFT, nullable=True)

    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('event_category.id'), nullable=True)
    location_name = db.Column(db.String(255))
    location = db.relationship('LocationModel', backref='events', lazy=True)
    seats = db.relationship('EventSeat', backref='event', lazy=True)
    # tickets = db.relationship('TicketModel', backref='event', lazy=True)
    discount = db.relationship('DiscountModel', backref='event', lazy=True)

# Dùng lưu quy định
class EventSeat(BaseModel):
    __tablename__ = 'event_seat'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    seat_total = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)
    event_ticket_type_id = db.Column(db.Integer, db.ForeignKey('event_ticket_type.id'), nullable=False)


class Seat(BaseModel):
    __tablename__ = 'seat'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    seat_code = db.Column(db.String(20), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    event_ticket_type_id = db.Column(db.Integer, db.ForeignKey('event_ticket_type.id'), nullable=False)


class EventTicketType(BaseModel):
    __tablename__ = 'event_ticket_type'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)

    description = db.Column(db.Text, nullable=True)


class Report(BaseModel):
    __tablename__ = 'report'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    content = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)