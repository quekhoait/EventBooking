# Danh sách công việc

## Chưa thực hiện
- (trống)

## Đang thực hiện
- (trống)

## Đã hoàn thành
- Tạo AGENTS.md
- Tạo thư mục docs/ với các file tài liệu nền tảng
- EventForm: chọn loại vé bằng select box từ API `/data/ticket-types`
- EventForm: gửi `event_seats` (event_ticket_type_id, seat_total, price) lên backend
- EventForm: bỏ trường rỗng khi gửi FormData (không gửi `""` cho int)
- EventForm: validate theo trạng thái backend (DRAFT chỉ cần name)
- EventForm: tách trạng thái khỏi select box, thêm nút theo API (Xuất bản / Hủy / Khôi phục / Xóa)
- eventService: thêm `publishEvent`, `cancelEvent`, `restoreEvent`
- Apis.jsx: thêm endpoints `publish_event`, `cancel_event`, `restore_event`
- EventManagementPage: nối các handler trạng thái theo API
- EventManagementPage: map `event_seats` → `ticketTypes` khi mở modal edit
- EventManagementPage: fetch chi tiết sự kiện (`GET /events/<id>`) khi bấm Sửa để hiển thị danh sách vé
