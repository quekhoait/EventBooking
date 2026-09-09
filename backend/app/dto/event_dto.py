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

    max_per_user = fields.Integer(
        allow_none=True,
        required=False,
        validate=validate.Range(min=1, error="Số vé tối đa mỗi người phải từ 1 trở lên."),
    )

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



class EventDraftSchema(BaseEventSchema):
    pass



class EventPublishSchema(BaseEventSchema):
    image = fields.Url(required=True, error_messages={"required": "Đường dẫn ảnh không được để trống."})
    location_id = fields.Integer(required=True, error_messages={"required": "ID địa điểm không được để trống."})
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



class TicketTypeResponseSchema(BaseSchema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()


class EventSeatResponseSchema(BaseSchema):
    id = fields.Integer()
    event_ticket_type_id = fields.Integer()
    seat_total = fields.Integer()
    price = fields.Float()
    is_available = fields.Boolean()
    # Nếu trong EventSeat Model có relationship ticket_type:
    ticket_type = fields.Nested(TicketTypeResponseSchema, dump_only=True)


class CompanyResponseSchema(BaseSchema):
    id = fields.Integer()
    name = fields.String()
    address = fields.String()
    description = fields.String()


class EventCategoryResponseSchema(BaseSchema):
    id = fields.Integer()
    name = fields.String()


class EventDetailResponseSchema(BaseSchema):
    id = fields.Integer()
    creator_id = fields.Integer()
    name = fields.String()
    image = fields.String()
    description = fields.String()
    status = fields.Enum(EventStatus, by_value=True)
    max_per_user = fields.Integer()

    # Thời gian
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    event_start_time = fields.DateTime()
    event_end_time = fields.DateTime()

    # Vị trí & Ban tổ chức
    location_id = fields.Integer()
    location_name = fields.String()
    company_id = fields.Integer()
    category_id = fields.Integer()

    # Relationship Data (Nút mở rộng chi tiết)
    company = fields.Nested(CompanyResponseSchema, dump_only=True)
    category = fields.Nested(EventCategoryResponseSchema, dump_only=True)
    event_seats = fields.Nested(EventSeatResponseSchema, many=True, dump_only=True, attribute="seats")


# =============================================================================
# 6. SCHEMA CẬP NHẬT SỰ KIỆN
# =============================================================================
class EventUpdateSchema(BaseEventSchema):
    # Các trường tên & status có thể không bắt buộc gửi lại nếu chỉ sửa nội dung khác
    name = fields.String(
        required=False,
        validate=validate.Length(min=5, max=100, error="Tên sự kiện phải từ 5 đến 100 ký tự.")
    )
    status = fields.Enum(EventStatus, by_value=True, required=False)

class EventFilterQuerySchema(BaseSchema):
    page = fields.Integer(load_default=1, validate=validate.Range(min=1, error="Trang phải lớn hơn 0."))
    page_size = fields.Integer(load_default=10, validate=validate.Range(min=1, max=100, error="Kích thước trang từ 1 đến 100."))
    keyword = fields.String(allow_none=True, load_default=None)
    category_id = fields.Integer(allow_none=True, load_default=None)
    company_id = fields.Integer(allow_none=True, load_default=None)
    location_id = fields.Integer(allow_none=True, load_default=None)
    # status = fields.Enum(EventStatus, by_value=True, allow_none=True, load_default=None)
    event_from_date = fields.DateTime(allow_none=True, load_default=None)
    event_to_date = fields.DateTime(allow_none=True, load_default=None)


class EventListResponseSchema(BaseSchema):
    id = fields.Integer()
    creator_id = fields.Integer()
    name = fields.String()
    image = fields.String()
    status = fields.Enum(EventStatus, by_value=True)
    event_start_time = fields.DateTime()
    event_end_time = fields.DateTime()
    location_name = fields.String()
    max_per_user = fields.Integer()
    # Chỉ lấy thông tin cơ bản, BỎ event_seats
    company = fields.Nested(CompanyResponseSchema, dump_only=True)
    category = fields.Nested(EventCategoryResponseSchema, dump_only=True)


class EventTicketTypeSchema(BaseSchema):
    id = fields.Integer()
    name = fields.String()
    description = fields.String()

class EventSeatDetailSchema(BaseSchema):
    id = fields.Integer()
    event_id = fields.Integer()
    price = fields.Float()
    event_ticket_type_id = fields.Integer()
    ticket_type = fields.Nested(EventTicketTypeSchema)
    
class ReportEventSchema(BaseSchema):
    user_id=fields.Integer()
    event_id=fields.Integer()
    name=fields.String()
    content=fields.String()

class ReportEventDetail(BaseSchema):
    pass

class ReportEventResponse(BaseSchema):
    user_id=fields.Integer()
    event_id=fields.Integer()
    name=fields.String()
    content=fields.String()
    event = fields.Nested(EventDetailResponseSchema, dump_only=True)