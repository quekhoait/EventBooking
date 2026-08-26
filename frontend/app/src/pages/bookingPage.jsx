import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BookingProgress from "../components/BookingProgress";
import OrderSummary from "../components/OrderSummary";
import TicketSelector from "../components/TicketSelector";
import { EventContext } from "../context/EventContext";
import { eventServices } from "../services/eventServices";
import { ticketService } from "../services/ticketServices";
import DigitalTicketPage from "./DigitalTicketPage";

function BookingPage({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: paramId } = useParams();
  const { eventDetail, fetchEventDetail } = useContext(EventContext);

  const eventFromState = location.state?.event;
  const eventId = eventFromState?.id || paramId;
  const event = eventFromState || eventDetail;

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [faceImage, setFaceImage] = useState("");
  const [ticketResult, setTicketResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [step, setStep] = useState(0);

  // Load danh sách loại vé
  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!eventFromState && fetchEventDetail) {
          await fetchEventDetail(eventId);
        }
        const response = await eventServices.getTicketsType(eventId);
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
      // 1. Gửi request tạo vé
      const bookingPayload = {
        event_id: Number(eventId),
        seat_type_id: Number(selectedTicket.id),
        discount_id: discount > 0 ? 1 : null,
        face_image: faceImage,
      };

      const ticketRes = await ticketService.createTicket(bookingPayload);
      const ticketData = ticketRes?.data?.data;
      const ticketCode = ticketData?.code;

      if (!ticketCode) {
        throw new Error("Không nhận được mã vé từ hệ thống.");
      }

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

      setStep(2);
    } catch (error) {
      console.error("Lỗi quy trình đặt vé và thanh toán:", error);
      setSaveError(
        error.response?.data?.message || error.message || "Giao dịch thất bại. Vui lòng thử lại."
      );
    } finally {
      setIsSavingTicket(false);
    }
  };



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
    const previewTicket = {
      event,
      face_image: faceImage,
      ticketName: selectedTicket?.ticket_type?.name || "Vé",
      quantity: 1,
      total,
      seats: [],
      code: "Chưa thanh toán",
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
            result={previewTicket}
            preview
            capturedFaceImage={faceImage}
            onFaceCapture={setFaceImage}
          />
          <OrderSummary
            event={event}
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

  // Bước 0: Chọn vé
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
      <button onClick={handleBack} className="mb-6 text-xs font-bold uppercase text-[#ff985c] hover:underline">
        ← Quay lại
      </button>

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Đặt vé sự kiện</p>
          <h1 className="font-display text-4xl font-extrabold uppercase text-white sm:text-5xl">Chọn loại vé</h1>
        </div>
        <BookingProgress currentStep={step} />
      </div>

      <div className="mb-8 grid overflow-hidden rounded-2xl border border-white/10 bg-[#1b1c1d] md:grid-cols-[1.3fr_1fr]">
        <div className="min-h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.image || "/placeholder.jpg"})` }} />
        <div className="flex flex-col justify-center p-6">
          <span className="mb-1 text-xs font-bold uppercase text-[#ff985c]">{event.category?.name || "Sự kiện"}</span>
          <h2 className="font-display text-2xl font-bold uppercase text-white">{event.name}</h2>
          <p className="mt-2 text-sm text-white/60">{event.event_start_time || event.date || "Chưa cập nhật ngày"}</p>
          <p className="text-sm text-white/60">{event.location_name || event.location || "Địa điểm chưa xác định"}</p>
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
    </main>
  );
}

export default BookingPage;