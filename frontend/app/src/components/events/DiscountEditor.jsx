import { useState } from "react";
import EventModal from "./EventModal";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#D6D1C8] bg-white px-3 py-2.5 text-sm";
const initialForm = {
  code: "",
  value: 10,
  unit: "%",
  start_time: "",
  end_time: "",
};

export default function DiscountEditor({ event, onSave, onClose }) {
  const [form, setForm] = useState(initialForm);
  const update = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  const submit = (submitEvent) => {
    submitEvent.preventDefault();
    onSave(event.id, {
      ...form,
      id: Date.now(),
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      event_id: event.id,
      used: 0,
      limit: 0,
    });
  };

  return (
    <EventModal title="Thêm discount" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-[#5F5C57]">
          Áp dụng cho: <strong>{event.name}</strong>
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs font-bold uppercase">
            Mã
            <input
              required
              maxLength="50"
              value={form.code}
              onChange={(e) => update("code", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-bold uppercase">
            Giá trị
            <input
              required
              type="number"
              min="0"
              value={form.value}
              onChange={(e) => update("value", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-bold uppercase">
            Đơn vị
            <select
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
              className={inputClass}
            >
              <option value="%">Phần trăm (%)</option>
              <option value="vnd">Số tiền (VNĐ)</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase">
            Event ID
            <input
              disabled
              value={event.id}
              className={`${inputClass} bg-[#EAE6DF]`}
            />
          </label>
          <label className="text-xs font-bold uppercase">
            Bắt đầu
            <input
              required
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="text-xs font-bold uppercase">
            Kết thúc
            <input
              required
              type="datetime-local"
              min={form.start_time || undefined}
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#D6D1C8] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-3 text-xs font-bold uppercase"
          >
            Hủy
          </button>
          <button className="rounded-xl bg-[#ff6b12] px-5 py-3 text-xs font-bold uppercase text-white">
            Thêm discount
          </button>
        </div>
      </form>
    </EventModal>
  );
}
