import Apis from "../config/Apis";
import { endpoints } from "../config/Apis";
const authService = {
  register: async (data) => {
    const response = await Apis().post("/auth/register", data);
    return response.data;
  },

  verifyOtp: async ({ email, verification_code }) => {
    const res = await Apis().post("/auth/verify-otp", {
      email,
      verification_code,
    });
    return res.data;
  },

  resendOtp: async ({ email }) => {
    const res = await Apis().post("/auth/resend-otp", { email });
    return res.data;
  },

  login: async (data) => {
    const response = await Apis().post("/auth/login", data);
    return response.data;
  },

  googleLogin: async () => {
    const response = await Apis().get("/auth/google/login");
    return response.data;
  },

  googleCallback: async (data) => {
    const response = await Apis().post("/auth/google/callback", data);
    return response.data;
  },

  updateRole: async ({ userId, role }) => {
    const payload = {
      user_id: String(userId),
      role: String(role).trim().toUpperCase(),
    };
    console.log("[DEBUG] Sending payload to /api/auth/update-role:", payload);
    return await Apis().post(endpoints.updateRole, payload);
  },

  refreshToken: async () => {
    const response = await Apis().post("/auth/refresh_token");
    return response.data;
  },

  logout: async () => {
    const response = await Apis().post("/auth/logout");
    return response.data;
  },
};

export default authService;
