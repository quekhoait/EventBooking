export const statusLabel = {
  PUBLISHED: "Đang bán",
  SOLD_OUT: "Hết vé",
  DRAFT: "Bản nháp",
};

export const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export const statsFor = (event) => (event.ticketTypes || []).reduce(
  (result, ticket) => ({
    sold: result.sold + Number(ticket.sold || 0),
    capacity: result.capacity + Number(ticket.capacity || 0),
    revenue: result.revenue + Number(ticket.sold || 0) * Number(ticket.price || 0),
  }),
  { sold: 0, capacity: 0, revenue: 0 },
);

export const normalizeEventsResponse = (response) => {
  const value = response?.data ?? response;
  const list = Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
  const textValue = (value) => {
    if (value && typeof value === "object") return value.name || value.label || "";
    return value || "";
  };
  return list.map((event) => ({
    ...event,
    category: textValue(event.category || event.category_name),
    venue: textValue(event.venue || event.location_name || event.location),
    location_name: textValue(event.location_name || event.location),
    ticketTypes: (event.ticketTypes || event.ticket_types || []).map((ticket) => ({
      ...ticket,
      name: textValue(ticket.name || ticket.ticket_type),
    })),
    discounts: event.discounts || [],
  }));
};
