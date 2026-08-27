import datetime
from app import db
from enum import Enum
from .BaseModel import BaseModel

class PaymentStatus(Enum):
    PENDING = 'PENDING'
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'


class PaymentType(Enum):
    PAYMENT = 'PAYMENT'
    REFUND = 'REFUND'

class TicketStatus(Enum):
    PENDING = 'PENDING'
    SUCCESS = 'SUCCESS'
    CANCELLED = 'CANCELLED'
    REFUNDED = 'REFUNDED'

class TicketModel(BaseModel):
    __tablename__ = 'ticket'
    code = db.Column(db.String(8), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey('seat.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    discount_id = db.Column(db.Integer, db.ForeignKey('discount.id'), nullable=True)
    status = db.Column(db.Enum(TicketStatus), default=TicketStatus.PENDING, nullable=False)
    face_image = db.Column(db.String(255), nullable=False)
    seat = db.relationship('Seat', backref='tickets', lazy=True)
    payments = db.relationship('PaymentModel', backref='ticket', lazy=True)


class DiscountModel(BaseModel):
    __tablename__ = 'discount'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(10), nullable=False)  # 'percentage' or 'amount'
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)

    tickets = db.relationship('TicketModel', backref='discount', lazy=True)




class PaymentModel(BaseModel):
    __tablename__ = 'payment'
    code = db.Column(db.String(12), primary_key=True)
    ticket_code = db.Column(db.String(8), db.ForeignKey('ticket.code'), nullable=False)
    payment_method = db.Column(db.String(50))
    transaction_id = db.Column(db.String(100))
    amount = db.Column(db.Float, nullable=False)
    pay_url = db.Column(db.Text)
    expired_time = db.Column(db.DateTime)
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    type = db.Column(db.Enum(PaymentType), default=PaymentType.PAYMENT, nullable=False)