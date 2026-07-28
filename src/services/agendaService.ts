import { publicApi } from "@/services/api.ts";

export const agendaService = {
    getAgendas: async (page?: number | string | null) => {
        const response = await publicApi.get('/agendas', {
            params: {
                page: page || undefined
            }
        });
        return response.data;
    },

    getAgenda: async (id: number) => {
        const response = await publicApi.get(`/agendas/${id}`);
        return response.data;
    }
}