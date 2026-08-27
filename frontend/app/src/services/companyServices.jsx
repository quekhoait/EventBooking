import Apis, { endpoints } from "../config/Apis";

const companyServices = {
  getCompanyByUserId: async (userId) => {
    const res = await Apis().get(endpoints.get_company_by_user(userId));
    return res.data;
  },

  getCompanyById: async (companyId) => {
    const res = await Apis().get(endpoints.get_company_detail(companyId));
    return res.data;
  },

  saveCompany: async (companyData) => {
    const res = await Apis().post(endpoints.save_company, companyData);
    return res.data;
  },

  getLocations: async () => {
    const res = await Apis().get(endpoints.get_locations);
    return res.data;
  },

  getLocationTree: async () => {
    const res = await Apis().get(endpoints.get_location_tree);
    return res.data;
  },
};

export default companyServices;