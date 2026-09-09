# Kiến trúc dự án

## Tổng quan
- Backend: Flask
- Frontend: (cập nhật khi có)
- Database: (cập nhật khi có)

## Cấu trúc thư mục
```
backend/
├── AGENTS.md
├── docs/
│   ├── architecture.md
│   ├── coding-standards.md
│   └── tasks.md
├── app/
│   ├── __init__.py
│   └── ...
├── requirements.txt
└── run.py
```

## Nguyên tắc kiến trúc
- Tách biệt route, service, và repository layer.
- Sử dụng Blueprint để组织 code theo module.
