# Reference Data Controller API

## Tổng quan
Controller quản lý dữ liệu tham chiếu (reference data) bao gồm: loại vé, danh mục, địa điểm, sở thích người dùng và thông tin doanh nghiệp.

**Base URL:** `/data`

---

## 1. Loại vé (Ticket Types)

### GET `/data/ticket-types`
Lấy danh sách tất cả các loại vé.

**Tham số:** Không có

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách loại vé thành công",
  "data": [
    {
      "id": 1,
      "name": "VIP",
      "description": "Hàng ghế VIP"
    }
  ],
  "status_code": 200
}
```

---

## 2. Danh mục (Categories)

### GET `/data/categories`
Lấy danh sách tất cả các danh mục sự kiện.

**Tham số:** Không có

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách danh mục thành công",
  "data": [
    {
      "id": 1,
      "name": "Âm nhạc",
      "image": "https://example.com/image.jpg"
    }
  ],
  "status_code": 200
}
```

---

## 3. Địa điểm (Locations)

### GET `/data/locations`
Lấy danh sách địa điểm dạng danh sách phẳng.

**Tham số:** Không có

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách địa điểm thành công",
  "data": [
    {
      "id": 1,
      "name": "Hà Nội",
      "full_name": "Thành phố Hà Nội",
      "parent_id": null,
      "children": [...]
    }
  ],
  "status_code": 200
}
```

### GET `/data/locations/tree`
Lấy cây địa điểm đầy đủ (đệ quy).

**Tham số:** Không có

**Response:** Cấu trúc cây lồng nhau

### GET `/data/locations/<location_id>`
Lấy thông tin chi tiết một địa điểm.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `location_id` | int | ID địa điểm |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy thông tin địa điểm thành công",
  "data": {
    "id": 1,
    "name": "Hà Nội",
    "full_name": "Thành phố Hà Nội",
    "parent_id": null,
    "children": [
      { "id": 2, "name": "Ba Đình", "full_name": "Quận Ba Đình" }
    ]
  },
  "status_code": 200
}
```

**Lỗi:** `LOCATION_NOT_FOUND` nếu không tìm thấy

---

## 4. Sở thích người dùng (User Preferences)

### GET `/data/preferences`
Lấy danh sách thể loại yêu thích của user.

**Query Parameters:**
| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `user_id` | int | Có | ID người dùng |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy danh sách sở thích thành công",
  "data": [
    { "category_id": 1, "name": "Âm nhạc" }
  ],
  "status_code": 200
}
```

### POST/PUT `/data/preferences`
Cập nhật toàn bộ danh sách sở thích (ghi đè).

**Request Body:**
```json
{
  "user_id": 1,
  "category_ids": [1, 2, 5]
}
```
> Hỗ trợ cả `category_ids` hoặc `categories`

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Cập nhật danh sách sở thích thành công",
  "data": [...],
  "status_code": 200
}
```

### POST `/data/preferences/add`
Thêm bổ sung thể loại vào danh sách hiện tại (không ghi đè).

**Request Body:**
```json
{
  "user_id": 1,
  "category_ids": [3, 4]
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Thêm sở thích thành công",
  "data": [...],
  "status_code": 200
}
```

### DELETE `/data/preferences/<category_id>`
Xóa một thể loại cụ thể khỏi sở thích.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `category_id` | int | ID danh mục cần xóa |

**Query Parameters:**
| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `user_id` | int | Có | ID người dùng |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Xóa sở thích thành công",
  "data": null,
  "status_code": 200
}
```

### DELETE `/data/preferences`
Xóa toàn bộ sở thích của user.

**Request Body hoặc Query:**
```json
{ "user_id": 1 }
```
hoặc `?user_id=1`

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Đã xóa toàn bộ danh sách sở thích",
  "data": null,
  "status_code": 200
}
```

---

## 5. Doanh nghiệp (Company)

### GET `/data/company/<company_id>`
Lấy thông tin doanh nghiệp theo ID.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `company_id` | int | ID doanh nghiệp |

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lấy thông tin công ty thành công",
  "data": {
    "id": 1,
    "name": "Công ty ABC",
    "address": "123 Đường XYZ",
    "description": "Mô tả công ty",
    "tax_code": "0123456789",
    "location_id": 1,
    "is_active": true
  },
  "status_code": 200
}
```

### GET `/data/company/user/<user_id>`
Lấy thông tin doanh nghiệp theo user ID.

**Path Parameters:**
| Param | Type | Mô tả |
|-------|------|-------|
| `user_id` | int | ID người dùng |

**Response:** Tương tự GET company theo ID, trả `null` nếu không có.

### POST `/data/company`
Tạo mới hoặc cập nhật thông tin doanh nghiệp.

**Request Body:**
```json
{
  "user_id": 1,
  "name": "Công ty ABC",
  "address": "123 Đường XYZ",
  "description": "Mô tả công ty",
  "tax_code": "0123456789",
  "location_id": 1
}
```

**Response:**
```json
{
  "status": "SUCCESS",
  "message": "Lưu hồ sơ doanh nghiệp thành công",
  "data": { ... },
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
  "status_code": 200 | 400 | 404
}
```

## Mã lỗi phổ biến
| Status Code | Mô tả |
|-------------|-------|
| 200 | Thành công |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 404 | Không tìm thấy tài nguyên |
