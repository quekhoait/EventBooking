
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { FaCheck, FaCircleNotch, FaMagnifyingGlass, FaTicket } from "react-icons/fa6";
import { ticketService } from "../../services/ticketServices";
import { useAuth } from "../../context/AuthContext";

const steps = [
  { number: "01", label: "TÌM VÉ", description: "Nhập mã vé" },
  { number: "02", label: "XÁC NHẬN", description: "Kiểm tra thông tin" },
  { number: "03", label: "HOÀN TẤT", description: "Vé đã check-in" },
];


function getTicketEvent(ticket) {
  return ticket?.seat?.event ?? ticket?.event ?? {};
}

function formatValue(value, fallback = "Chưa cập nhật") {
  return value || fallback;
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN");
}

function isTicketCheckedIn(ticket) {
  return Boolean(ticket?.is_checkin || ticket?.checkedIn);
}

export const CheckinPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleSearch = async (event) => {
    event.preventDefault();
    const ticketCode = code.trim();
    if (!ticketCode) {
      setError("Vui lòng nhập mã vé để tìm kiếm.");
      setTicket(null);
      return;
    }

    setLoading(true);
    setError("");
    setTicket(null);
    try {
      const response = await ticketService.getOrganizerTickets(ticketCode);
      if (response?.data?.data) {
        setTicket(response.data.data);
        setStep(2);
      } else {
        setError("Mã vé không tồn tại hoặc không thuộc sự kiện của bạn.");
        setStep(1);
      }
    } catch (requestError) {
      const message = requestError.response?.status === 404
        ? "Mã vé không tồn tại hoặc không thuộc sự kiện của bạn."
        : requestError.response?.data?.message ||
          requestError.message ||
          "Không thể tìm vé. Vui lòng thử lại.";
      setError(message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setCheckingIn(true);
    setError("");
    try {
      const response = await ticketService.checkinOrganizerTicket(ticket.code);
      setTicket(response.data.data);
      setStep(3);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Không thể check-in vé. Vui lòng thử lại.",
      );
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0d0d0d] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-display text-sm font-bold tracking-[0.22em] text-[#ff6b12]">EVENT STAFF / CHECK-IN</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">Soát vé tại cổng</h1>
            <p className="mt-3 max-w-xl text-sm text-[#aaa39c]">Tra cứu vé, kiểm tra thông tin và xác nhận khách đã tham dự sự kiện.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#aaa39c]">
            <FaTicket className="text-[#ff6b12]" />
            <span>Quầy check-in</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 border-y border-white/10 py-4">
          {steps.map((item, index) => {
            const active = step >= index + 1;
            return (
              <div key={item.number} className={`relative px-2 sm:px-5 ${index < steps.length - 1 ? "border-r border-white/10" : ""}`}>
                <div className={`flex items-center gap-2 font-display text-lg font-bold ${active ? "text-[#ff6b12]" : "text-[#5d5a57]"}`}>
                  {step > index + 1 ? <FaCheck className="text-sm" /> : <span>{item.number}</span>}
                  <span className="text-xs tracking-wider sm:text-sm">{item.label}</span>
                </div>
                <p className="mt-1 hidden text-xs text-[#77736e] sm:block">{item.description}</p>
              </div>
            );
          })}
        </div>

        <section className="panel-border bg-[#171717] p-5 shadow-[8px_8px_0_rgba(255,107,18,.12)] sm:p-8">
          <form onSubmit={handleSearch}>
            <label htmlFor="ticket-code" className="text-xs font-bold uppercase tracking-[0.16em] text-[#aaa39c]">Mã vé</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center border border-white/15 bg-[#0d0d0d] px-4 focus-within:border-[#ff6b12]">
                <FaTicket className="mr-3 shrink-0 text-[#ff6b12]" />
                <input id="ticket-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Nhập mã vé, ví dụ: HOKI-2026-001" className="w-full bg-transparent py-4 text-sm font-bold uppercase tracking-wider text-white outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#625f5b]" />
              </div>
              <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-[#ff6b12] px-7 py-4 text-sm font-extrabold uppercase tracking-wider text-[#171717] transition hover:bg-[#ff8b43] disabled:cursor-wait disabled:opacity-60">
                {loading ? <FaCircleNotch className="animate-spin" /> : <FaMagnifyingGlass />}
                Tìm kiếm
              </button>
            </div>
          </form>

          {error && <p className="mt-4 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>}

          {ticket && (
            <article className={`mt-8 border ${isTicketCheckedIn(ticket) ? "border-emerald-400/50" : "border-white/10"} bg-[#f4f1eb] text-[#171717]`}>
              <div className="flex flex-col gap-6 p-5 sm:p-7">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#ff6b12]/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#c44708]">Vé tham dự</span>
                    <span className="bg-black/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#77736e]">{formatValue(ticket.status)}</span>
                    {isTicketCheckedIn(ticket) && <span className="flex items-center gap-1 bg-emerald-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700"><FaCheck /> Đã check-in</span>}
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold">{formatValue(ticket.eventName || getTicketEvent(ticket).name || ticket.event_name, "Sự kiện")}</h2>
                  <p className="mt-1 text-sm text-[#77736e]">Mã vé: <strong className="font-mono text-[#171717]">{ticket.code || ticket.id}</strong></p>
                  <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Khách hàng</p><p className="mt-1 font-bold">{formatValue(ticket.user?.full_name)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Số điện thoại</p><p className="mt-1 font-bold">{formatValue(ticket.user?.phone_number)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Email</p><p className="mt-1 break-all font-bold">{formatValue(ticket.user?.email)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Số ghế</p><p className="mt-1 font-bold">{formatValue(ticket.seat?.seat_code)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Giá vé</p><p className="mt-1 font-bold">{typeof ticket.price === "number" ? `${ticket.price.toLocaleString("vi-VN")} đ` : formatValue(ticket.price)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Mã giảm giá</p><p className="mt-1 font-bold">{formatValue(ticket.discount?.code, "Không sử dụng")}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Bắt đầu</p><p className="mt-1 font-bold">{formatDate(getTicketEvent(ticket).event_start_time)}</p></div>
                    <div><p className="text-xs font-bold uppercase text-[#99938c]">Kết thúc</p><p className="mt-1 font-bold">{formatDate(getTicketEvent(ticket).event_end_time)}</p></div>
                    <div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-[#99938c]">Địa điểm</p><p className="mt-1 font-bold">{formatValue(getTicketEvent(ticket).location_name)}{getTicketEvent(ticket).location?.address ? ` - ${getTicketEvent(ticket).location.address}` : ""}</p></div>
                  </div>
                  {getTicketEvent(ticket).description && <p className="mt-6 border-t border-[#d6d1c8] pt-4 text-sm leading-6 text-[#77736e]">{getTicketEvent(ticket).description}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-center justify-center border-[#d6d1c8] md:border-l md:pl-7">
                    {ticket.face_image ? <img src={ticket.face_image} alt="Ảnh khuôn mặt trên vé" className="h-40 w-32 object-cover" /> : <div className="flex h-40 w-32 items-center justify-center border border-dashed border-[#aaa39c] text-center text-xs font-bold uppercase text-[#77736e]">Không có ảnh</div>}
                    <p className="mt-2 text-center text-xs font-bold uppercase text-[#77736e]">Ảnh xác thực</p>
                    <div className="mt-4 flex h-20 w-20 items-center justify-center border-4 border-emerald-500 text-emerald-600">{isTicketCheckedIn(ticket) ? <FaCheck className="text-4xl" /> : <FaTicket className="text-3xl" />}</div>
                    {isTicketCheckedIn(ticket) && <p className="mt-3 text-center text-xs font-bold text-emerald-700">Đã xác nhận</p>}
                  </div>
                </div>
                {getTicketEvent(ticket).image && <img src={getTicketEvent(ticket).image} alt={getTicketEvent(ticket).name || "Ảnh sự kiện"} className="h-48 w-full object-cover sm:h-64" />}
              </div>
              {!isTicketCheckedIn(ticket) && <div className="border-t border-[#d6d1c8] bg-white/60 px-5 py-4 sm:px-7"><button type="button" onClick={handleCheckin} disabled={checkingIn} className="flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-white transition hover:bg-[#ff6b12] hover:text-[#171717] disabled:opacity-60 sm:w-auto">{checkingIn && <FaCircleNotch className="animate-spin" />} Xác nhận check-in</button></div>}
            </article>
          )}
        </section>
      </div>
    </main>
  );
};
