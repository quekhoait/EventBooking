import axios from "axios";

export const endpoints = {
    'login_email': '/auth/login',
    'categories': '/data/categories',
};


// export const BASE_URL = process.env.BACKEND_API_URL;
export const BASE_URL = "http://localhost:8000/api";


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