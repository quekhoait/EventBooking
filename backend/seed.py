from datetime import datetime, timedelta
from sqlalchemy import text

from app import db, create_app
from app.models import (
    User, RoleEnum, Company, LocationModel, EventCategory,
    EventModel, EventStatus, EventTicketType, EventSeat,
    Seat, DiscountModel
)

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
        "location_name": "Quận 1"
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
# 2. HÀM DỌN DẸP BẢNG & MẤY TRUNCATE
# ----------------------------------------------------------------------

def clear_data():
    """Xóa sạch toàn bộ dữ liệu tất cả các bảng và reset ID về 1."""
    print("🧹 Đang dọn dẹp dữ liệu và reset ID các bảng...")
    try:
        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))

        # Danh sách các bảng cần truncate (bao gồm cả bảng ở file seed 2)
        tables = [
            "seat",
            "event_seat",
            "event_ticket_type",
            "discount",
            "event",
            "company",
            "event_category",
            "location",
            "user" # Thay tên bảng user thực tế trong DB của bạn nếu khác (ví dụ: user / users)
        ]

        for table in tables:
            db.session.execute(text(f"TRUNCATE TABLE `{table}`;"))

        db.session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()
        print("✅ Dọn dẹp và reset ID tất cả các bảng thành công!")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Dọn dẹp dữ liệu thất bại: {e}")


# ----------------------------------------------------------------------
# 3. CÁC HÀM SEED DỮ LIỆU
# ----------------------------------------------------------------------

def seed_locations():
    """Seed danh mục Địa điểm dạng cây."""
    print("🌱 Bắt đầu seed data cho Location...")

    def create_location_tree(data, parent_obj=None):
        location = LocationModel(name=data["name"], parent=parent_obj)
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


def seed_event_categories():
    """Seed Danh mục sự kiện."""
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


def seed_companies():
    """Seed Công ty và tự động map với Location ID đã nạp."""
    print("🌱 Bắt đầu seed data cho Company...")
    try:
        for comp_data in COMPANIES_DATA:
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


def seed_users():
    """Seed tài khoản người dùng mẫu."""
    print("🌱 Bắt đầu seed data cho User...")
    try:
        user = User(
            username="testuser",
            email="testuser@gmail.com",
            password="123456.",  # Hoặc pass_hash nếu dự án dùng Werkzeug/Bcrypt
            full_name="Nguyễn Văn A",
            phone_number="0987654321",
            role=RoleEnum.USER,
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        print(f"✅ Tạo User thành công (ID: {user.id})")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seed data User thất bại: {e}")


def seed_events_and_details():
    """Seed Sự kiện, Loại vé, Cấu hình giá, Ghế và Mã giảm giá."""
    print("🌱 Bắt đầu seed Sự kiện, Vé, Ghế và Discount...")
    try:
        # Lấy thông tin phụ thuộc đã được seed trước đó
        location = LocationModel.query.filter(LocationModel.parent_id.isnot(None)).first()
        company = Company.query.first()
        category = EventCategory.query.first()

        # 1. Tạo Sự kiện mẫu (EventModel)
        event = EventModel(
            name="Concert Âm Nhạc Mùa Hè 2026",
            description="Đêm nhạc quy tụ dàn ca sĩ hot nhất",
            max_per_user=5,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(days=30),
            event_start_time=datetime.now() + timedelta(days=10),
            event_end_time=datetime.now() + timedelta(days=10, hours=4),
            status=EventStatus.PUBLISHED,
            location_id=location.id if location else None,
            company_id=company.id if company else None,
            category_id=category.id if category else None
        )
        db.session.add(event)
        db.session.flush()

        # 2. Tạo Loại vé (EventTicketType)
        ticket_type_vip = EventTicketType(name="Vé VIP", description="Hàng ghế sát sân khấu")
        ticket_type_std = EventTicketType(name="Vé Thường", description="Hàng ghế tiêu chuẩn")
        db.session.add_all([ticket_type_vip, ticket_type_std])
        db.session.flush()

        # 3. Tạo Cấu hình giá (EventSeat)
        event_seat_vip = EventSeat(
            event_id=event.id,
            event_ticket_type_id=ticket_type_vip.id,
            seat_total="10",
            price=500000.0,
            is_available=True
        )
        event_seat_std = EventSeat(
            event_id=event.id,
            event_ticket_type_id=ticket_type_std.id,
            seat_total="20",
            price=200000.0,
            is_available=True
        )
        db.session.add_all([event_seat_vip, event_seat_std])

        # 4. Sinh danh sách Ghế thực tế (Seat)
        for i in range(1, 6):
            db.session.add(Seat(
                seat_code=f"VIP-{i:02d}",
                is_active=True,
                event_id=event.id,
                event_ticket_type_id=ticket_type_vip.id
            ))
        for i in range(1, 11):
            db.session.add(Seat(
                seat_code=f"STD-{i:02d}",
                is_active=True,
                event_id=event.id,
                event_ticket_type_id=ticket_type_std.id
            ))

        # 5. Tạo Mã giảm giá (DiscountModel)
        discount = DiscountModel(
            code="HE2026",
            value=20.0,
            unit="%",
            start_time=datetime.now() - timedelta(days=1),
            end_time=datetime.now() + timedelta(days=30),
            event_id=event.id
        )
        db.session.add(discount)

        db.session.commit()

        # In thông số cho Postman
        print("\n🎉 ĐÃ TẠO XONG TOÀN BỘ DỮ LIỆU MẪU!")
        print("\n--- BỘ THÔNG SỐ TEST POSTMAN ---")
        print(f"• event_id      : {event.id}")
        print(f"• seat_type_id  : {ticket_type_vip.id} (Vé VIP - 500k)")
        print(f"• seat_type_id  : {ticket_type_std.id} (Vé Thường - 200k)")
        print(f"• discount_id   : {discount.id}")
        print("---------------------------------\n")

    except Exception as e:
        db.session.rollback()
        print(f"❌ Seed dữ liệu Sự kiện thất bại: {e}")


# ----------------------------------------------------------------------
# 4. CHƯƠNG TRÌNH CHÍNH
# ----------------------------------------------------------------------

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        print("🚀 Bắt đầu quá trình Reset & Seed Data...")
        clear_data()               # Step 1: Xóa toàn bộ bảng & reset ID
        seed_locations()           # Step 2: Seed Cây địa điểm
        seed_event_categories()    # Step 3: Seed Danh mục
        seed_companies()           # Step 4: Seed Công ty (Cần Location)
        seed_users()               # Step 5: Seed User
        seed_events_and_details()  # Step 6: Seed Event, TicketType, Seat, Discount
        print("✨ Hoàn tất toàn bộ quy trình!")