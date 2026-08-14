from marshmallow import validates_schema, ValidationError


class DateRangeValidationMixin:
    """Mixin tự động kiểm tra cặp thời gian start/end"""

    start_field = 'start_time'
    end_field = 'end_time'

    @validates_schema
    def validate_date_range(self, data, **kwargs):
        start = data.get(self.start_field)
        end = data.get(self.end_field)

        if start and end and end <= start:
            raise ValidationError(
                f"Thời gian kết thúc ({self.end_field}) phải sau thời gian bắt đầu ({self.start_field}).",
                field_name=self.end_field
            )