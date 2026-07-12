import {privateApi, publicApi} from "@/services/api.ts";

export const roomService = {
    getRooms: async (page?: number) => {
        const response = await publicApi.get(`/rooms?page=${page}`);
        return response.data;
    },

    getRoom: async (slug: string) => {
        const response = await publicApi.get(`/rooms/${slug}`);
        return response.data;
    },

    getReservations: async (id: number) => {
        const response = await privateApi.get(`/rooms/${id}/reservations`);
        return response.data;
    },

    getWeeklySchedule: async (id: number): Promise<{ data: any }> => {
        const response = await privateApi.get(`/rooms/${id}/weekly-schedule`);
        return response.data;
    }
}