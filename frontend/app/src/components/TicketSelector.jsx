function TicketSelector({ tickets = [], selectedTicket, onSelect }) {
  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const isSelected = selectedTicket?.id === ticket.id;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelect(ticket)}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
              isSelected
                ? "border-[#ff985c] bg-[#ff985c]/10 shadow-[0_0_15px_rgba(255,152,92,0.15)]"
                : "border-white/10 bg-[#252729] hover:border-white/20"
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-display text-lg font-bold text-white">
                  {ticket.ticket_type?.name || "Vé sự kiện"}
                </h3>
                {isSelected && (
                  <span className="rounded-full bg-[#ff985c] px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                    Đã chọn
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/50">
                {ticket.ticket_type?.description || "Không có mô tả"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-[#ff985c]">
                {(ticket.price || 0).toLocaleString("vi-VN")} đ
              </p>
              <p className="text-xs text-white/40">1 vé</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TicketSelector;