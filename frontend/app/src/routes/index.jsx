import HomePage from "../pages/HomePage";
import EventPage from "../pages/EventPage";
import BookingPage from "../pages/bookingPage";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import PreferencePage from "../pages/Auth/PreferencePage";
import UserProfilePage from "../pages/User/UserProfilePage";
import CompanyProfilePage from "../pages/User/CompanyProfilePage";
import LoginCallbackPage from "../pages/Auth/LoginCallbackPage";
import { PreviewTicket } from "../pages/PreviewTicket";
import SelectPreferencesPage from "../pages/Auth/SelectPreferencesPage";
import RegisterCompanyPage from "../pages/User/RegisterCompanyPage";
import CreateEventPage from "../pages/Event/CreateEventPage";
import EventManagementPage from "../pages/Event/EventManagementPage";
import { CheckinPage } from "../pages/Event/CheckinPage";
import EventDetail from "../components/events/EventDetail";
import OrganizerChatPage from "../pages/organizer/OrganizerChatPage";
export const routes = [
  { path: "/", name: "home", page: HomePage },
  { path: "/events", name: "events", page: EventPage },
  { path: "/events/create", name: "create-event", page: CreateEventPage },
  {
    path: "/dashboard/organizer",
    name: "organizer-events",
    page: EventManagementPage,
  },
  { path: "/dashboard/checkin", name: "checkin-events", page: CheckinPage },
  { path: "/booking", name: "booking", page: BookingPage },
  // Auth routes
  { path: "/login", name: "login", page: LoginPage },
  { path: "/register", name: "register", page: RegisterPage },
  { path: "/preference", name: "preference", page: PreferencePage },
  {
    path: "/auth/google/callback",
    name: "google-callback",
    page: LoginCallbackPage,
  },
  {
    path: "/select-preferences",
    name: "select-preferences",
    page: SelectPreferencesPage,
  },
  // User routes
  { path: "/profile", name: "profile", page: UserProfilePage },
  {
    path: "/company",
    name: "company",
    page: CompanyProfilePage,
  },
  {
    path: "/register-company",
    name: "register-company",
    page: RegisterCompanyPage,
  },
  { path: "/ticket", name: "ticket", page: PreviewTicket },
  {
    path: "/dashboard/organizer/events/:eventId",
    name: "event-detail",
    page: EventDetail,
  },
  {
    path: "/dashboard/organizer/events/:eventId/chat",
    name: "organizer-chat",
    page: OrganizerChatPage,
  },
];

export default routes;
