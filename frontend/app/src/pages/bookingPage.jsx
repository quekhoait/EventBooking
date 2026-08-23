import { useMemo, useState } from "react";
import BookingProgress from "../components/BookingProgress";
import OrderSummary from "../components/OrderSummary";
import SeatMap from "../components/SeatMap";
import TicketSelector from "../components/TicketSelector";

const defaultEvent = {
  name: "The Sound Of Summer",
  date: "20.08.2026",
  time: "19:30 - 22:00",
  location: "Nhà hát Hòa Bình, TP. Hồ Chí Minh",
  image:
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
};
const tickets = [
  {
    id: "standard",
    name: "Vé tiêu chuẩn",
    description: "Khu vực B - C",
    price: 350000,
  },
  {
    id: "vip",
    name: "Vé VIP",
    description: "Khu vực A, tầm nhìn đẹp",
    price: 650000,
  },
  {
    id: "backstage",
    name: "Vé Backstage",
    description: "Gặp gỡ nghệ sĩ sau chương trình",
    price: 1200000,
  },
];

function BookingPage({ event = defaultEvent, onBack, onPaid }) {
  const [selectedType, setSelectedType] = useState("standard");
  const [quantities, setQuantities] = useState({
    standard: 1,
    vip: 0,
    backstage: 0,
  });
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [step, setStep] = useState(0);
  const [assignedSeats, setAssignedSeats] = useState([]);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedType);
  const quantity = quantities[selectedType];
  const subtotal = useMemo(() => selectedTicket.price * quantity, [selectedTicket, quantity]);
  const total = Math.max(0, subtotal - discount);

  const updateQuantity = (id, amount) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(5, current[id] + amount)) }));
  const applyDiscount = () => setDiscount(discountCode.trim().toUpperCase() === "HOKI20" ? Math.round(subtotal * 0.2) : 0);
  const pay = () => {
    const availableSeats = Array.from({ length: 40 }, (_, index) => `${String.fromCharCode(65 + Math.floor(index / 8))}${(index % 8) + 1}`).filter((seat) => !["A4", "B5", "D4", "E3"].includes(seat));
    const randomSeats = [...availableSeats].sort(() => Math.random() - 0.5).slice(0, quantity);
    const result = { code: `HKV${Date.now().toString().slice(-8)}`, event, ticketName: selectedTicket.name, quantity, seats: randomSeats, total };
    setAssignedSeats(randomSeats);
    setStep(2);
    onPaid(result);
  };

  
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-8 lg:px-10 lg:py-12">
      <button
        onClick={onBack}
        className="mb-6 text-xs font-bold uppercase text-[#ff985c]"
      >
        ← Quay lại danh sách
      </button>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">
            Đặt vé sự kiện
          </p>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-none text-white sm:text-6xl">
            {assignedSeats.length ? "Thanh toán thành công" : "Chọn loại ghế"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/50">
            {assignedSeats.length
              ? "Vé của bạn đã được xác nhận. Ghế được hệ thống cấp tự động."
              : "Bạn không cần chọn ghế trước. Hệ thống sẽ random ghế sau khi thanh toán."}
          </p>
        </div>
        <BookingProgress currentStep={step} />
      </div>
      <div className="mb-8 grid overflow-hidden rounded-2xl bg-[#1b1c1d] panel-border md:grid-cols-[1.3fr_1fr]">
        <div
          className="min-h-52 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.image})` }}
        />
        <div className="flex flex-col justify-center p-6">
          <span className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ff985c]">
            Sự kiện đã chọn
          </span>
          <h2 className="font-display text-4xl font-bold uppercase text-white">
            {event.name}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {event.date} · {event.time}
          </p>
          <p className="mt-1 text-sm text-white/60">{event.location}</p>
        </div>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
        <section className="space-y-7">
          <div className="rounded-2xl bg-[#1b1c1d] p-5 panel-border sm:p-7">
            <div className="mb-5">
              <h2 className="font-display text-3xl font-bold uppercase text-white">
                1. Chọn loại ghế
              </h2>
              <p className="text-xs text-white/40">
                Chọn hạng ghế và số lượng, ghế cụ thể sẽ được cấp tự động
              </p>
            </div>
            <TicketSelector
              tickets={tickets}
              selectedType={selectedType}
              onSelect={setSelectedType}
              quantities={quantities}
              onQuantityChange={updateQuantity}
            />
          </div>
          {assignedSeats.length > 0 && (
            <SeatMap assignedSeats={assignedSeats} />
          )}
        </section>
        <OrderSummary
          event={event}
          quantity={quantity}
          ticketName={selectedTicket.name}
          total={total}
          discount={discount}
          discountCode={discountCode}
          setDiscountCode={setDiscountCode}
          onApplyDiscount={applyDiscount}
          onContinue={pay}
          completed={assignedSeats.length > 0}
        />
      </div>
    </main>
  );
}

export default BookingPage;
