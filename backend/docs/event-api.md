**# Event Controller API**

## Tổng quan
Controller quản lý sự kiện bao gồm: tạo sự kiện (nháp/xuất bản), xem chi tiết, cập nhật, xóa (soft delete), hủy/khôi phục/xuất bản, lọc tìm kiếm và danh sách vé.

**Base URL:** `/api/events`

---

## Trạng thái sự kiện (EventStatus)

| Giá trị | Mô tả |
|---------|-------|
| `DRAFT` | Bản nháp, chưa công khai |
| `PUBLISHED` | Đã xuất bản, hiển thị công khai |
| `CANCELLED` | Sự kiện đã bị hủy |

---

## 1. Tạo sự kiện

### POST `/api/events`
Tạo mới sự kiện. Nếu `status = PUBLISHED` sẽ tạo và xuất bản ngay; ngược lại (mặc định) lưu dưới dạng nháp.

**Ghi chú hiện tại:** Cần token JWT (`@jwt_required`) nhưng hiện đang tạm bỏ, `creator_id` được fix cứng = `1`.

**Content-Type:** `multipart/form-data` (hỗ trợ cả `application/json` với ảnh dạng URL).

**Request FormData:**
```
name=Concert Hà Nội 2026
status=PUBLISHED
description=Mô tả sự kiện
image=<file ảnh>
location_id=1
company_id=1
category_id=1
start_time=2026-01-01T08:00:00
end_time=2026-01-10T23:59:59
event_start_time=2026-01-15T19:00:00
event_end_time=2026-01-15T22:00:00
event_seats=[{"event_ticket_type_id":1,"seat_total":100,"price":500000},{"event_ticket_type_id":2,"seat_total":50,"price":1000000}]
```

**Các trường multipart/form-data:**

| Trường | Type | Required (PUBLISHED) | Required (DRAFT) | Ràng buộc |
|--------|------|------|------|-----------|
| `name` | text | ✅ | ✅ | 5-100 ký tự |
| `status` | text | ✅ | ✅ | `DRAFT`/`PUBLISHED`/`CANCELLED` |
| `description` | text | ❌ | ❌ | — |
| `image` | file | ✅ | ❌ | File ảnh, tự động upload lên Cloudinary (folder `events/images`), lưu `secure_url` |
| `location_id` | text(int) | ✅ | ❌ | — |
| `company_id` | text(int) | ✅ | ❌ | — |
| `category_id` | text(int) | ✅ | ❌ | — |
| `start_time` | text(datetime) | ✅ | ❌ | Thời gian mở bán vé |
| `end_time` | text(datetime) | ✅ | ❌ | Thời gian kết thúc bán vé, phải sau `start_time` |
| `event_start_time` | text(datetime) | ✅ | ❌ | Thời gian bắt đầu sự kiện, phải sau `start_time` |
| `event_end_time` | text(datetime) | ✅ | ❌ | Thời gian kết thúc, phải sau `event_start_time` và `end_time` |
| `event_seats` | text(JSON string) | ✅ (min 1) | ❌ | Chuỗi JSON của mảng: mỗi phần tử `event_ticket_type_id`, `seat_total ≥ 1`, `price ≥ 0` |
| `max_per_user` | text(int) | ❌ | ❌ | Số vé tối đa mỗi người (mặc định 5), phải ≥ 1 |

> Nếu gửi theo `application/json`: cấu trúc giữ nguyên như trước, `image` là URL ảnh có sẵn (không upload).

**Các lỗi nghiệp vụ khi xuất bản:**
- `LOCATION_NOT_FOUND` / `COMPANY_NOT_FOUND` / `CATEGORY_NOT_FOUND`
- `EVENT_START_TIME_IN_PAST` - thời gian bắt đầu sự kiện trong quá khứ
- `TICKET_SALE_AFTER_EVENT_START` - mở bán sau khi sự kiện bắt đầu
- `TICKET_SALE_END_INVALID` - kết thúc bán vé sau khi sự kiện kết thúc
- `EVENT_NAME_EXISTS` - trùng tên + công ty + thời gian
- `EVENT_MUST_HAVE_SEATS` - thiếu danh sách vé

**Response (201):**
```json
{
  "status": "SUCCESS",
  "message": "Xuất bản sự kiện thành công",
  "data": { "id": 1 },
  "status_code": 201
}
```

---

## 2. Chi tiết sự kiện

### GET `/api/events/<event_id>`
Lấy thông tin chi tiết sự kiện.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy thông tin chi tiết sự kiện thành công",
  "data": {
    "id": 1,
    "creator_id": 1,
    "name": "Concert Hà Nội 2026",
    "image": "https://example.com/event.jpg",
    "description": "Mô tả",
    "status": "PUBLISHED",
    "start_time": "2026-01-01T08:00:00",
    "end_time": "2026-01-10T23:59:59",
    "event_start_time": "2026-01-15T19:00:00",
    "event_end_time": "2026-01-15T22:00:00",
    "location_id": 1,
    "location_name": "Thành phố Hà Nội",
    "company_id": 1,
    "category_id": 1,
    "company": {
      "id": 1,
      "name": "Công ty ABC",
      "address": "123 Đường XYZ",
      "description": "Mô tả"
    },
    "category": { "id": 1, "name": "Âm nhạc" },
    "event_seats": [
      {
        "id": 1,
        "event_ticket_type_id": 1,
        "seat_total": 100,
        "price": 500000,
        "is_available": true,
        "ticket_type": { "id": 1, "name": "VIP", "description": "Hàng ghế VIP" }
      }
    ]
  },
  "status_code": 200
}
```

---

## 3. Cập nhật sự kiện

### PATCH `/api/events/<event_id>`
Cập nhật từng phần thông tin sự kiện. Nếu truyền `event_seats` sẽ **xóa toàn bộ ghế cũ và thay thế** bằng danh sách mới.

**Content-Type:** `multipart/form-data` (hỗ trợ cả `application/json` với ảnh dạng URL).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Request FormData (chỉ gửi các trường cần sửa):**
> Lưu ý: Dựa trên `EventUpdateSchema`, `name` và `status` là KHÔNG bắt buộc ở endpoint này (khác với schema cha).

```
name=Concert Hà Nội 2026 - Updated
description=Mô tả mới
location_id=2
image=<file ảnh mới>   (tùy chọn, upload Cloudinary)
event_seats=[{"event_ticket_type_id":1,"seat_total":200,"price":600000}]
```

| Trường | Type | Mô tả |
|--------|------|-------|
| bất kỳ field nào | text | Giống bảng ở phần tạo (chấp nhận cả không bắt buộc) |
| `image` | file | File ảnh mới → upload Cloudinary; hoặc URL string → giữ nguyên |

**Nghiệp vụ:** Nếu đổi `location_id`, tự động cập nhật `location_name`.

**Response:** Cấu trúc giống GET chi tiết sự kiện, `status_code = 200`.

---

## 4. Danh sách sự kiện (Load More)

### GET `/api/events`
Lấy danh sách sự kiện **đã xuất bản** với phân trang dạng load-more (chỉ lấy `PUBLISHED`).

**Query Parameters:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | int | 1 | Trang hiện tại (≥ 1) |
| `page_size` | int | 10 | Số bản ghi/trang (1-100) |
| `keyword` | string | null | Tìm kiếm theo tên |
| `category_id` | int | null | Lọc theo danh mục |
| `company_id` | int | null | Lọc theo công ty |
| `location_id` | int | null | Lọc theo địa điểm |
| `event_from_date` | datetime | null | Lọc từ ngày |
| `event_to_date` | datetime | null | Lọc đến ngày |

**Ví dụ:** `/api/events?page=1&page_size=10&keyword=concert&category_id=2`

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách sự kiện thành công",
  "data": {
    "items": [
      {
        "id": 1,
        "creator_id": 1,
        "name": "Concert Hà Nội 2026",
        "image": "https://example.com/event.jpg",
        "status": "PUBLISHED",
        "event_start_time": "2026-01-15T19:00:00",
        "event_end_time": "2026-01-15T22:00:00",
        "location_name": "Thành phố Hà Nội",
        "max_per_user": 5,
        "company": { "id": 1, "name": "Công ty ABC", "address": "...", "description": "..." },
        "category": { "id": 1, "name": "Âm nhạc" }
      }
    ],
    "page": 1,
    "page_size": 10,
    "has_next": false
  },
  "status_code": 200
}
```

---

## 5. Sự kiện theo người tạo

### GET `/api/events/creator/<creator_id>`
Lấy toàn bộ sự kiện do một người tạo (không phân trang, không giới hạn trạng thái).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `creator_id` | int | ID người tạo |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách sự kiện theo người tạo thành công",
  "data": [ "<cấu trúc item giống danh sách ở mục 4>" ],
  "status_code": 200
}
```

---

## 6. Xóa sự kiện

### DELETE `/api/events/<event_id>`
Xóa mềm sự kiện. **Không cho xóa sự kiện đã `PUBLISHED`** (lỗi `EVENT_CANNOT_DELETE_PUBLISHED`).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Xóa sự kiện thành công.",
  "data": null,
  "status_code": 204
}
```

---

## 7. Hủy sự kiện

### PATCH `/api/events/<event_id>/cancel`
Chuyển trạng thái sự kiện sang `CANCELLED`. Phát signal `event_cancelled_signal` (dùng cho các nghiệp vụ liên quan như hoàn tiền).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Response:** Cấu trúc giống GET chi tiết, `status_code = 200`.

---

## 8. Khôi phục sự kiện

### PATCH `/api/events/<event_id>/restore`
Khôi phục sự kiện đã bị xóa mềm (soft delete).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện đã xóa |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Khôi phục sự kiện thành công.",
  "data": null,
  "status_code": 200
}
```

---

## 9. Xuất bản sự kiện

### PATCH `/api/events/<event_id>/publish`
Xuất bản sự kiện đang ở trạng thái `DRAFT`. Áp dụng toàn bộ ràng buộc xuất bản (location/company/category tồn tại, thời gian hợp lệ, có ít nhất 1 vé).

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Lỗi nghiệp vụ:**
- Sự kiện đã `PUBLISHED` → không thể xuất bản lại
- Sự kiện `CANCELLED` → không thể xuất bản
- Không có vé → `EVENT_MUST_HAVE_SEATS`

**Response:** Cấu trúc giống GET chi tiết, `status_code = 200`.

---

## 10. Danh sách vé của sự kiện

### GET `/api/events/<event_id>/tickets`
Lấy danh sách loại vé kèm giá của một sự kiện.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `event_id` | int | ID sự kiện |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy loại vé thành công!",
  "data": [
    {
      "id": 1,
      "event_id": 1,
      "price": 500000,
      "event_ticket_type_id": 1,
      "ticket_type": { "id": 1, "name": "VIP", "description": "Hàng ghế VIP" }
    }
  ],
  "status_code": 200
}
```

---

## Cấu trúc Response Chung

Mọi API đều trả về cấu trúc:
```json
{
  "status": "SUCCESS" | "ERROR",
  "message": "Mô tả kết quả",
  "data": {} | [] | null,
  "status_code": 200 | 201 | 204 | 400 | 404
}
```

## Mã lỗi phổ biến
| Status Code | Mô tả |
|-------------|-------|
| 200 | Thành công |
| 201 | Tạo thành công |
| 204 | Xóa thành công (không có data) |
| 400 | Dữ liệu đầu vào không hợp lệ / lỗi nghiệp vụ |
| 404 | Không tìm thấy tài nguyên |

## Giới hạn & Lưu ý hiện tại
- Endpoint tạo sự kiện đang để `creator_id` cố định = `1`, chưa lấy từ token JWT.
- Ảnh trong `POST/PATCH /events` nhận từ `multipart/form-data`, tự upload lên Cloudinary (folder `events/images`, cơ chế `upload_image_file` trong `app/utils/validation.py`) và lưu `secure_url`.