import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { eventServices } from "../services/eventServices.jsx";

const categories = [
  "Tất cả",
  "Nhạc sống",
  "Sân khấu & nghệ thuật",
  "Thể thao",
  "Hội thảo & workshop",
];

function EventPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [eventData, setEventData] = useState([]);

  useEffect(() => {
    const getAllEvent = async () => {
      try {
        const response = await eventServices.getEvents();
        if (response?.status === 200) {
          setEventData(response?.data?.data.items);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sự kiện:", error);
      }
    };

    getAllEvent();
  }, []);

  const query = new URLSearchParams(location.search);
  const activeCategory = query.get("category") || "Tất cả";
  const visibleEvents = useMemo(
    () =>
      activeCategory === "Tất cả"
        ? eventData
        : eventData.filter((event) => event.category === activeCategory),
    [activeCategory, eventData],
  );

  console.log(eventData)

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-9 lg:px-10 lg:py-12">
      <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <button
            onClick={() => navigate("/")}
            className="mb-6 text-xs font-bold uppercase text-[#ff985c]"
          >
            ← Về trang chủ
          </button>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">
            Khám phá sự kiện
          </p>
          <h1 className="font-display text-6xl font-extrabold uppercase leading-none text-white">
            Event collection
          </h1>
        </div>
        <p className="max-w-xs text-sm text-white/45">
          Tìm cảm hứng cho lịch trình tiếp theo của bạn.
        </p>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              navigate(
                category === "Tất cả"
                  ? "/events"
                  : `/events?category=${encodeURIComponent(category)}`,
              )
            }
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold ${activeCategory === category ? "border-[#ff6b12] bg-[#ff6b12] text-white" : "border-white/15 text-white/55 hover:border-[#ff985c] hover:text-[#ff985c]"}`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold uppercase text-white">
          {activeCategory}
        </h2>
        <span className="text-xs text-white/40">
          {visibleEvents.length} sự kiện
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {visibleEvents.map((event) => (
          <article
            key={event.id}
            className="group overflow-hidden rounded-2xl bg-[#1b1c1d] panel-border"
          >
            <div className="h-48 overflow-hidden bg-[#272829]">
              <img
                src={event.image}
                alt={event.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#ff985c]">
                {event.date}
              </p>
              <h3 className="mt-2 min-h-14 font-display text-3xl font-bold uppercase leading-none text-white">
                {event.name}
              </h3>
              <p className="mt-3 text-xs text-white/50">
                {event.time} · {event.location}
              </p>
              <button
                onClick={() => navigate("/booking", { state: { event } })}
                className="mt-5 w-full rounded-xl bg-[#ff6b12] py-3 text-xs font-extrabold text-white hover:bg-[#e95b0c]"
              >
                ĐẶT VÉ NGAY →
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export default EventPage;
