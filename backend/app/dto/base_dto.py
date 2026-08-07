from app import ma, db

class BaseAutoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        load_instance = True       # Tự map thành Object Model
        sqla_session = db.session  # Session dùng để query/load
        include_fk = True          # Tự map các trường Foreign Key (location_id,...)
        include_relationships = False # Tùy chọn: tắt load relation mặc định để nhẹ payload