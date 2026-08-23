function DigitalTicketPage({ result, onHome }) {
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

  const qrData = encodeURIComponent(
    `HOKIHUVA|${result.code}|${result.event.name}|${result.seats.join(",")}`,
  );
  return (
    <main className="mx-auto max-w-[900px] px-5 py-10 lg:px-10 lg:py-14">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#ff985c]">
          Thanh toán thành công
        </p>
        <h1 className="mt-2 font-display text-6xl font-extrabold uppercase leading-none text-white">
          Digital ticket
        </h1>
        <p className="mt-3 text-sm text-white/50">
          Xuất trình mã QR này tại cổng sự kiện.
        </p>
      </div>
      <section className="overflow-hidden rounded-3xl bg-[#ffe6d2] text-[#241d1a] shadow-[10px_10px_0_rgba(255,107,18,.18)]">
        <div className="grid md:grid-cols-[1fr_280px]">
          <div className="p-6 sm:p-9">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#d94f0d]">
                  HOKIHUVA / E-TICKET
                </p>
                <h2 className="mt-3 font-display text-5xl font-bold uppercase leading-none">
                  {result.event.name}
                </h2>
              </div>
              <span className="rounded-full bg-[#ff6b12] px-3 py-2 text-xs font-bold text-white">
                ĐÃ XÁC NHẬN
              </span>
            </div>
            <div className="grid gap-5 border-y border-[#d8b7a0] py-6 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-xs text-[#806b60]">Ngày & giờ</span>
                <b>
                  {result.event.date} · {result.event.time}
                </b>
              </div>
              <div>
                <span className="block text-xs text-[#806b60]">Địa điểm</span>
                <b>{result.event.location}</b>
              </div>
              <div>
                <span className="block text-xs text-[#806b60]">Hạng vé</span>
                <b>
                  {result.ticketName} × {result.quantity}
                </b>
              </div>
              <div>
                <span className="block text-xs text-[#806b60]">
                  Ghế được cấp
                </span>
                <b className="text-[#d94f0d]">{result.seats.join(", ")}</b>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <span className="block text-xs text-[#806b60]">Mã vé</span>
                <b className="font-mono text-lg">{result.code}</b>
              </div>
              <div className="text-right">
                <span className="block text-xs text-[#806b60]">
                  Tổng thanh toán
                </span>
                <b className="font-display text-3xl text-[#d94f0d]">
                  {result.total.toLocaleString("vi-VN")} đ
                </b>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border-t border-[#d8b7a0] bg-[#fff4e9] p-8 md:border-l md:border-t-0">
            <img
              className="h-48 w-48 rounded-xl"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`}
              alt="QR vé điện tử"
            />
            <p className="mt-4 text-center text-xs text-[#806b60]">
              Quét để xác thực vé
            </p>
          </div>
        </div>
      </section>
      <div className="mt-8 text-center">
        <button
          onClick={onHome}
          className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:border-[#ff985c] hover:text-[#ff985c]"
        >
          ← Về trang chủ
        </button>
      </div>
    </main>
  );
}

export default DigitalTicketPage;
