import axios, {type InternalAxiosRequestConfig} from "axios";
import {authState} from "@/services/keycloak.ts";

export const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (authState.isAuthenticated && authState.token) {
            config.headers.Authorization = `Bearer ${authState.token}`
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) =>  response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized! The token might be invalid or expired.');
        }
        return Promise.reject(error);
    }
);

export default api;