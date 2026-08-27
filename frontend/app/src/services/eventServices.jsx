
import { Apis, authApis, endpoints } from "../config/Apis.jsx"


export const eventServices = {
    getEvents: async () => {
        return await Apis().get(endpoints.get_event); 
    },

    getEventDetail: async (id)=> {
        return await Apis().get(endpoints.get_event_detail(id))
    },

    getTicketsType: async (id)=> {
        return await Apis().get(endpoints.get_tickets(id))
    }
}