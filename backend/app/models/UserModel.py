
from enum import Enum
from app import db
from .BaseModel import BaseModel

class RoleEnum(Enum):
    ADMIN = 'admin'
    USER = 'user'
    STAFF  = 'staff'

class User(BaseModel):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    phone_number = db.Column(db.String(15), nullable=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    avatar = db.Column(db.String(255), default='/static/image/icon_user.png')
    role = db.Column(db.Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    auth_methods = db.relationship('UserAuthMethod', backref='user', lazy=True)
    tickets = db.relationship('TicketModel', foreign_keys='TicketModel.user_id', backref='user', lazy=True)

class UserAuthMethod(BaseModel):
    __tablename__ = 'user_auth_method'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    provider = db.Column(db.String(50))
    provider_id = db.Column(db.String(100))
    refresh_token = db.Column(db.String(500))