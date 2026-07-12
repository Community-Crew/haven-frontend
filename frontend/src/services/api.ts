import axios, {type InternalAxiosRequestConfig} from "axios";
import {authState} from "@/services/keycloak.ts";
import router from "@/router"; // 🎯 1. Import your router instance
import {useProfileStore} from "@/stores/profile"; // 🎯 2. Import your profile store

export const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {'Content-Type': 'application/json'},
});

export const privateApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

privateApi.interceptors.request.use(
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

privateApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 401) {
            console.error('Unauthorized! The token might be invalid or expired.');
        }

        if (status === 403) {
            if (errorData?.errors === 'ACCOUNT_NOT_ACTIVATED') {
                console.warn('User account is not activated. Redirecting to activation screen...');

                const profileStore = useProfileStore();
                if (profileStore.profile) {
                    profileStore.profile.is_activated = false;
                }

                if (router.currentRoute.value.name !== 'user.activate') {
                    router.push({name: 'user.activate'});
                }
            } else {
                console.error('Permission Denied: You do not have the required role or access right for this.');
            }
        }
        return Promise.reject(error);
    }
);