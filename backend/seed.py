from datetime import datetime, timedelta
from app import create_app, db
# Import đúng tên các Class theo file Model của bạn
from app.models import (
    User, RoleEnum, Company, LocationModel, EventCategory,
    EventModel, EventStatus, EventTicketType, EventSeat,
    Seat, DiscountModel
)

app = create_app()

def seed_database():
    with app.app_context():
        print("🌱 Bắt đầu tạo dữ liệu mẫu...")

        # 1. Tạo User mẫu
        user = User.query.filter_by(username="testuser").first()
        if not user:
            user = User(
                username="testuser",
                email="testuser@gmail.com",
                password="123456.", # Hoặc chuỗi password đã hash của bạn
                full_name="Nguyễn Văn A",
                phone_number="0987654321",
                role=RoleEnum.USER,
                is_active=True
            )
            db.session.add(user)
            db.session.flush()
            print(f"✅ Tạo User thành công (ID: {user.id})")

        # 2. Tạo Địa điểm (LocationModel)
        location = LocationModel.query.first()
        if not location:
            location = LocationModel(name="Sân vận động Mỹ Đình")
            db.session.add(location)
            db.session.flush()

        # 3. Tạo Công ty (Company)
        company = Company.query.first()
        if not company:
            company = Company(
                name="Công ty TNHH Âm Nhạc Việt",
                address="123 Nguyễn Huệ, Q.1, TP.HCM",
                tax_code="0101234567"
            )
            db.session.add(company)
            db.session.flush()

        # 4. Tạo Danh mục sự kiện (EventCategory)
        category = EventCategory.query.first()
        if not category:
            category = EventCategory(name="Âm Nhạc & Concert")
            db.session.add(category)
            db.session.flush()

        # 5. Tạo Sự kiện mẫu (EventModel)
        event = EventModel.query.first()
        if not event:
            event = EventModel(
                name="Concert Âm Nhạc Mùa Hè 2026",
                description="Đêm nhạc quy tụ dàn ca sĩ hot nhất",
                max_per_user=5,
                start_time=datetime.now(),
                end_time=datetime.now() + timedelta(days=30),
                event_start_time=datetime.now() + timedelta(days=10),
                event_end_time=datetime.now() + timedelta(days=10, hours=4),
                status=EventStatus.PUBLISHED,
                is_chat_enabled=True,
                location_id=location.id,
                company_id=company.id,
                category_id=category.id
            )
            db.session.add(event)
            db.session.flush()
            print(f"✅ Tạo Event thành công (ID: {event.id})")

        # 6. Tạo Loại vé (EventTicketType)
        ticket_type_vip = EventTicketType.query.filter_by(name="Vé VIP").first()
        if not ticket_type_vip:
            ticket_type_vip = EventTicketType(name="Vé VIP", description="Hàng ghế sát sân khấu")
            db.session.add(ticket_type_vip)

        ticket_type_std = EventTicketType.query.filter_by(name="Vé Thường").first()
        if not ticket_type_std:
            ticket_type_std = EventTicketType(name="Vé Thường", description="Hàng ghế tiêu chuẩn")
            db.session.add(ticket_type_std)

        db.session.flush()

        # 7. Tạo Cấu hình giá (EventSeat)
        event_seat_vip = EventSeat.query.filter_by(event_id=event.id, event_ticket_type_id=ticket_type_vip.id).first()
        if not event_seat_vip:
            event_seat_vip = EventSeat(
                event_id=event.id,
                event_ticket_type_id=ticket_type_vip.id,
                seat_total="10",
                price=500000.0,
                is_available=True
            )
            db.session.add(event_seat_vip)

        event_seat_std = EventSeat.query.filter_by(event_id=event.id, event_ticket_type_id=ticket_type_std.id).first()
        if not event_seat_std:
            event_seat_std = EventSeat(
                event_id=event.id,
                event_ticket_type_id=ticket_type_std.id,
                seat_total="20",
                price=200000.0,
                is_available=True
            )
            db.session.add(event_seat_std)

        # 8. Sinh danh sách Ghế thực tế (Seat)
        if Seat.query.filter_by(event_id=event.id).count() == 0:
            # Tạo 5 ghế VIP
            for i in range(1, 6):
                db.session.add(Seat(
                    seat_code=f"VIP-{i:02d}",
                    is_active=True,
                    event_id=event.id,
                    event_ticket_type_id=ticket_type_vip.id
                ))
            # Tạo 10 ghế Thường
            for i in range(1, 11):
                db.session.add(Seat(
                    seat_code=f"STD-{i:02d}",
                    is_active=True,
                    event_id=event.id,
                    event_ticket_type_id=ticket_type_std.id
                ))
            print("✅ Sinh danh sách Ghế thành công (5 ghế VIP, 10 ghế Thường)")

        # 9. Tạo Mã giảm giá (DiscountModel)
        discount = DiscountModel.query.filter_by(code="HE2026").first()
        if not discount:
            discount = DiscountModel(
                code="HE2026",
                value=20.0, # Giảm 20%
                unit="%",
                start_time=datetime.now() - timedelta(days=1),
                end_time=datetime.now() + timedelta(days=30),
                event_id=event.id  # Bắt buộc theo DiscountModel
            )
            db.session.add(discount)
            db.session.flush()
            print(f"✅ Tạo Mã giảm giá thành công (ID: {discount.id}, Code: HE2026)")

        db.session.commit()
        print("\n🎉 ĐÃ TẠO XONG TOÀN BỘ DỮ LIỆU MẪU!")

        # In ra các ID chính xác để dùng trên Postman
        print("\n--- BỘ THÔNG SỐ TEST POSTMAN ---")
        print(f"• event_id      : {event.id}")
        print(f"• seat_type_id  : {ticket_type_vip.id} (Vé VIP - 500k)")
        print(f"• seat_type_id  : {ticket_type_std.id} (Vé Thường - 200k)")
        print(f"• discount_id   : {discount.id}")
        print("---------------------------------\n")

if __name__ == "__main__":
    seed_database()