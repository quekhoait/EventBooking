import { useState } from "react";
import ImageDropzone from "../common/ImageDropzone";
import { blankTicket, emptyEventForm } from "./eventModel";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#D6D1C8] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#E85B2A]";

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`block text-xs font-bold uppercase ${className}`}>
      <span>
        {label} {required && <b className="text-[#E85B2A]">*</b>}
      </span>
      {children}
    </label>
  );
}

export default function EventForm({
  initialEvent = emptyEventForm,
  categories = [],
  locations = [],
  ticketTypes = [],
  loadingData = false,
  submitting = false,
  error: externalError = "",
  onSave,
  onCancel,
  onPublish,
  onCancelEvent,
  onRestore,
  onDelete,
  saveContext = {},
  catalogMode = false,
}) {
  const initEvent = {
    name: "",
    category_id: "",
    category: "",
    location_id: "",
    location_name: "",
    venue: "",
    image: null,
    description: "",
    start_time: "",
    end_time: "",
    event_start_time: "",
    event_end_time: "",
    max_per_user: 1,
    status: "DRAFT",
    ticketTypes: [blankTicket],
    ...initialEvent,
  };

  const [form, setForm] = useState(initEvent);
  const [internalError, setInternalError] = useState("");

  const error = externalError || internalError;

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addTicket = () => {
    const newTicket = blankTicket
      ? { ...blankTicket, id: Date.now() }
      : { id: Date.now(), name: "", price: 0, capacity: 50 };

    setForm((prev) => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, newTicket],
    }));
  };

  const updateTicket = (ticketId, key, value) => {
    setForm((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              [key]: key === "price" || key === "capacity" ? Number(value) : value,
            }
          : ticket,
      ),
    }));
  };

  const removeTicket = (ticketId) => {
    setForm((prev) => {
      if (prev.ticketTypes.length <= 1) return prev;
      return {
        ...prev,
        ticketTypes: prev.ticketTypes.filter((t) => t.id !== ticketId),
      };
    });
  };

  const isEditing = Boolean(form.id);

  const validateForm = (targetStatus) => {
    if (!form.name?.trim()) return "Vui lòng nhập tên sự kiện";
    const nameLength = form.name.trim().length;
    if (nameLength < 5 || nameLength > 100) return "Tên sự kiện phải từ 5 đến 100 ký tự";
    if (targetStatus !== "PUBLISHED") return null;

    if (catalogMode && !form.category_id) return "Vui lòng chọn danh mục";
    if (!catalogMode && !form.category?.trim()) return "Vui lòng nhập danh mục";
    if (catalogMode && !form.location_id) return "Vui lòng chọn địa điểm";
    if (!catalogMode && !form.location_name?.trim()) return "Vui lòng nhập địa điểm";
    if (!form.image) return "Vui lòng thêm ảnh sự kiện";
    if (!form.start_time) return "Vui lòng chọn thời gian mở bán vé";
    if (!form.end_time) return "Vui lòng chọn thời gian đóng bán vé";
    if (!form.event_start_time) return "Vui lòng chọn thời gian bắt đầu sự kiện";
    if (!form.event_end_time) return "Vui lòng chọn thời gian kết thúc sự kiện";

    for (const t of form.ticketTypes) {
      if (!t.event_ticket_type_id) return "Vui lòng chọn loại vé cho tất cả vé";
      if (t.price < 0 || isNaN(t.price)) return "Giá vé không hợp lệ";
      if (!t.capacity || t.capacity <= 0) return "Số lượng vé phải lớn hơn 0";
    }

    return null;
  };

  const handleSaveClick = (targetStatus) => {
    const validationError = validateForm(targetStatus);
    if (validationError) {
      setInternalError(validationError);
      return;
    }
    setInternalError("");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;

      if (key === "image") {
        if (value instanceof File || value instanceof Blob) {
          formData.append("image", value);
        } else if (typeof value === "string" && value.startsWith("data:")) {
          const [metadata, encoded] = value.split(",");
          const mime = metadata.match(/data:(.*?);/)?.[1] || "image/jpeg";
          const binary = atob(encoded);
          const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
          formData.append("image", new File([bytes], "event-image.jpg", { type: mime }));
        }
      } else if (key === "ticketTypes") {
        const eventSeats = value
          .filter((t) => t.event_ticket_type_id)
          .map((t) => ({
            event_ticket_type_id: Number(t.event_ticket_type_id),
            seat_total: Number(t.capacity),
            price: Number(t.price),
          }));
        formData.append("event_seats", JSON.stringify(eventSeats));
      } else {
        formData.append(key, value);
      }
    });

    if (saveContext.companyId !== undefined) formData.set("company_id", saveContext.companyId ?? "");
    if (saveContext.userId !== undefined) formData.set("user_id", saveContext.userId);

    if (targetStatus) formData.set("status", targetStatus);

    ["start_time", "end_time", "event_start_time", "event_end_time"].forEach((key) => {
      if (form[key]) {
        const raw = String(form[key]);
        formData.set(key, raw.length === 16 ? `${raw}:00` : raw);
      }
    });
    if (onSave) {
      onSave(formData, form.id);
    }
  };

  return (
    <div className="space-y-6 text-[#171717]">
      <div className="grid gap-4 md:grid-cols-2">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 md:col-span-2">
            {error}
          </div>
        )}

        <Field label="Tên sự kiện" required className="md:col-span-2">
          <input
            disabled={submitting}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Danh mục" required>
          {catalogMode ? (
            <select
              disabled={loadingData || submitting}
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
              className={inputClass}>
              <option value="">Chọn danh mục</option>
              {categories
                .filter((item) => item.id !== null)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          ) : (
            <input
              disabled={submitting}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Địa điểm / tỉnh thành" required>
          {catalogMode ? (
            <select
              disabled={loadingData || submitting}
              value={form.location_id || ""}
              onChange={(e) => update("location_id", e.target.value)}
              className={inputClass}>
              <option value="">Chọn địa điểm</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name || item.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              disabled={submitting}
              value={form.location_name || ""}
              onChange={(e) => update("location_name", e.target.value)}
              className={inputClass}
            />
          )}
        </Field>

        <Field label="Địa điểm cụ thể">
          <input
            disabled={submitting}
            value={form.venue || ""}
            onChange={(e) => update("venue", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Ảnh sự kiện">
          <ImageDropzone value={form.image} onChange={(value) => update("image", value)} disabled={submitting} />
        </Field>

        <Field label="Mô tả" required className="md:col-span-2">
          <textarea
            rows="4"
            disabled={submitting}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="border-t border-[#D6D1C8] pt-5">
        <h3 className="mb-4 font-display text-2xl uppercase">Lịch trình & trạng thái</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mở bán vé" required>
            <input
              type="datetime-local"
              disabled={submitting}
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Đóng bán vé" required>
            <input
              type="datetime-local"
              disabled={submitting}
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sự kiện bắt đầu" required>
            <input
              type="datetime-local"
              disabled={submitting}
              value={form.event_start_time}
              onChange={(e) => update("event_start_time", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sự kiện kết thúc" required>
            <input
              type="datetime-local"
              disabled={submitting}
              value={form.event_end_time}
              onChange={(e) => update("event_end_time", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Giới hạn vé / người">
            <input
              type="number"
              min="1"
              disabled={submitting}
              value={form.max_per_user}
              onChange={(e) => update("max_per_user", Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-[#D6D1C8] pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl uppercase">Loại vé</h3>
          <button
            type="button"
            onClick={addTicket}
            className="rounded-lg bg-[#171717] px-3 py-2 text-[11px] font-bold uppercase text-white hover:bg-black">
            + Thêm loại vé
          </button>
        </div>
        <div className="space-y-3">
          {form.ticketTypes.map((ticket) => (
            <div
              key={ticket.id}
              className="grid gap-2 rounded-xl border border-[#D6D1C8] bg-white p-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
              <Field label="Loại vé" required>
                <select
                  value={ticket.event_ticket_type_id || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    const selected = ticketTypes.find((item) => String(item.id) === String(id));
                    updateTicket(ticket.id, "event_ticket_type_id", selected ? selected.id : "");
                    updateTicket(ticket.id, "name", selected ? selected.name : "");
                  }}
                  className={inputClass}>
                  <option value="">Chọn loại vé</option>
                  {ticketTypes
                    .filter((item) => item.id !== null)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Giá (VNĐ)" required>
                <input
                  type="number"
                  min="0"
                  value={ticket.price}
                  onChange={(e) => updateTicket(ticket.id, "price", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Số lượng" required>
                <input
                  type="number"
                  min={ticket.sold || 0}
                  value={ticket.capacity}
                  onChange={(e) => updateTicket(ticket.id, "capacity", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <button
                type="button"
                onClick={() => removeTicket(ticket.id)}
                className="px-2 py-3 text-xs font-bold text-red-500 hover:text-red-700">
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#D6D1C8] pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-3 text-xs font-bold uppercase text-[#5F5C57] hover:bg-[#eae6df]">
          Hủy
        </button>

        {!isEditing && (
          <button
            type="button"
            onClick={() => handleSaveClick("PUBLISHED")}
            disabled={submitting || loadingData}
            className="rounded-xl bg-[#171717] px-5 py-3 text-xs font-bold uppercase text-white hover:bg-black disabled:opacity-60">
            {submitting ? "ĐANG LƯU..." : "Tạo & Xuất bản"}
          </button>
        )}

        {isEditing && form.status === "DRAFT" && onPublish && (
          <button
            type="button"
            onClick={() => onPublish(form.id)}
            disabled={submitting}
            className="rounded-xl bg-[#171717] px-5 py-3 text-xs font-bold uppercase text-white hover:bg-black disabled:opacity-60">
            {submitting ? "ĐANG XỬ LÝ..." : "Xuất bản"}
          </button>
        )}

        {isEditing && form.status === "CANCELLED" && onRestore && (
          <button
            type="button"
            onClick={() => onRestore(form.id)}
            disabled={submitting}
            className="rounded-xl bg-[#171717] px-5 py-3 text-xs font-bold uppercase text-white hover:bg-black disabled:opacity-60">
            {submitting ? "ĐANG XỬ LÝ..." : "Khôi phục"}
          </button>
        )}

        {isEditing && form.status !== "CANCELLED" && onCancelEvent && (
          <button
            type="button"
            onClick={() => onCancelEvent(form.id)}
            disabled={submitting}
            className="rounded-xl border border-[#D6D1C8] bg-white px-5 py-3 text-xs font-bold uppercase text-[#171717] hover:bg-[#eae6df] disabled:opacity-60">
            {submitting ? "ĐANG XỬ LÝ..." : "Hủy sự kiện"}
          </button>
        )}

        {isEditing && form.status === "DRAFT" && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(form.id)}
            disabled={submitting}
            className="rounded-xl border border-red-200 px-5 py-3 text-xs font-bold uppercase text-red-500 hover:bg-red-50 disabled:opacity-60">
            Xóa
          </button>
        )}

        {(!isEditing || form.status === "DRAFT" || form.status === "PUBLISHED") && (
          <button
            type="button"
            onClick={() => handleSaveClick(isEditing ? form.status : "DRAFT")}
            disabled={submitting || loadingData}
            className="rounded-xl bg-[#ff6b12] px-5 py-3 text-xs font-bold uppercase text-white hover:brightness-110 disabled:opacity-60">
            {submitting
              ? "ĐANG LƯU..."
              : !isEditing
                ? "Lưu nháp"
                : "Lưu thay đổi"}
          </button>
        )}
      </div>
    </div>
  );
}
