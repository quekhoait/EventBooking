export default function UserTicketCard({ ticket, onViewDetails }) {
  const event = ticket?.seat?.event || {};
  const status = ticket?.status || "";
  const category = event.category?.name || event.category_name || "SỰ KIỆN";
  const organizer = event.company?.name || event.organizer?.name || "Hokinuva";
  const startTime = event.event_start_time || event.start_time;
  const date = startTime
    ? new Date(startTime).toLocaleDateString("vi-VN")
    : "Chưa cập nhật";
  const time = startTime
    ? new Date(startTime).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa cập nhật";
  const location = event.location?.name || event.location_name || "Chưa xác định";
  const ticketType = ticket?.seat?.name || ticket?.ticket_type?.name || "Vé tham dự";
  const quantity = ticket?.quantity || 1;
  const totalPrice = `${Number(ticket?.price || 0).toLocaleString("vi-VN")} đ`;
  const qrCodeUrl = ticket?.qr_code || ticket?.qrCode || "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(ticket?.code || "ticket");
  const id = ticket?.code || ticket?.id || "-";

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] shadow-lg md:flex-row">
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded bg-[#E85B2A]/10 px-2.5 py-1 text-[11px] font-bold text-[#E85B2A]">
            {category}
          </span>
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {status === "CONFIRMED" ? "● HỢP LỆ / ĐÃ XÁC NHẬN" : status}
          </span>
        </div>

        <h3 className="mt-3 text-xl font-extrabold leading-snug text-[#171717]">
          {ticket.seat.event.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-[#8A8781]">
          Tổ chức bởi: <span className="text-[#171717]">{organizer}</span>
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div>
            <span className="font-semibold text-[#8A8781]">Thời gian:</span>
            <p className="font-bold text-[#171717]">
              {time}, {date}
            </p>
          </div>
          <div>
            <span className="font-semibold text-[#8A8781]">Địa điểm:</span>
            <p className="font-medium text-[#171717] leading-relaxed">
              {location}
            </p>
          </div>
          <div>
            <span className="font-semibold text-[#8A8781]">Loại vé:</span>
            <p className="font-bold text-[#E85B2A]">{ticketType}</p>
          </div>
          <div>
            <span className="font-semibold text-[#8A8781]">
              Số lượng & Tổng:
            </span>
            <p className="font-bold text-[#171717]">
              {quantity} vé • {totalPrice}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(event)}
          className="mt-6 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E85B2A]"
        >
          XEM CHI TIẾT SỰ KIỆN
        </button>
      </div>

      <div className="relative hidden w-px border-r-2 border-dashed border-[#D6D1C8] md:block" />

      <div className="flex flex-col items-center justify-center bg-white p-6 md:w-56">
        <img
          src={qrCodeUrl}
          alt="Mã QR vé"
          className="h-32 w-32 rounded-lg border border-[#D6D1C8] p-1 shadow-inner"
        />
        <span className="mt-3 font-mono text-xs font-bold tracking-wider text-[#171717]">
          {id}
        </span>
        <span className="mt-1 text-[10px] text-[#8A8781]">
          Quét mã tại cửa check-in
        </span>
      </div>
    </article>
  );
}
