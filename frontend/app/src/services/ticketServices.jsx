import { Apis, endpoints } from "../config/Apis.jsx";

    export const ticketService = {
        createTicket: async (bookingData) => {
            console.log(bookingData)
            return await Apis().post(endpoints.create_ticket, bookingData);
        },

        createPayment: async(payload)=> {
            return await Apis().post(endpoints.create_payment, payload)
        }
    };