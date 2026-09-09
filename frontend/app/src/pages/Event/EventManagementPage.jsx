import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EventForm from "../../components/events/EventForm";
import RevenueReport from "../../components/events/RevenueReport";
import DiscountEditor from "../../components/events/DiscountEditor";
import EventDetail from "../../components/events/EventDetail";
import EventModal from "../../components/events/EventModal";
import EventRow from "../../components/events/EventRow";
import { emptyEventForm } from "../../components/events/eventModel";
import { money, normalizeEventsResponse, statsFor } from "../../components/events/eventManagementUtils";
import { eventService } from "../../services/eventService";
import { baseDataService } from "../../services/baseDataService";
import { useCategories } from "../../hooks/useCategories";
import { useLocations } from "../../hooks/useLocations";
import { logError } from "../../utils/log";

async function loadCreatorEvents(creatorId) {
  const res = await eventService.getEventbyCreator(creatorId);
  return normalizeEventsResponse(res) || [];
}

function mapEventToForm(event) {
  if (!event?.id) return emptyEventForm;
  const seats = Array.isArray(event.event_seats) ? event.event_seats : [];
  return {
    ...event,
    location_name: event.location_name || event.venue || "",
    start_time: event.start_time || event.saleStart || "",
    end_time: event.end_time || event.saleEnd || "",
    event_start_time: event.event_start_time || event.startTime || "",
    event_end_time: event.event_end_time || event.endTime || "",
    ticketTypes: seats.length
      ? seats.map((seat) => ({
          id: seat.id || Date.now(),
          event_ticket_type_id: seat.event_ticket_type_id,
          name: "",
          price: Number(seat.price || 0),
          capacity: Number(seat.seat_total || 0),
          sold: 0,
        }))
      : event.ticketTypes || [],
  };
}

export default function EventManagementPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("events");
  const [loading, setLoading] = useState(true);

  // Form submit & error state ở cấp cha
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal states
  const [editorEvent, setEditorEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [discountEvent, setDiscountEvent] = useState(null);

  //   hooks
  const { categories, loading: loadingCategory, getCategoryId } = useCategories();
   const { flatLocations, loading: loadingLocations } = useLocations();
  const [ticketTypes, setTicketTypes] = useState([]);
  // 1. Tải danh sách sự kiện
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    loadCreatorEvents(user.id)
      .then((list) => {
        if (active) setEvents(list);
      })
      .catch((err) => console.error("Lỗi khi tải danh sách sự kiện:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Tải danh sách loại vé
  useEffect(() => {
    let active = true;
    baseDataService
      .getTicketTypes()
      .then((response) => {
        if (!active) return;
        const value = response?.data ?? response;
        const list = Array.isArray(value)
          ? value
          : Array.isArray(value?.data)
            ? value.data
            : [];
        setTicketTypes(list);
      })
      .catch((err) => console.error("Lỗi khi tải danh sách loại vé:", err));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadingCategory) {
      console.log("======= Categories đã tải xong:", categories);
    }
  }, [categories, loadingCategory]);

  // 2. Xử lý Lưu (Create / Update) ở cấp cha
  const handleSaveEvent = async (formData, eventId) => {
    const token = localStorage.getItem("access_token");
   console.log("handleSaveEvent" , Object.fromEntries(formData));
   
    try {
      setFormSubmitting(true);
      setFormError("");

      if (eventId) {
        if (eventService.updateEvent) {
          await eventService.updateEvent(eventId, formData, token);
        }
      } else {
        if (eventService.createEvent) {
          await eventService.createEvent(formData, token);
        }
      }

      // Đóng modal và tải lại dữ liệu mới nhất mà không f5 trang
      setEditorEvent(null);
      setEvents(await loadCreatorEvents(user.id));
} catch (err) {
      logError(err);
      const message = err.response?.data?.message || err.message || "Thao tác thất bại. Vui lòng thử lại!";
      setFormError(message);
      alert(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // 3. Tìm kiếm sự kiện theo từ khóa
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;

    return events.filter((e) => `${e.name || ""} ${e.category || ""} ${e.venue || ""}`.toLowerCase().includes(q));
  }, [events, query]);

  // 4. Thống kê tổng hợp
  const totals = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const stats = statsFor(event);
        return {
          sold: acc.sold + (stats.sold || 0),
          capacity: acc.capacity + (stats.capacity || 0),
          revenue: acc.revenue + (stats.revenue || 0),
        };
      },
      { sold: 0, capacity: 0, revenue: 0 },
    );
  }, [events]);

  // 5. Xóa sự kiện & các hành động trạng thái theo API
  const handleStatusAction = async (action, eventId, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const token = localStorage.getItem("access_token");
    try {
      setFormSubmitting(true);
      setFormError("");
      await action(eventId, token);
      setEditorEvent(null);
      setEvents(await loadCreatorEvents(user.id));
    } catch (err) {
      logError(err);
      const message = err.response?.data?.message || err.message || "Thao tác thất bại. Vui lòng thử lại!";
      alert(message)
      setFormError(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = (event) =>
    handleStatusAction(eventService.deleteEvent, event.id, `Bạn có chắc muốn xóa sự kiện "${event.name}"?`);

  const handlePublishEvent = (eventId) => handleStatusAction(eventService.publishEvent, eventId);

  const handleCancelEvent = (eventId) =>
    handleStatusAction(eventService.cancelEvent, eventId, "Bạn có chắc muốn hủy sự kiện này?");

  const handleRestoreEvent = (eventId) => handleStatusAction(eventService.restoreEvent, eventId);

  const handleEditEvent = async (event) => {
    setFormError("");
    try {
      const res = await eventService.getEventDetail(event.id);
      const body = res?.data ?? res;
      const detail = body?.data ?? body;
      setEditorEvent(detail ?? event);
    } catch (err) {
      logError(err);
      setFormError("Không thể tải chi tiết sự kiện. Vui lòng thử lại!");
      setEditorEvent(event);
    }
  };

  // 6. Xử lý mã giảm giá
  const handleSaveDiscount = (eventId, discount) => {
    setEvents((prev) =>
      prev.map((item) => (item.id === eventId ? { ...item, discounts: [...(item.discounts || []), discount] } : item)),
    );
    setDiscountEvent(null);
  };

  const handleRemoveDiscount = (eventId, discountId) => {
    setEvents((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? {
              ...item,
              discounts: (item.discounts || []).filter((d) => d.id !== discountId),
            }
          : item,
      ),
    );
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "ADMIN"].includes(String(user.role).toUpperCase())) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#0D0D0D] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          onCreate={() => {
            setFormError("");
            setEditorEvent({});
          }}
        />

        <SummaryCards eventsCount={events.length} totals={totals} />

        <ReportTabs tab={tab} setTab={setTab} query={query} setQuery={setQuery} eventCount={events.length} />

        {tab === "events" ? (
          <EventList
            events={filteredEvents}
            loading={loading}
            onOpen={setDetailEvent}
            onEdit={handleEditEvent}
            onAddDiscount={setDiscountEvent}
            onDelete={handleDeleteEvent}
          />
        ) : (
          <RevenueReport events={events} />
        )}

        <p className="mt-5 text-xs text-white/40">
          Nhấn vào event để xem chi tiết. Báo cáo hỗ trợ lọc theo ngày, tháng và năm.
        </p>
      </div>

      {/* Modal chỉnh sửa / tạo sự kiện */}
      {editorEvent && (
        <EventModal title={editorEvent.id ? "Sửa sự kiện" : "Tạo sự kiện"} onClose={() => setEditorEvent(null)}>
          <EventForm
            initialEvent={mapEventToForm(editorEvent)}
            submitting={formSubmitting}
            categories={categories}
            locations={flatLocations}
            ticketTypes={ticketTypes}
            error={formError}
            saveContext={{ userId: user?.id, companyId: user?.company_id }}
            onSave={handleSaveEvent}
            onCancel={() => setEditorEvent(null)}
            onPublish={handlePublishEvent}
            onCancelEvent={handleCancelEvent}
            onRestore={handleRestoreEvent}
            onDelete={handleDeleteEvent}
            catalogMode = {true}
          />
        </EventModal>
      )}

      {/* Modal giảm giá */}
      {discountEvent && (
        <DiscountEditor event={discountEvent} onSave={handleSaveDiscount} onClose={() => setDiscountEvent(null)} />
      )}

      {/* Modal chi tiết */}
      {detailEvent && (
        <EventDetail event={detailEvent} onRemoveDiscount={handleRemoveDiscount} onClose={() => setDetailEvent(null)} />
      )}
    </main>
  );
}

function PageHeader({ onCreate }) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <Link to="/profile" className="text-xs font-bold uppercase tracking-wider text-[#ff985c] hover:underline">
          ← Hồ sơ tổ chức
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.25em] text-[#ff985c]">Organizer command center</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold uppercase sm:text-7xl">Quản lý sự kiện</h1>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="rounded-xl bg-[#ff6b12] px-5 py-3 text-xs font-extrabold uppercase shadow-[4px_4px_0_#b94308] transition hover:brightness-110">
        + Tạo sự kiện
      </button>
    </header>
  );
}

function SummaryCards({ eventsCount, totals }) {
  const cards = [
    { label: "Sự kiện quản lý", value: eventsCount },
    { label: "Vé đã bán", value: totals.sold },
    { label: "Doanh thu", value: money(totals.revenue), accent: true },
    {
      label: "Tỷ lệ lấp đầy",
      value: totals.capacity ? `${((totals.sold / totals.capacity) * 100).toFixed(1)}%` : "0%",
      highlight: true,
    },
  ];

  return (
    <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-5 ${
            card.highlight ? "border-[#ff6b12]/40 bg-[#ff6b12]/10" : "border-white/10 bg-[#171717]"
          }`}>
          <small className="text-xs uppercase text-white/60">{card.label}</small>
          <p className={`mt-3 font-display ${card.accent ? "text-3xl text-[#ff985c]" : "text-4xl"}`}>{card.value}</p>
        </div>
      ))}
    </section>
  );
}

function ReportTabs({ tab, setTab, query, setQuery, eventCount }) {
  return (
    <div className="mb-4 flex flex-wrap justify-between gap-3">
      <div className="flex gap-5 border-b border-white/10">
        <button
          type="button"
          onClick={() => setTab("events")}
          className={`pb-3 text-xs font-bold uppercase transition ${
            tab === "events" ? "border-b-2 border-white text-white" : "text-white/50 hover:text-white"
          }`}>
          Sự kiện ({eventCount})
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`pb-3 text-xs font-bold uppercase transition ${
            tab === "reports" ? "border-b-2 border-[#ff985c] text-[#ff985c]" : "text-[#ff985c]/60 hover:text-[#ff985c]"
          }`}>
          Báo cáo doanh thu
        </button>
      </div>

      {tab === "events" && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm sự kiện..."
          className="rounded-xl border border-white/10 bg-[#171717] px-4 py-2.5 text-sm outline-none focus:border-[#ff985c]"
        />
      )}
    </div>
  );
}

function EventList({ events, loading, ...actions }) {
  if (loading) {
    return (
      <section className="rounded-2xl bg-[#F4F1EB] p-10 text-center text-sm font-medium text-[#8A8781]">
        Đang tải sự kiện...
      </section>
    );
  }

  if (!events.length) {
    return (
      <section className="rounded-2xl bg-[#F4F1EB] p-10 text-center text-sm font-medium text-[#8A8781]">
        Không tìm thấy sự kiện.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-[#F4F1EB] text-[#171717]">
      {events.map((event) => (
        <EventRow key={event.id} event={event} {...actions} />
      ))}
    </section>
  );
}
