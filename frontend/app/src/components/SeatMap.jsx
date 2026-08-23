function SeatMap({ assignedSeats }) {
  return (
    <div className="rounded-2xl bg-[#181a1b] p-5 panel-border sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase text-white">
            Ghế được cấp
          </h2>
          <p className="text-xs text-white/40">
            Ghế được random sau khi thanh toán thành công
          </p>
        </div>
        <span className="rounded-full bg-[#ff6b12] px-3 py-1 text-xs font-bold text-white">
          ĐÃ XÁC NHẬN
        </span>
      </div>
      <div className="mb-7 rounded bg-[#343638] py-2 text-center text-[10px] font-bold uppercase tracking-[.3em] text-white/50">
        Sân khấu
      </div>
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-3 sm:grid-cols-6">
        {assignedSeats.map((seat) => (
          <div
            key={seat}
            className="seat seat-selected flex aspect-square items-center justify-center rounded-lg bg-[#ff6b12] text-sm font-bold text-white"
          >
            {seat}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeatMap;
