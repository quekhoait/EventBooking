import axios from "axios";

export const endpoints = {
  login: "/auth/login",
  register: "/auth/register",
  verifyOtp: "/auth/verify-otp",
  resendOtp: "/auth/resend-otp",

  googleLogin: "/auth/google/login",
  googleCallback: "/auth/google/callback",

  refreshToken: "/auth/refresh_token",
  logout: "/auth/logout",
  me: "/auth/me",

  updateRole: "/auth/update-role",

  user_preferences: "/data/preferences",
  user_preference_detail: (categoryId) => `/data/preferences/${categoryId}`,

  categories: "/data/categories",
  get_event: `/events`,
  get_event_detail: (id) => `/events/${id}`,
  get_tickets: (id) => `/events/${id}/tickets`,
  get_ticket_detail: (code) => `/bookings/details/${code}`,
  create_ticket: "/bookings/create",
  create_payment: "/payments/create",

  // Company endpoints
  get_company_by_user: (userId) => `/data/company/user/${userId}`,
  save_company: "/data/company",
  get_locations: "/data/locations",
  get_location_tree: "/data/locations/tree",
};

<<<<<<< HEAD
export const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
=======
export const BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://127.0.0.1:8000/api";
>>>>>>> 85d4f31 (N20-80 [BE] Cập nhật thông tin cá nhân và khảo sát sở thích)

export const Apis = () => {
  return axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const authApis = (token) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export default Apis;
