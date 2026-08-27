import axios from "axios";

export const endpoints = {
       'get_event': `/events`,
       'get_event_detail': (id) => `/events/${id}`,
       'get_tickets': (id)=> `/events/${id}/tickets`,
        get_ticket_detail: (code) => `/bookings/details/${code}`,
       'create_ticket': '/bookings/create',
       'create_payment': '/payments/create'
};

export const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

export const Apis = () => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        }
    });
};

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
};

export default Apis;