import Apis, { endpoints } from "../config/Apis";



export const baseDataService = {
    getAllCategories: async () => {
        try {
            const response = await Apis().get(endpoints.categories);
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },
    
    getAllLocations: async () => {
        try {
            const response = await Apis().get(endpoints.get_locations);
            return response.data;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw error;
        }
    },
    
    getLocationTree: async () => {
        try {
            const response = await Apis().get(endpoints.get_location_tree);
            return response.data;
        } catch (error) {
            console.error('Error fetching location tree:', error);
            throw error;
        }
    },
    
    getLocationDetail: async (locationId) => {
        try {
            const response = await Apis().get(`/data/locations/${locationId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching location detail:', error);
            throw error;
        }
    },

    getTicketTypes: async () => {
        try {
            const response = await Apis().get(endpoints.ticket_types);
            return response.data;
        } catch (error) {
            console.error('Error fetching ticket types:', error);
            throw error;
        }
    }
};