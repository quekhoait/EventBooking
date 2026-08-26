import datetime
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import (
    LocationModel, Company, Notification,
    EventCategory, EventModel, EventStatus,
    EventTicketType, EventSeat, Seat,
    DiscountModel, TicketModel, TicketStatus,
    PaymentModel, PaymentStatus, PaymentType,
    User, RoleEnum
)

app = create_app()

def seed_data():
    with app.app_context():
        # 0. Tắt kiểm tra khóa ngoại để dọn dẹp dữ liệu
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 0;"))
        db.session.commit()

        print("Đang dọn dẹp dữ liệu cũ...")
        db.session.query(PaymentModel).delete()
        db.session.query(TicketModel).delete()
        db.session.query(DiscountModel).delete()
        db.session.query(Seat).delete()
        db.session.query(EventSeat).delete()
        db.session.query(EventModel).delete()
        db.session.query(EventTicketType).delete()
        db.session.query(EventCategory).delete()
        db.session.query(Notification).delete()
        db.session.query(User).delete()
        db.session.query(Company).delete()
        db.session.query(LocationModel).delete()
        db.session.commit()

        print("Đang nạp dữ liệu mới...")

        # 1. Location (Cây địa lý)
        vn = LocationModel(name="Việt Nam", parent_id=None)
        db.session.add(vn)
        db.session.flush()

        hanoi = LocationModel(name="Hà Nội", parent_id=vn.id)
        hcm = LocationModel(name="Hồ Chí Minh", parent_id=vn.id)
        db.session.add_all([hanoi, hcm])
        db.session.flush()

        cau_giay = LocationModel(name="Quận Cầu Giấy", parent_id=hanoi.id)
        quan_1 = LocationModel(name="Quận 1", parent_id=hcm.id)
        db.session.add_all([cau_giay, quan_1])
        db.session.flush()

        # 2. Company
        company_a = Company(
            name="Công ty Cổ phần Giải trí & Sự kiện SkyLine",
            address="123 Cầu Giấy, Hà Nội",
            description="Đơn vị tổ chức sự kiện âm nhạc và công nghệ hàng đầu.",
            tax_code="0109998888",
            location_id=cau_giay.id,
            is_active=True
        )
        db.session.add(company_a)
        db.session.flush()

        # 3. User (Hash mật khẩu thật để login được)
        default_password = generate_password_hash("123456")

        admin_user = User(
            username="admin",
            password=default_password,
            full_name="Quản Trị Viên",
            phone_number="0987654321",
            email="admin@skyline.vn",
            role=RoleEnum.ADMIN,
            is_active=True,
            is_verified=True,
            company_id=company_a.id
        )
        staff_user = User(
            username="staff_hung",
            password=default_password,
            full_name="Nguyễn Văn Hùng",
            phone_number="0912345678",
            email="hung.nv@skyline.vn",
            role=RoleEnum.STAFF,
            is_active=True,
            is_verified=True,
            company_id=company_a.id
        )
        customer_user = User(
            username="khachhang01",
            password=default_password,
            full_name="Trần Thị Lan",
            phone_number="0905123456",
            email="lan.tran@gmail.com",
            role=RoleEnum.USER,
            is_active=True,
            is_verified=True
        )
        db.session.add_all([admin_user, staff_user, customer_user])
        db.session.flush()

        # 4. Event Category
        cat_music = EventCategory(name="Âm nhạc & Hòa nhạc")
        cat_tech = EventCategory(name="Hội thảo Công nghệ")
        db.session.add_all([cat_music, cat_tech])
        db.session.flush()

        # 5. Event
        now = datetime.datetime.now()
        event_1 = EventModel(
            name="Đêm Nhạc Acoustic Mùa Thu 2026",
            image="https://example.com/images/acoustic-night.jpg",
            description="Đêm nhạc quy tụ các ca sĩ indie nổi tiếng cùng không gian ấm cúng.",
            max_per_user=4,
            start_time=now,
            end_time=now + datetime.timedelta(days=15),
            event_start_time=now + datetime.timedelta(days=20, hours=19),
            event_end_time=now + datetime.timedelta(days=20, hours=22),
            status=EventStatus.PUBLISHED,
            location_id=cau_giay.id,
            company_id=company_a.id,
            category_id=cat_music.id,
            location_name="Trung tâm Nghệ thuật Cầu Giấy, Hà Nội"
        )
        db.session.add(event_1)
        db.session.flush()

        # 6. Ticket Types & Quy định chỗ ngồi
        ticket_type_vip = EventTicketType(name="VIP", description="Ghế hàng đầu, kèm đồ uống miễn phí.")
        ticket_type_std = EventTicketType(name="Standard", description="Ghế ngồi khu vực trung tâm.")
        db.session.add_all([ticket_type_vip, ticket_type_std])
        db.session.flush()

        event_seat_vip = EventSeat(
            event_id=event_1.id,
            event_ticket_type_id=ticket_type_vip.id,
            seat_total=2,
            price=1500000.0
        )
        event_seat_std = EventSeat(
            event_id=event_1.id,
            event_ticket_type_id=ticket_type_std.id,
            seat_total=4,
            price=600000.0
        )
        db.session.add_all([event_seat_vip, event_seat_std])
        db.session.flush()

        # 7. Danh sách ghế thực tế (Seat)
        # Ghế VIP-01 đã được đặt nên is_active = False (hoặc True tùy quy ước của bạn)
        seat_v1 = Seat(seat_code="VIP-01", event_id=event_1.id, event_ticket_type_id=ticket_type_vip.id, is_active=False)
        seat_v2 = Seat(seat_code="VIP-02", event_id=event_1.id, event_ticket_type_id=ticket_type_vip.id, is_active=True)
        seat_s1 = Seat(seat_code="STD-01", event_id=event_1.id, event_ticket_type_id=ticket_type_std.id, is_active=True)
        seat_s2 = Seat(seat_code="STD-02", event_id=event_1.id, event_ticket_type_id=ticket_type_std.id, is_active=True)
        db.session.add_all([seat_v1, seat_v2, seat_s1, seat_s2])
        db.session.flush()

        # 8. Mã giảm giá (Discount)
        discount_code = DiscountModel(
            code="EARLYBIRD20",
            value=20.0,
            unit="percentage",
            start_time=now,
            end_time=now + datetime.timedelta(days=7),
            event_id=event_1.id
        )
        db.session.add(discount_code)
        db.session.flush()

        # 9. Vé & Giao dịch thanh toán
        ticket_1 = TicketModel(
            code="TCK00001",
            user_id=customer_user.id,
            seat_id=seat_v1.id,
            price=1200000.0,
            discount_id=discount_code.id,
            status=TicketStatus.SUCCESS
        )
        db.session.add(ticket_1)
        db.session.flush()

        payment_1 = PaymentModel(
            code="PAY000000001",
            ticket_code=ticket_1.code,
            payment_method="MOMO",
            transaction_id="TXN_20260825_001",
            amount=1200000.0,
            pay_url="https://test-payment.momo.vn/pay/example",
            expired_time=now + datetime.timedelta(minutes=15),
            status=PaymentStatus.SUCCESS,
            type=PaymentType.PAYMENT
        )
        db.session.add(payment_1)

        # 10. Thông báo (Notification)
        noti = Notification(
            user_id=customer_user.id,
            title="Đặt vé thành công",
            content=f"Bạn đã thanh toán thành công vé {ticket_1.code} cho sự kiện '{event_1.name}'.",
            is_read=False
        )
        db.session.add(noti)

        # 11. Bật lại kiểm tra khóa ngoại và commit toàn bộ
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.session.commit()

        print("Đã tạo xong dữ liệu mẫu thành công!")

if __name__ == "__main__":
    seed_data()