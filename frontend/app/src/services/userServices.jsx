import { Apis, endpoints } from "../config/Apis";

export const userService = {
  updateProfile: async (profileData) => {
    const response = await Apis().patch(endpoints.update_profile, profileData);
    return response.data;},
};
