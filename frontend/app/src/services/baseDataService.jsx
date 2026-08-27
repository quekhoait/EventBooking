import Apis, { endpoints } from "../config/Apis";



export const baseDataService = {
    getAllCategories: async () => {
        try {
            const response = await Apis().get('/data/categories');
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },
    
    getAllLocations: async () => {
        try {
            const response = await Apis().get('/data/locations');
            return response.data;
        } catch (error) {
            console.error('Error fetching locations:', error);
            throw error;
        }
    },
    
    getLocationTree: async () => {
        try {
            const response = await Apis().get('/data/locations/tree');
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
    }
};