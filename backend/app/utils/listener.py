# listener.py
from concurrent.futures import ThreadPoolExecutor

from app.models import User, TicketModel
from flask_mail import Message
from app import mail, db
from app.repositories import event_repo
from app.utils.signals import event_cancelled_signal

# Khai báo ThreadPool xử lý task nền
executor = ThreadPoolExecutor(max_workers=4)


def send_cancellation_emails_async(app, event_id, event_name):
    """Hàm chạy ngầm ở Thread riêng để gửi email"""
    print(f"[DEBUG] Bắt đầu gửi mail cho event_id={event_id}", flush=True)

    # Cần push app_context vì Thread riêng không có context mặc định của Flask
    with app.app_context():
        # 1. Truy vấn danh sách email user đã mua vé sự kiện này
        recipient_emails = event_repo.get_ticket_holder_emails(event_id)
        print(f"[DEBUG] Tìm thấy {len(recipient_emails)} email: {recipient_emails}", flush=True)

        if not recipient_emails:
            print("[DEBUG] Không có email nào, dừng lại.", flush=True)
            return

        # 2. Tạo nội dung email
        msg = Message(
            subject=f"[THÔNG BÁO] Sự kiện '{event_name}' đã bị hủy",
            recipients=recipient_emails,
            body=f"Rất tiếc, sự kiện '{event_name}' đã bị hủy. Chúng tôi sẽ tiến hành hoàn tiền (nếu có)."
        )

        # 3. Gửi email
        try:
            mail.send(msg)
            print("================ MAIL đã send", flush=True)
        except Exception as e:
            print(f"[ERROR] Lỗi gửi mail: {e!r}", flush=True)
            app.logger.error(f"Lỗi gửi mail khi hủy event {event_id}: {str(e)}")


def _log_future_exception(fut):
    """Bắt buộc mọi exception trong thread nền phải được in ra, không để nó biến mất."""
    exc = fut.exception()
    if exc is not None:
        print(f"[ERROR] Exception trong background thread: {exc!r}", flush=True)
        import traceback
        traceback.print_exception(type(exc), exc, exc.__traceback__)


# Đăng ký Listener nhận Signal
@event_cancelled_signal.connect
def on_event_cancelled(app, event, **extra):
    """Hàm listener tương đương @EventListener trong Spring"""
    print(f"[DEBUG] Signal event_cancelled nhận được cho event_id={event.id}", flush=True)
    # Đẩy việc gửi mail vào ThreadPool để HTTP Response trả về ngay cho client
    future = executor.submit(
        send_cancellation_emails_async,
        app,
        event.id,
        event.name
    )
    future.add_done_callback(_log_future_exception)