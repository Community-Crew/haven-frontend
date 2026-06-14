import {publicApi} from "@/services/api.ts";

export const roomService = {
    getRooms: async (page?: number) => {
        const response = await publicApi.get(`/rooms?page=${page}`);
        return response.data;
    },

    getRoom: async (id: number) => {
        const response = await publicApi.get(`/rooms/${id}`);
        return response.data;
    }
}