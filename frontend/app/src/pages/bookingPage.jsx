import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BookingProgress from "../components/BookingProgress";
import OrderSummary from "../components/OrderSummary";
import TicketSelector from "../components/TicketSelector";
import ReportModal from "../components/events/ModelReport";
import { EventContext } from "../context/EventContext";
import { ticketService } from "../services/ticketServices";
import DigitalTicketPage from "./DigitalTicketPage";
import { logError } from "../utils/log";
import { eventService } from "../services/eventService";

function BookingPage({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const { eventDetail, fetchEventDetail } = useContext(EventContext);
  const eventFromState = location.state?.event;
  const eventId = eventFromState?.id || paramId;
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [faceImage, setFaceImage] = useState("");
  const [ticketResult, setTicketResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!eventFromState && fetchEventDetail) {
          await fetchEventDetail(eventId);
        }
        const response = await eventService.getTicketsType(eventId);
        if (response?.status === 200) {
          setTickets(response?.data.data );
        }
      } catch (error) {
        console.error("Lỗi tải loại vé:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, eventFromState, fetchEventDetail]);

  // Tính tổng tiền: Giá vé - Giảm giá
  const total = useMemo(() => {
    if (!selectedTicket) return 0;
    return selectedTicket.price -discount;
  }, [selectedTicket, discount]);

  // Áp dụng mã giảm giá
  const applyDiscount = () => {
    if (discountCode.trim().toUpperCase() === "FLASHY") {
      setDiscount(50000);
    } else {
      alert("Mã giảm giá không hợp lệ");
    }
  };

  const handleReport = async (reportData) => {
    try {
      await eventService.createReport(eventId, reportData);
      setIsReportOpen(false);
      alert("Báo cáo đã được gửi thành công.");
    } catch (error) {
      console.error("Lỗi gửi báo cáo:", error);
      alert(error.response?.data?.detail || "Không thể gửi báo cáo.");
    }
  };

  const continueToInformation = () => {
    if (!selectedTicket) {
      alert("Vui lòng chọn 1 loại vé.");
      return;
    }
    setStep(1);
  };

  const saveBookingAndViewTicket = async () => {
    if (!faceImage) {
      alert("Vui lòng chụp ảnh khuôn mặt trước.");
      return;
    }

    setIsSavingTicket(true);
    setSaveError("");
    try {
      const bookingPayload = {
        event_id: eventId,
        seat_type_id: selectedTicket.event_ticket_type_id,
        discount_id: discount > 0 ? 1 : null,
        face_image: faceImage,
      };
      
      const ticketRes = await ticketService.createTicket(bookingPayload);
      const ticketData = ticketRes?.data?.data;
      const ticketCode = ticketData?.code;

      setTicketResult(ticketData);
      const paymentPayload = {
        ticket_code: ticketCode,
        method: "momo", 
      };
      const paymentRes = await ticketService.createPayment(paymentPayload);
      const paymentData = paymentRes?.data?.data;
      if (paymentData?.payUrl) {
        window.location.href = paymentData.payUrl;
        return;
      }
    } catch (error) {
      logError(error)
      console.error("Backend Error Details:", error.response?.data);
      setSaveError(
        error.response?.data?.detail || error.message || "Không thể tạo vé.",
      );
    } finally {
      setIsSavingTicket(false);
    }
  };


useEffect(() => {
  const loadEvent = async () => {
    await fetchEventDetail(eventId);
  };
  if (eventId) {
    loadEvent();
  }
}, [eventId]);


  const handleBack = () => (onBack ? onBack() : navigate(-1));

  if (loading && !event) {
    return <div className="py-20 text-center text-white/60">Đang tải thông tin...</div>;
  }

  if (!event) {
    return <div className="py-20 text-center text-white/60">Không tìm thấy sự kiện.</div>;
  }

  if (step === 2 && ticketResult) {
    return (
      <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Đặt vé sự kiện</p>
            <h1 className="font-display text-4xl font-extrabold uppercase text-white sm:text-5xl">Thông tin vé</h1>
          </div>
          <BookingProgress currentStep={step} />
        </div>
        <DigitalTicketPage result={ticketResult} onHome={handleBack} />
      </main>
    );
  }

  if (step === 1) {
    const preview = {
      ...eventDetail,
      ticketName: selectedTicket?.ticket_type?.name || "Vé Tiêu Chuẩn",
      price: selectedTicket?.price || 0,
      discount: discount,
      total: total,
      quantity: 1,
      status: "CHỜ THANH TOÁN",
      seat: { seat_code: "Cấp sau khi thanh toán" },
      face_image: faceImage,
    };

    return (
      <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
        <button
          onClick={() => setStep(0)}
          className="mb-6 text-xs font-bold uppercase text-[#ff985c] hover:underline"
        >
          ← Quay lại chọn vé
        </button>

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Đặt vé sự kiện</p>
            <h1 className="font-display text-4xl font-extrabold uppercase text-white sm:text-5xl">Thông tin vé</h1>
          </div>
          <BookingProgress currentStep={step} />
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
          <DigitalTicketPage
            result={preview}
            preview
            capturedFaceImage={faceImage}
            onFaceCapture={setFaceImage}
          />
          <OrderSummary
            event={eventDetail}
            quantity={1}
            ticketName={selectedTicket?.ticket_type?.name || "Chưa chọn vé"}
            total={total}
            discount={discount}
            discountCode={discountCode}
            setDiscountCode={setDiscountCode}
            onApplyDiscount={applyDiscount}
            onContinue={saveBookingAndViewTicket}
            continueLabel="Thanh toán"
            continueLoading={isSavingTicket}
            canContinue={Boolean(faceImage)}
            completed={false}
          />
        </div>

        {saveError && <p className="mt-5 text-sm font-bold text-red-300">{saveError}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
      <button onClick={handleBack} className="mb-6 text-xs font-bold uppercase text-[#ff985c] hover:underline">
        ← Quay lại
      </button>

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Đặt vé sự kiện</p>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white sm:text-4xl">Chọn loại vé</h1>
        </div>
        <BookingProgress currentStep={step} />
      </div>

    <div className="mb-8 grid overflow-hidden rounded-2xl border border-white/10 bg-[#1b1c1d] md:grid-cols-[1.3fr_1fr]">
  <div 
    className="min-h-[360px] w-full bg-cover bg-center" 
    style={{ backgroundImage: `url(${eventDetail?.image})` }} 
  />
<div className="flex h-full flex-col justify-between p-6">
  <div className="flex items-center gap-2">
  <span className="rounded bg-[#ff985c]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#ff985c]">
    {eventDetail?.category?.name}
  </span>
  {eventDetail?.status && (
    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium uppercase text-emerald-400">
      {eventDetail.status}
    </span>
  )}

  <button
    type="button"
    onClick={() => setIsReportOpen(true)}
    className="cursor-pointer ml-auto rounded bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
  >
    Report
  </button>
</div>

  <div className="my-auto py-4">
    <h2 className="font-display text-2xl font-bold uppercase text-white">
      {eventDetail?.name}
    </h2>
    {eventDetail?.description && (
      <p className="mt-2 line-clamp-2 text-sm text-white/70">
        {eventDetail.description}
      </p>
    )}
  </div>

  {/* Footer: Metadata list */}
  <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/60">
    <div className="flex items-center gap-2">
      <span className="font-semibold text-white/80">⏱ Diễn ra:</span>
      <span>
        {eventDetail?.event_start_time ? new Date(eventDetail.event_start_time).toLocaleString('vi-VN') : "Chưa cập nhật"}
        {eventDetail?.event_end_time && ` - ${new Date(eventDetail.event_end_time).toLocaleTimeString('vi-VN')}`}
      </span>
    </div>

    {eventDetail?.start_time && (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white/80">Mở bán:</span>
        <span>{new Date(eventDetail.start_time).toLocaleString('vi-VN')}</span>
      </div>
    )}

    <div className="flex items-center gap-2">
      <span className="font-semibold text-white/80">Địa điểm:</span>
      <span>{eventDetail?.location_name || "Chưa xác định"}</span>
    </div>

    {eventDetail?.company && (
      <div className="flex items-start gap-2">
        <span className="font-semibold text-white/80">Đơn vị:</span>
        <span>{eventDetail.company.name} ({eventDetail.company.address})</span>
      </div>
    )}
  </div>
</div>
  
</div>

      <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-white/10 bg-[#1b1c1d] p-5 sm:p-7">
          <h2 className="mb-4 font-display text-xl font-bold uppercase text-white">1. Chọn loại vé</h2>
          <TicketSelector
            tickets={tickets}
            selectedTicket={selectedTicket}
            onSelect={(ticket) => setSelectedTicket(ticket)}
          />
        </section>

        <OrderSummary
          event={event}
          quantity={selectedTicket ? 1 : 0}
          ticketName={selectedTicket?.ticket_type?.name || "Chưa chọn vé"}
          total={total}
          discount={discount}
          discountCode={discountCode}
          setDiscountCode={setDiscountCode}
          onApplyDiscount={applyDiscount}
          onContinue={continueToInformation}
          completed={false}
        />
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReport}
      />
    </main>
  );
}

export default BookingPage;