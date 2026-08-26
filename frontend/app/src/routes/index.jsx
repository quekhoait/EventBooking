import HomePage from "../pages/HomePage";
import EventPage from "../pages/EventPage";
import BookingPage from "../pages/bookingPage";

export const routes = [
  { path: "/", name: "home", page: HomePage },
  { path: "/events", name: "events", page: EventPage },
  { path: "/booking", name: "booking", page: BookingPage },
  // { path: "/ticket", name: "ticket", page: DigitalTicketPage },
];

export default routes;
