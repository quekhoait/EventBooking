import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import FaceCaptureModal from "../components/FaceCaptureModal";
import formatEventData from "../utils/format";

function DigitalTicketPage({
  result, // Nhận trực tiếp eventDetail
  onHome,
  preview = false,
  capturedFaceImage = "",
  onFaceCapture,
}) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFaceCaptureOpen, setIsFaceCaptureOpen] = useState(false);
 
  if (!result) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-5xl font-bold uppercase text-white">
          Chưa có vé
        </h1>
        <button
          onClick={onHome}
          className="mt-6 rounded-xl bg-[#ff6b12] px-5 py-3 text-sm font-bold text-white"
        >
          Về trang chủ
        </button>
      </main>
    );
  }

  // Đọc trực tiếp từ result (eventDetail) hoặc fallback nếu sau này bọc trong result.event
  const event = result.event || result.seat?.event || result;

  const user = {
    fullname: "Huỳnh Khoa",
    phone_number: "098789878",
  };

  const seats = result?.seat;
  const faceImage = capturedFaceImage || result.face_image;
  const ticketName = result.ticketName || result.category?.name || "Vé Tiêu Chuẩn";
  const quantity = result.quantity || 1;
  const total = (result.price ? result.price - (result.discount || 0) : result.total) || 0;

  const startTime = formatEventData(event?.event_start_time);
  const endTime = formatEventData(event?.event_end_time);
  const eventDate = startTime?.date || "Chưa cập nhật";
  const eventTime = startTime?.time && endTime?.time ? `${startTime.time} - ${endTime.time}` : "Đang cập nhật";

  const eventLocation = event?.location_name || event?.location || "Địa điểm chưa xác định";
  const qrData = encodeURIComponent(
    `HOKIHUVA|${result?.id || result?.code || "PREVIEW"}|${event?.name || ""}|${seats?.seat_code || "AUTO"}`
  );

  const downloadTicketImage = async () => {
    if (!ticketRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffe6d2",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `ve-${result?.code || event?.id || "dien-tu"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Không thể chụp vé:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-6 lg:px-10 lg:py-10">
      <div className="grid items-start gap-6 lg:grid-cols-[170px_minmax(0,760px)] lg:justify-center">
        {/* Actions Bar */}
        <div className="order-2 flex flex-col gap-3 lg:order-1 lg:pt-8">
          <button
            type="button"
            onClick={downloadTicketImage}
            disabled={isDownloading}
            className="rounded-xl bg-[#ff6b12] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#e95b0c] disabled:cursor-wait disabled:opacity-60"
          >
            {isDownloading ? "Đang tạo ảnh..." : "Chụp màn hình vé"}
          </button>
          {onFaceCapture && (
            <button
              type="button"
              onClick={() => setIsFaceCaptureOpen(true)}
              className="rounded-xl border border-[#ff985c] bg-[#1b1c1d] px-4 py-3 text-sm font-extrabold text-[#ff985c] transition hover:bg-[#ff985c]/10"
            >
              {faceImage ? "Chụp lại ảnh khuôn mặt" : "Chụp ảnh khuôn mặt"}
            </button>
          )}
          {!preview && (
            <button
              type="button"
              onClick={onHome}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white hover:border-[#ff985c] hover:text-[#ff985c]"
            >
              Về trang chủ
            </button>
          )}
        </div>

        {/* Ticket Box */}
        <section
          ref={ticketRef}
          className="order-1 overflow-hidden rounded-3xl bg-[#ffe6d2] text-[#241d1a] shadow-[10px_10px_0_rgba(255,107,18,.18)] lg:order-2"
        >
          {/* Header */}
          <div className="border-b border-[#d8b7a0] bg-[#fff4e9] px-6 py-5 text-center sm:px-9">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d94f0d]">
              HOKIHUVA / E-TICKET
            </p>
            <div className="mx-auto mt-4 h-24 w-24 overflow-hidden rounded-full border-4 border-[#ff6b12] bg-[#f2cdb5]">
              {faceImage ? (
                <img
                  src={faceImage}
                  alt="Ảnh đại diện người dùng"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl font-extrabold text-[#d94f0d]">
                  x
                </div>
              )}
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase">
              {user.fullname}
            </h2>
            {user.phone_number && (
              <p className="mt-1 text-xs text-[#806b60]">{user.phone_number}</p>
            )}
          </div>

          {/* Body */}
          <div className="p-6 sm:p-9">
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase text-[#d94f0d]">
                  {event.category?.name || "Sự kiện"}
                </span>
                <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
                  {event.name || "Sự kiện"}
                </h2>
              </div>
              <span className="shrink-0 rounded-full bg-[#ff6b12] px-3 py-2 text-xs font-bold text-white uppercase">
                {event.status || (preview ? "CHỜ THANH TOÁN" : "ĐÃ XÁC NHẬN")}
              </span>
            </div>

            <div className="grid gap-5 border-y border-[#d8b7a0] py-6 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-xs text-[#806b60]">Ngày & giờ</span>
                <div className="text-sm font-bold text-gray-800">
                  <p>{eventDate}</p>
                  <p>{eventTime}</p>
                </div>
              </div>
              <div>
                <span className="block text-xs text-[#806b60]">Địa điểm</span>
                <b>{eventLocation}</b>
              </div>
              <div>
                <span className="block text-xs text-[#806b60]">Ghế</span>
                <b className="text-[#d94f0d]">
                  {seats?.seat_code || "Sẽ được cấp sau khi thanh toán"}
                </b>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_180px] sm:items-end">
              <div>
              <span className="block text-xs text-[#806b60]">Trang thái</span>
                <b className="font-mono text-lg">
                  {result.status}
                </b>
                <span className="block text-xs text-[#806b60]">Mã vé / Mã sự kiện</span>
                <b className="font-mono text-lg">
                  {result.code || `EVT-${event.id || "0000"}`}
                </b>
                <span className="mt-4 block text-xs text-[#806b60]">
                  Tổng thanh toán
                </span>
                <b className="font-display text-3xl text-[#d94f0d]">
                  {total.toLocaleString("vi-VN")} đ
                </b>
              </div>
              <div className="flex flex-col items-center">
                <img
                  className="h-48 w-48 rounded-xl"
                  crossOrigin="anonymous"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`}
                  alt="QR vé điện tử"
                />
                <p className="mt-4 text-center text-xs text-[#806b60]">
                  Quét để xác thực vé
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {onFaceCapture && (
        <FaceCaptureModal
          key={isFaceCaptureOpen ? "face-capture-open" : "face-capture-closed"}
          isOpen={isFaceCaptureOpen}
          onClose={() => setIsFaceCaptureOpen(false)}
          onCapture={onFaceCapture}
        />
      )}
    </main>
  );
}

export default DigitalTicketPage;