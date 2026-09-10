import { useState } from "react";
import EventModal from "./EventModal";
import { money, statusLabel } from "./eventManagementUtils";
import { eventService } from "../../services/eventService";
import { ticketService } from "../../services/ticketServices";

export default function EventDetail({ event, onRemoveDiscount, onClose }) {
  const textValue = (value) => {
    if (value && typeof value === "object") {
      return value.name || value.label || value.title || value.code || "";
    }
    return value || "";
  };
  const [discounts, setDiscount] = useState([]);
  const eventName = textValue(event.name) || "Chi tiết sự kiện";
  const category = textValue(event.category || event.category_name);
  const status = textValue(event.status);
  const description = textValue(event.description);
  const date = textValue(event.date || event.event_start_time || event.start_time);
  const venue = textValue(event.venue || event.location_name || event.location);


  return (
    <EventModal title={eventName} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex gap-4">
          <img
            src={event.image}
            alt=""
            className="h-32 w-48 rounded-xl object-cover"
          />
          <div>
            <p className="font-bold uppercase text-[#E85B2A]">
              {category} · {statusLabel[status] || status}
            </p>
            <p className="mt-2 text-sm text-[#5F5C57]">{description}</p>
            <p className="mt-2 text-xs text-[#8A8781]">
              {date} · {venue}
            </p>
          </div>
        </div>
        <h3 className="font-display text-2xl uppercase">
          Discount của sự kiện
        </h3>
        {discounts.map((discount) => (
          <div
            key={discount.id}
            className="flex justify-between border-b border-[#D6D1C8] py-2 text-sm"
          >
            <strong>{textValue(discount.code)}</strong>
            <span>
              {discount.unit === "percentage" || discount.unit === "%"
                ? `${discount.value}%`
                : money(discount.value)}
            </span>
            <button
              type="button"
              onClick={() => onRemoveDiscount(event.id, discount.id)}
              className="text-xs font-bold text-red-500"
            >
              Xóa
            </button>
          </div>
        ))}
        {!discounts.length && (
          <p className="text-sm text-[#8A8781]">Chưa có discount.</p>
        )}
      </div>
    </EventModal>
  );
}
