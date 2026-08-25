import React from "react";

export default function UserTicketCard({ ticket }) {
  const {
    id,
    eventName,
    organizer,
    category,
    date,
    time,
    location,
    ticketType,
    quantity,
    totalPrice,
    status,
    qrCodeUrl,
  } = ticket;

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
          {eventName}
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
