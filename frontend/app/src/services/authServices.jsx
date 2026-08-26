import { Apis, authApis, endpoints } from "../config/Apis.js"


export const authService = {
    loginWithEmail: async () => {
        return await Apis().get(endpoints.login_email); 
    },
}