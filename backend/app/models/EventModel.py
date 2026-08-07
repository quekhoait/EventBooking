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
    name = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    #thời gian bán vé và hết bán
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    #thời gian diễn ra sự kiện
    event_start_time = db.Column(db.DateTime, nullable=False)
    event_end_time = db.Column(db.DateTime, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=False)
    status = db.Column(db.Enum(EventStatus), default=EventStatus.DRAFT)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('event_category.id'), nullable=False)

    location_name = db.Column(db.String(255))

    location = db.relationship('LocationModel', backref='events', lazy=True)
    seats = db.relationship('EventSeat', backref='event', lazy=True)
    tickets = db.relationship('TicketModel', backref='event', lazy=True)

#Dùng lưu quy định 
class EventSeat(BaseModel):
    __tablename__ = 'event_seat'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    seat_number = db.Column(db.String(10), nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    event_ticket_type_id = db.Column(db.Integer, db.ForeignKey('event_ticket_type.id'), nullable=False)
    
class EventTicketType(BaseModel):
    __tablename__ = 'event_ticket_type'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)

