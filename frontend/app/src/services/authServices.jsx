import Apis from "../config/Apis";
import { endpoints } from "../config/Apis";
const authService = {
  register: async (data) => {
    const response = await Apis().post(endpoints.register, data);
    return response.data;
  },

  verifyOtp: async ({ email, verification_code }) => {
    const res = await Apis().post(endpoints.verifyOtp, {
      email,
      verification_code,
    });
    return res.data;
  },

  resendOtp: async ({ email }) => {
    const res = await Apis().post(endpoints.resendOtp, { email });
    return res.data;
  },

  login: async (data) => {
    const response = await Apis().post(endpoints.login, data);

    console.log("[DEBUG] Login response:", response.data); // Debugging line
    return response.data;
  },

  googleLogin: async () => {
    const response = await Apis().get(endpoints.googleLogin);
    console.log("[DEBUG] Google login response:", response.data); // Debugging line
    return response.data;
  },

  googleCallback: async (data) => {
    const response = await Apis().post(endpoints.googleCallback, data);
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
    const response = await Apis().post(endpoints.refreshToken);
    return response.data;
  },

  logout: async () => {
    const response = await Apis().post(endpoints.logout);
    return response.data;
  },

  getUserPreferences: async (userId) => {
    const response = await Apis().get(endpoints.user_preferences, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Cập nhật toàn bộ sở thích (ghi đè)
  updatePreferences: async ({ userId, categoryIds }) => {
    const response = await Apis().post(endpoints.user_preferences, {
      user_id: userId,
      category_ids: categoryIds,
    });
    return response.data;
  },

  // Xóa 1 sở thích
  deletePreference: async (categoryId, userId) => {
    const response = await Apis().delete(
      `${endpoints.user_preference_detail(categoryId)}?user_id=${userId}`,
    );
    return response.data;
  },
};

export default authService;
