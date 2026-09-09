# Kiến trúc dự án (Frontend)

## Tổng quan
- Frontend: React 19 + Vite 8
- Ngôn ngữ: JavaScript (JSX), Tailwind CSS
- Routing: React Router v7
- HTTP Client: Axios
- Build tool: Vite, ESLint

## Cấu trúc thư mục
```
frontend/
├── AGENTS.md
├── docs/
│   ├── architecture.md
│   ├── coding-standards.md
│   └── tasks.md
└── app/
    ├── src/
    │   ├── components/   # Component dùng chung
    │   ├── config/       # Cấu hình
    │   ├── context/      # React Context
    │   ├── hooks/        # Custom hooks
    │   ├── layouts/      # Layout tổng thể
    │   ├── pages/        # Trang/route chính
    │   ├── routes/       # Cấu hình router
    │   ├── services/     # Gọi API (Axios)
    │   └── utils/        # Hàm tiện ích
    ├── public/           # Tài nguyên tĩnh
    ├── package.json
    └── vite.config.js
```

## Nguyên tắc kiến trúc
- Tách biệt giữa `pages` (hiển thị), `components` (tái sử dụng), `services` (gọi API) và `context/hooks` (quản lý state).
- Phân chia theo module/feature khi phát triển mở rộng.
- Kết nối backend qua `services/` sử dụng Axios.
