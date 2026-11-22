import {privateApi, publicApi} from "@/services/api.ts";
import type {RoomRules} from "@/types/room.ts";

export const roomService = {
    getRooms: async (page?: number) => {
        const response = await publicApi.get(`/rooms?page=${page}`);
        return response.data;
    },

    getRoom: async (slug: string) => {
        const response = await publicApi.get(`/rooms/${slug}`);
        return response.data;
    },

    getReservations: async (id: number, date?: string) => {
        const response = await privateApi.get(`/rooms/${id}/reservations`, {params: date ? {date} : {}});
        return response.data;
    },

    getWeeklySchedule: async (id: number): Promise<{ data: any; effective_today?: string }> => {
        const response = await privateApi.get(`/rooms/${id}/weekly-schedule`);
        return response.data;
    },

    getRules: async (id: number): Promise<RoomRules> => {
        const response = await privateApi.get(`/rooms/${id}/rules`);
        return response.data.data;
    }
}

/** The API refused because the current room rules weren't accepted. */
export const isRoomRulesError = (err: any): boolean => !!err?.response?.data?.errors?.rules_accepted_hash