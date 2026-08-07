from sqlalchemy import text

from app import db, create_app
from app.models import LocationModel, EventCategory, Company  # Import thêm Company

# ----------------------------------------------------------------------
# 1. DỮ LIỆU MẪU (SEED DATA)
# ----------------------------------------------------------------------

LOCATIONS_DATA = [
    {
        "name": "Việt Nam",
        "children": [
            {
                "name": "Hà Nội",
                "children": [
                    {"name": "Quận Cầu Giấy"},
                    {"name": "Quận Hoàn Kiếm"},
                    {"name": "Quận Đống Đa"},
                    {"name": "Quận Hai Bà Trưng"},
                ]
            },
            {
                "name": "TP. Hồ Chí Minh",
                "children": [
                    {"name": "Quận 1"},
                    {"name": "Quận 3"},
                    {"name": "Quận Bình Thạnh"},
                    {"name": "TP. Thủ Đức"},
                ]
            },
            {
                "name": "Đà Nẵng",
                "children": [
                    {"name": "Quận Hải Châu"},
                    {"name": "Quận Thanh Khê"},
                    {"name": "Quận Sơn Trà"},
                ]
            }
        ]
    }
]

EVENT_CATEGORIES_DATA = [
    {"name": "Âm nhạc & Concert"},
    {"name": "Hội thảo & Workshop"},
    {"name": "Thể thao & Giải đấu"},
    {"name": "Sân khấu & Nghệ thuật"},
    {"name": "Triển lãm & Hội chợ"},
    {"name": "Công nghệ & Startup"},
    {"name": "Ẩm thực & Lễ hội"},
    {"name": "Networking & Giao lưu"},
]

COMPANIES_DATA = [
    {
        "name": "Công ty TNHH Giải trí & Sự kiện Sài Gòn Show",
        "address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
        "description": "Chuyên tổ chức các sự kiện âm nhạc, đại nhạc hội lớn toàn quốc.",
        "tax_code": "0312345678",
        "location_name": "Quận 1"  # Dùng để query lấy ID location
    },
    {
        "name": "Tập đoàn Công nghệ & Truyền thông Hà Nội Tech",
        "address": "45 Trần Thái Tông, Dịch Vọng, Quận Cầu Giấy",
        "description": "Đơn vị tiên phong tổ chức các hội thảo công nghệ và triển lãm IT.",
        "tax_code": "0109876543",
        "location_name": "Quận Cầu Giấy"
    },
    {
        "name": "Công ty Cổ phần Sự kiện & Du lịch Đà Nẵng Event",
        "address": "88 Bạch Đằng, Phường Thạch Thang, Quận Hải Châu",
        "description": "Đơn vị quản lý và vận hành các giải chạy bộ, sự kiện thể thao ngoài trời.",
        "tax_code": "0401122334",
        "location_name": "Quận Hải Châu"
    }
]


# ----------------------------------------------------------------------
# 2. HÀM DỌN DẸP VÀ SEED DATA
# ----------------------------------------------------------------------
def clear_data():
    """Xóa sạch dữ liệu và reset ID về 1 bằng TRUNCATE"""
    print("🧹 Đang dọn dẹp dữ liệu và reset ID về 1...")
    try:
        # 1. Tạm thời tắt kiểm tra khóa ngoại (Foreign Key Constraints)
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))

        # 2. Dùng TRUNCATE để xóa sạch data & reset ID auto increment
        db.session.execute(text("TRUNCATE TABLE company;"))
        db.session.execute(text("TRUNCATE TABLE event_category;"))
        db.session.execute(text("TRUNCATE TABLE location;"))
        # (Thêm các bảng khác vào đây nếu có: event, ticket...)

        # 3. Bật lại kiểm tra khóa ngoại
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))

        db.session.commit()
        print("✅ Dọn dẹp và reset ID thành công!")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Dọn dẹp dữ liệu thất bại: {e}")

def seed_locations():
    """Hàm nạp dữ liệu địa điểm mẫu vào Database."""
    print("🌱 Bắt đầu seed data cho Location...")

    def create_location_tree(data, parent_obj=None):
        location = LocationModel(
            name=data["name"],
            parent=parent_obj
        )
        db.session.add(location)

        for child_data in data.get("children", []):
            create_location_tree(child_data, parent_obj=location)

    try:
        for item in LOCATIONS_DATA:
            create_location_tree(item)

        db.session.commit()
        print("✅ Seed data Location thành công!")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seed data Location thất bại: {e}")


def seed_companies():
    """Hàm nạp dữ liệu Công ty và tự động map với Location ID."""
    print("🌱 Bắt đầu seed data cho Company...")

    try:
        for comp_data in COMPANIES_DATA:
            # Tìm location tương ứng theo name
            loc_name = comp_data.get("location_name")
            location = LocationModel.query.filter_by(name=loc_name).first()

            company = Company(
                name=comp_data["name"],
                address=comp_data["address"],
                description=comp_data["description"],
                tax_code=comp_data["tax_code"],
                location_id=location.id if location else None
            )
            db.session.add(company)

        db.session.commit()
        print("✅ Seed data Company thành công!")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seed data Company thất bại: {e}")


def seed_event_categories():
    """Hàm nạp dữ liệu danh mục sự kiện vào Database."""
    print("🌱 Bắt đầu seed data cho EventCategory...")

    try:
        for category_data in EVENT_CATEGORIES_DATA:
            category = EventCategory(name=category_data["name"])
            db.session.add(category)

        db.session.commit()
        print("✅ Seed data EventCategory thành công!")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seed data EventCategory thất bại: {e}")


# ----------------------------------------------------------------------
# 3. CHƯƠNG TRÌNH CHÍNH
# ----------------------------------------------------------------------

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        print("🚀 Bắt đầu quá trình Reset & Seed Data...")
        clear_data()              # Step 1: Xóa dữ liệu cũ
        seed_locations()          # Step 2: Seed Location trước
        seed_companies()          # Step 3: Seed Company (Cần Location ID)
        seed_event_categories()   # Step 4: Seed Event Category
        print("🎉 Hoàn tất quá trình nạp dữ liệu!")