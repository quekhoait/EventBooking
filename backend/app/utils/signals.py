from blinker import Namespace

# Khởi tạo Namespace cho project
event_signals = Namespace()

# Khai báo signal hủy sự kiện
event_cancelled_signal = event_signals.signal('event-cancelled')