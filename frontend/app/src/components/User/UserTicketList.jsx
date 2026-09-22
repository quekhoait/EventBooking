import React from "react";
import { Link } from "react-router-dom";
import UserTicketCard from "./UserTicketCard";
import EventModal from "../events/EventModal";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "Chưa cập nhật";

export default function UserTicketList({ tickets = [] }) {
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2A2A2A] bg-[#F4F1EB] p-12 text-center">
        <p className="text-4xl">🎫</p>
        <h3 className="mt-3 text-lg font-bold text-[#171717]">Chưa có vé nào</h3>
        <p className="mt-1 text-xs text-[#5F5C57]">
          Bạn chưa đăng ký hoặc mua vé cho sự kiện nào.
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-xl bg-[#E85B2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#d44d1e]"
        >
          KHÁM PHÁ SỰ KIỆN
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tickets.map((tkt) => (
        <UserTicketCard
          key={tkt.id}
          ticket={tkt}
          onViewDetails={setSelectedEvent}
        />
      ))}

      {selectedEvent && (
        <EventModal
          title={selectedEvent.name || "Chi tiết sự kiện"}
          onClose={() => setSelectedEvent(null)}
        >
          <div className="space-y-5">
            {selectedEvent.image && (
              <img
                src={selectedEvent.image}
                alt={selectedEvent.name || "Ảnh sự kiện"}
                className="h-56 w-full rounded-xl object-cover"
              />
            )}
            <p className="text-sm leading-6 text-[#5F5C57]">
              {selectedEvent.description || "Chưa có mô tả cho sự kiện này."}
            </p>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-semibold text-[#8A8781]">Bắt đầu</p>
                <p className="font-bold text-[#171717]">
                  {formatDate(selectedEvent.event_start_time || selectedEvent.start_time)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#8A8781]">Kết thúc</p>
                <p className="font-bold text-[#171717]">
                  {formatDate(selectedEvent.event_end_time || selectedEvent.end_time)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#8A8781]">Địa điểm</p>
                <p className="font-bold text-[#171717]">
                  {selectedEvent.location?.name || selectedEvent.location_name || "Chưa xác định"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#8A8781]">Đơn vị tổ chức</p>
                <p className="font-bold text-[#171717]">
                  {selectedEvent.company?.name || selectedEvent.organizer?.name || "Hokinuva"}
                </p>
              </div>
            </div>
          </div>
        </EventModal>
      )}
    </div>
  );
}