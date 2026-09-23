import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { money, statusLabel } from "./eventManagementUtils";
import { eventService } from "../../services/eventService";

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEventDetail = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        setError("");

        console.log("===== GET EVENT DETAIL =====");
        console.log("eventId:", eventId);

        const response = await eventService.getEventDetail(eventId);

        console.log("RAW EVENT DETAIL:", response);

        const body = response?.data ?? response;
        const detail = body?.data ?? body;

        console.log("EVENT DETAIL:", detail);

        if (!detail?.id) {
          throw new Error("Không tìm thấy thông tin sự kiện.");
        }

        setEvent(detail);
      } catch (err) {
        console.error("Lỗi lấy chi tiết sự kiện:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải chi tiết sự kiện."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEventDetail();
  }, [eventId]);

  const textValue = (value) => {
    if (value && typeof value === "object") {
      return (
        value.name ||
        value.label ||
        value.title ||
        value.code ||
        ""
      );
    }

    return value || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-[#171717]">
        <header className="border-b border-[#D6D1C8] bg-[#F7F4EE]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8781]">
                Quản lý sự kiện
              </p>

              <h1 className="mt-1 font-display text-2xl font-bold uppercase">
                Chi tiết sự kiện
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-[#D6D1C8] bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-[#EEEAE2]"
            >
              ← Quay lại
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-medium text-[#8A8781]">
              Đang tải thông tin sự kiện...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-[#171717]">
        <header className="border-b border-[#D6D1C8] bg-[#F7F4EE]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8781]">
                Quản lý sự kiện
              </p>

              <h1 className="mt-1 font-display text-2xl font-bold uppercase">
                Chi tiết sự kiện
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-[#D6D1C8] bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-[#EEEAE2]"
            >
              ← Quay lại
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-red-500">
              {error || "Không tìm thấy sự kiện."}
            </p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 rounded-xl bg-[#171717] px-5 py-2.5 text-sm font-bold text-white"
            >
              Quay lại danh sách
            </button>
          </div>
        </main>
      </div>
    );
  }

  const eventName =
    textValue(event.name) || "Chi tiết sự kiện";

  const category = textValue(
    event.category || event.category_name
  );

  const status = textValue(event.status);

  const description =
    textValue(event.description) || "Chưa có mô tả.";

  const date = textValue(
    event.date ||
      event.event_start_time ||
      event.start_time
  );

  const venue = textValue(
    event.venue ||
      event.location_name ||
      event.location
  );

  const image =
    event.image ||
    "https://via.placeholder.com/800x400?text=Event";

  const discounts = Array.isArray(event.discounts)
    ? event.discounts
    : Array.isArray(event.discount)
      ? event.discount
      : [];

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#171717]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#D6D1C8] bg-[#F7F4EE]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A8781]">
              Quản lý sự kiện
            </p>

            <h1 className="mt-1 font-display text-2xl font-bold uppercase">
              Chi tiết sự kiện
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-[#D6D1C8] bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-[#EEEAE2]"
          >
            ← Quay lại
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1.3fr_1fr]">
            {/* Image */}
            <div className="min-h-[320px] bg-[#E9E5DD]">
              <img
                src={image}
                alt={eventName}
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>

            {/* Information */}
            <div className="flex flex-col justify-center p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                {category && (
                  <span className="rounded-full bg-[#FFF0E8] px-3 py-1 text-xs font-bold uppercase text-[#E85B2A]">
                    {category}
                  </span>
                )}

                <span className="rounded-full bg-[#F1EFEB] px-3 py-1 text-xs font-bold uppercase text-[#5F5C57]">
                  {statusLabel[status] ||
                    status ||
                    "Chưa xác định"}
                </span>
              </div>

              <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-tight">
                {eventName}
              </h2>

              <p className="mt-5 text-sm leading-7 text-[#5F5C57]">
                {description}
              </p>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="w-28 font-bold">
                    Thời gian
                  </span>

                  <span className="text-[#5F5C57]">
                    {date || "Chưa cập nhật"}
                  </span>
                </div>

                <div className="flex gap-3">
                  <span className="w-28 font-bold">
                    Địa điểm
                  </span>

                  <span className="text-[#5F5C57]">
                    {venue || "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event information */}
        <section className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="ID sự kiện"
              value={event.id || "—"}
            />

            <InfoCard
              label="Danh mục"
              value={category || "—"}
            />

            <InfoCard
              label="Trạng thái"
              value={
                statusLabel[status] ||
                status ||
                "—"
              }
            />

            <InfoCard
              label="Người tạo"
              value={
                textValue(event.creator) ||
                event.creator_id ||
                "—"
              }
            />
          </div>
        </section>

        {/* Discount */}
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8A8781]">
                Khuyến mãi
              </p>

              <h3 className="mt-1 font-display text-2xl font-bold uppercase">
                Discount của sự kiện
              </h3>
            </div>

            <span className="rounded-full bg-[#F1EFEB] px-3 py-1 text-xs font-bold">
              {discounts.length} discount
            </span>
          </div>

          <div className="mt-6">
            {discounts.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#D6D1C8]">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="flex flex-col gap-4 border-b border-[#D6D1C8] p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold">
                        {textValue(discount.code) ||
                          "Không có mã"}
                      </p>

                      {discount.name && (
                        <p className="mt-1 text-sm text-[#8A8781]">
                          {textValue(discount.name)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-5">
                      <span className="font-bold text-[#E85B2A]">
                        {discount.unit === "percentage" ||
                        discount.unit === "%"
                          ? `${discount.value}%`
                          : money(discount.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#F4F1EB] p-8 text-center">
                <p className="text-sm font-medium text-[#8A8781]">
                  Chưa có discount.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Other information */}
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8A8781]">
            Thông tin khác
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow
              label="Company ID"
              value={event.company_id}
            />

            <InfoRow
              label="Category ID"
              value={event.category_id}
            />

            <InfoRow
              label="Location ID"
              value={event.location_id}
            />

            <InfoRow
              label="Creator ID"
              value={event.creator_id}
            />

            <InfoRow
              label="Số lượng tối đa / người"
              value={event.max_per_user}
            />

            <InfoRow
              label="Ngày bắt đầu"
              value={
                event.event_start_time ||
                event.start_time
              }
            />

            <InfoRow
              label="Ngày kết thúc"
              value={
                event.event_end_time ||
                event.end_time
              }
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8A8781]">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F4F1EB] p-4">
      <p className="text-xs font-bold text-[#8A8781]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value ?? "—"}
      </p>
    </div>
  );
}