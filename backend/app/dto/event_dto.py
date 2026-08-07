# schemas/event_schema.py
from marshmallow import fields, validate, validates_schema, ValidationError, EXCLUDE

from app.dto import BaseSchema
from app.dto.mixins_dto import DateRangeValidationMixin
from app.models import EventStatus


class EventCreateSchema(BaseSchema, DateRangeValidationMixin):
    class Meta:
        unknown = EXCLUDE
    # 1. Khai báo thủ công các trường dữ liệu cần thiết cho API Tạo Sự Kiện
    name = fields.String(
        required=True,
        validate=validate.Length(min=5, max=100, error="Tên sự kiện phải từ 5 đến 100 ký tự.")
    )

    description = fields.String(allow_none=True)
    image = fields.Url(
        required=True,
        error_messages={"required": "Đường dẫn ảnh không được để trống.", "invalid": "Đường dẫn ảnh không hợp lệ."}
    )
    location_id = fields.Integer(
        required=True,
        error_messages={"required": "ID địa điểm không được để trống."}
    )
    company_id = fields.Integer(
        required=True,
        error_messages={"required": "ID công ty không được để trống."}
    )
    category_id = fields.Integer(
        required=True,
        error_messages={"required": "ID danh mục không được để trống."}
    )

    # Các mốc thời gian bán vé
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)

    # Các mốc thời gian diễn ra sự kiện
    event_start_time = fields.DateTime(required=True)
    event_end_time = fields.DateTime(required=True)

    status = fields.Enum(
        EventStatus,
        by_value=True,
        error_messages={"invalid": "Trạng thái sự kiện không hợp lệ."}
    )

    # 2. Logic Validate nâng cao
    @validates_schema
    def validate_event_dates(self, data, **kwargs):
        # Lưu ý: data ở đây là dict chưa qua @post_load
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