import { Apis, endpoints } from "../config/Apis.jsx";

export const ticketService = {
    createTicket: async (bookingData) => {
        return await Apis().post(endpoints.create_ticket, bookingData);
    },

    createPayment: async(payload)=> {
        return await Apis().post(endpoints.create_payment, payload)
    }
};