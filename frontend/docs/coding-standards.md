# Quy chuẩn viết code (Frontend)

## JavaScript / JSX
- Sử dụng ES6+ (arrow functions, destructuring, spread).
- Viết component dạng function component (không dùng class component).
- Sử dụng naming convention chuẩn của React.

## Naming Convention
- `PascalCase` cho component names, file component.
- `camelCase` cho functions, variables.
- `UPPER_SNAKE_CASE` cho constants.

## Component
- Mỗi component đặt trong file riêng.
- Props được khai báo rõ ràng, sử dụng destructuring.
- Ưu tiên tách logic vào custom hooks khi cần tái sử dụng.

## Styling
- Sử dụng Tailwind CSS (utility classes).
- Tránh inline styles trừ trường hợp cần thiết.

## State & Data
- Gọi API chỉ trong `services/`.
- Quản lý state dùng React Context / hooks khi cần global.
- Xử lý lỗi và trạng thái loading cho các request.

## Import
- Import theo thứ tự: third-party → local.
- Sử dụng import chuẩn ESRM.
