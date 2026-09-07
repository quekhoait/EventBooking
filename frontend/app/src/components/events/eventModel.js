export const blankTicket = { id: 0, name: "", price: 0, capacity: 100, sold: 0 };

export const emptyEventForm = {
  name: "",
  description: "",
  image: "",
  category_id: "",
  category: "",
  location_id: "",
  location_name: "",
  venue: "",
  start_time: "",
  end_time: "",
  event_start_time: "",
  event_end_time: "",
  max_per_user: 5,
  status: "DRAFT",
  ticketTypes: [blankTicket],
};
