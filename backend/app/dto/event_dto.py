from marshmallow import fields, validate, validates_schema, ValidationError, EXCLUDE

from app.dto import BaseSchema
from app.dto.mixins_dto import DateRangeValidationMixin
from app.models import EventStatus


# =============================================================================
# 1. Schema con cho Ghế / Vé
# =============================================================================
class EventSeatCreateSchema(BaseSchema):
    event_ticket_type_id = fields.Integer(
        required=True,
        error_messages={"required": "ID loại vé không được để trống."}
    )
    seat_total = fields.Integer(
        required=True,
        validate=validate.Range(min=1, error="Tổng số lượng ghế phải từ 1 trở lên."),
        error_messages={"required": "Tổng số lượng ghế không được để trống."}
    )
    price = fields.Float(
        required=True,
        validate=validate.Range(min=0, error="Giá vé không được âm."),
        error_messages={"required": "Giá vé không được để trống."}
    )


# =============================================================================
# 2. BASE SCHEMA (Phải đặt ĐẦU TIÊN để 2 class dưới kế thừa)
# =============================================================================
class BaseEventSchema(BaseSchema, DateRangeValidationMixin):
    class Meta:
        unknown = EXCLUDE

    name = fields.String(
        required=True,
        validate=validate.Length(min=5, max=100, error="Tên sự kiện phải từ 5 đến 100 ký tự."),
        error_messages={"required": "Tên sự kiện không được để trống."}
    )
    status = fields.Enum(
        EventStatus,
        by_value=True,
        required=True,
        error_messages={"required": "Trạng thái không được để trống.", "invalid": "Trạng thái không hợp lệ."}
    )
    description = fields.String(allow_none=True, required=False)
    image = fields.Url(allow_none=True, required=False, error_messages={"invalid": "Đường dẫn ảnh không hợp lệ."})

    location_id = fields.Integer(allow_none=True, required=False)
    company_id = fields.Integer(allow_none=True, required=False)
    category_id = fields.Integer(allow_none=True, required=False)

    start_time = fields.DateTime(allow_none=True, required=False)
    end_time = fields.DateTime(allow_none=True, required=False)
    event_start_time = fields.DateTime(allow_none=True, required=False)
    event_end_time = fields.DateTime(allow_none=True, required=False)

    event_seats = fields.Nested(EventSeatCreateSchema, many=True, allow_none=True, required=False)

    @validates_schema
    def validate_event_dates(self, data, **kwargs):
        event_start = data.get('event_start_time')
        event_end = data.get('event_end_time')

        if event_start and event_end and event_end <= event_start:
            raise ValidationError(
                "Thời gian kết thúc sự kiện phải sau thời gian bắt đầu.",
                field_name="event_end_time"
            )

        ticket_start = data.get('start_time')
        ticket_end = data.get('end_time')

        if ticket_start and ticket_end and ticket_end <= ticket_start:
            raise ValidationError(
                "Thời gian đóng bán vé phải sau thời gian mở bán.",
                field_name="end_time"
            )


# =============================================================================
# 3. SCHEMA LƯU NHÁP (Kế thừa từ BaseEventSchema ở trên)
# =============================================================================
class EventDraftSchema(BaseEventSchema):
    pass


# =============================================================================
# 4. SCHEMA XUẤT BẢN (Ghi đè lại các trường bắt buộc)
# =============================================================================
class EventPublishSchema(BaseEventSchema):
    image = fields.Url(required=True, error_messages={"required": "Đường dẫn ảnh không được để trống."})
    location_id = fields.Integer(required=True, error_messages={"required": "ID địa điểm không được để trống."})
    company_id = fields.Integer(required=True, error_messages={"required": "ID công ty không được để trống."})
    category_id = fields.Integer(required=True, error_messages={"required": "ID danh mục không được để trống."})

    start_time = fields.DateTime(required=True, error_messages={"required": "Thời gian mở bán không được để trống."})
    end_time = fields.DateTime(required=True, error_messages={"required": "Thời gian kết thúc bán vé không được để trống."})
    event_start_time = fields.DateTime(required=True, error_messages={"required": "Thời gian bắt đầu sự kiện không được để trống."})
    event_end_time = fields.DateTime(required=True, error_messages={"required": "Thời gian kết thúc sự kiện không được để trống."})

    event_seats = fields.Nested(
        EventSeatCreateSchema,
        many=True,
        required=True,
        validate=validate.Length(min=1, error="Sự kiện phải có ít nhất 1 loại vé/ghế khi xuất bản."),
        error_messages={"required": "Danh sách vé không được để trống."}
    )