import { Apis, endpoints } from "../config/Apis.jsx";

    export const ticketService = {
        getTicket: async (code) => {
            return await Apis().get(endpoints.get_ticket_detail(code));
        },

        createTicket: async (bookingData) => {
            return await Apis().post(endpoints.create_ticket, bookingData);
        },

        createPayment: async(payload)=> {
            return await Apis().post(endpoints.create_payment, payload)
        }
    };