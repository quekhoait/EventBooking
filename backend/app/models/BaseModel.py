
from app import db
from sqlalchemy import func

class BaseModel(db.Model):
    __abstract__ = True
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

class LocationModel(BaseModel):
    __tablename__ = 'location'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('location.id'), nullable=True)
    children = db.relationship('LocationModel', backref=db.backref('parent', remote_side='LocationModel.id'), lazy=True)

    @property
    def full_name(self):
        """
        Trả về tên đầy đủ từ nhỏ đến lớn.
        VD: 'Quận Cầu Giấy, Hà Nội, Việt Nam'
        """
        if self.parent:
            return f"{self.name}, {self.parent.full_name}"
        return self.name

# class Rules(BaseModel):
#     pass

class Company(BaseModel):
    __tablename__ = 'company'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # logo = CloudinaryField(max_length=255, nullable=True)   
    name = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    tax_code = db.Column(db.String(50), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey('location.id'))

    location = db.relationship('LocationModel', backref='companies', lazy=True)
    events = db.relationship('EventModel', backref='company', lazy=True)