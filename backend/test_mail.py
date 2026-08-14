"""
Test SMTP đơn giản, không cần Flask.
Chạy: python test_smtp.py
"""
import smtplib
from email.mime.text import MIMEText
MAIL_SERVER="sandbox.smtp.mailtrap.io"
MAIL_PORT=587
MAIL_USE_TLS=True
#MAIL_DEFAULT_SENDER=True
MAIL_USERNAME="944667aff073d0"
MAIL_PASSWORD="a51cff4286aa24"


TO = MAIL_USERNAME  # gửi thử cho chính mình

msg = MIMEText("Đây là email test SMTP độc lập, không qua Flask.")
msg["Subject"] = "Test SMTP"
msg["From"] = MAIL_USERNAME
msg["To"] = TO

try:
    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
        server.set_debuglevel(1)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_USERNAME, [TO], msg.as_string())
    print("\n✅ GỬI THÀNH CÔNG — auth và cấu hình mail đều đúng.")
    print("=> Vậy lỗi nằm ở phía Flask/config.py, không phải ở Gmail/App Password.")
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ AUTH FAIL: {e}")
    print("=> App Password sai, hết hạn, hoặc email/2FA có vấn đề. Tạo App Password mới.")
except Exception as e:
    print(f"\n❌ LỖI KHÁC: {e!r}")