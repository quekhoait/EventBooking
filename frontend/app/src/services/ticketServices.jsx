import { data } from "react-router-dom";
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
        },

        createDiscount: async(payload)=>{
            return await Apis().post(endpoints.discount, payload)
        },

        getDiscount: async ({ code, event_id }) => {
            return await Apis().get(endpoints.discount, {
                params: { code, event_id },
            });
        },
    };