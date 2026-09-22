import { Apis, endpoints } from "../config/Apis.jsx";

    export const ticketService = {
        getTicket: async (code) => {
            return await Apis().get(endpoints.get_ticket_detail(code));
        },

        getOrganizerTickets: async (code) => {
            return await Apis().get(endpoints.get_organizer_tickets(code));
        },

        checkinOrganizerTicket: async (code) => {
            return await Apis().post(endpoints.checkin_organizer_ticket(code));
        },

        createTicket: async (bookingData) => {
            return await Apis().post(endpoints.create_ticket, bookingData);
        },

        getTicketByUserId: async()=>{
            return await Apis().get(endpoints.get_ticket_by_userId)
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