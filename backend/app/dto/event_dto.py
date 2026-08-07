# schemas/event_schema.py
from marshmallow import fields, validate, validates_schema, ValidationError

from app.dto.base_dto import BaseAutoSchema
from app.dto.mixins_dto import DateRangeValidationMixin
from app.models import EventModel, EventStatus


class EventCreateSchema(BaseAutoSchema, DateRangeValidationMixin):
    class Meta(BaseAutoSchema.Meta):
        model = EventModel

    # Chỉ override đúng trường nào bạn thực sự muốn custom error message!
    name = fields.String(
        required=True,
        validate=validate.Length(min=5, max=100, error="Tên sự kiện phải từ 5 đến 100 ký tự.")
    )

    status = fields.Enum(
        EventStatus,
        by_value=True,
        error_messages={"invalid": "Trạng thái sự kiện không hợp lệ."}
    )
    
    # Nếu có 2 cặp ngày cần validate, chỉ cần gọi thêm logic kiểm tra phụ:
    @validates_schema
    def validate_event_dates(self, data, **kwargs):
        # Validate cặp event_start_time & event_end_time
        if data.get('event_end_time') and data.get('event_start_time'):
            if data['event_end_time'] <= data['event_start_time']:
                raise ValidationError(
                    "Thời gian kết thúc sự kiện phải sau khi bắt đầu.",
                    field_name="event_end_time"
                )