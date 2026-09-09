# Danh sách công việc

## Chưa thực hiện
- [ ] Thiết lập database connection
- [ ] Tạo model cơ bản
- [ ] Xây dựng API endpoints

## Đang thực hiện
- (trống)

## Đã hoàn thành
- Tạo AGENTS.md
- Tạo thư mục docs/ với các file tài liệu nền tảng
- Tạo docs/reference-data-api.md - tài liệu API reference data controller
- Tạo docs/event-api.md - tài liệu API event controller
- Event create/update chuyển sang nhận formData, ảnh upload Cloudinary (helper `upload_image_file` trong `app/utils/validation.py`)
- Bổ sung `max_per_user` vào `BaseEventSchema` (kế thừa cho tạo/sửa) + sửa backtick lỗi ở `EventListResponseSchema`
- `cancel_event`: chặn hủy sự kiện đã `CANCELLED` (trả `EVENT_ALREADY_CANCELLED`) để tránh hoàn tiền trùng qua signal
- `cancel_event`: chỉ cho phép hủy sự kiện `PUBLISHED` (thêm `EVENT_CANCEL_NOT_ALLOWED`)
