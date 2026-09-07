// src/services/eventService.js

import Apis, { endpoints } from "../config/Apis.jsx";

export const eventService = {
    // Lấy danh sách sự kiện với filter và phân trang
    getEvents: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();
            
            // Thêm các params filter
            if (params.page) queryParams.append('page', params.page);
            if (params.page_size) queryParams.append('page_size', params.page_size);
            if (params.keyword) queryParams.append('keyword', params.keyword);
            if (params.category_id) queryParams.append('category_id', params.category_id);
            if (params.company_id) queryParams.append('company_id', params.company_id);
            if (params.location_id) queryParams.append('location_id', params.location_id);
            if (params.event_from_date) queryParams.append('event_from_date', params.event_from_date);
            if (params.event_to_date) queryParams.append('event_to_date', params.event_to_date);
            
            const url = `/events?${queryParams.toString()}`;
            console.log('📤 Calling API:', url);
            
            const response = await Apis().get(url);
            console.log('📥 API Response:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching events:', error);
            console.error('Response:', error.response?.data);
            throw error;
        }
    },
    
    // Lấy chi tiết sự kiện
    getEventDetail: async (eventId) => {
        return await Apis().get(endpoints.get_event_detail(eventId));
    },    

    getTicketsType: async (id)=> {
        return await Apis().get(endpoints.get_tickets(id))
    },
    getEventbyCreator: async (creatorId) => {
       return await Apis().get(endpoints.get_event_by_creator(creatorId))
    },
    createEvent: async (eventData, token) => {
        return await Apis().post(endpoints.create_event, eventData, {
            headers: {
                "Content-Type": "multipart/form-data",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    },
    updateEvent: async (eventId, eventData, token) => {
        return await Apis().put(endpoints.get_event_detail(eventId), eventData, {
            headers: {
                "Content-Type": "multipart/form-data",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    },
    deleteEvent: async (eventId) => {
        return await Apis().delete(endpoints.get_event_detail(eventId));
    },
}