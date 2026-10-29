import {privateApi} from "@/services/api.ts";
import type {
    PaginatedReservations,
    Reservation,
    ReservationCheck,
    ReservationPayload,
    ReservationQueryParams
} from "@/types/reservations.ts";

export const reservationService = {
    /**
     * Create a new room reservation
     */
    createReservation: async (payload: ReservationPayload): Promise<{
        success: boolean;
        data: ReservationPayload;
        message: string
    }> => {
        const response = await privateApi.post('/reservations', payload);
        return response.data;
    },

    /**
     * Fetch the current logged-in user's reservations
     */
    getMyReservations: async (params?: ReservationQueryParams): Promise<PaginatedReservations> => {
        const response = await privateApi.get('/reservations/me', {params: params});
        return response.data;
    },

    /**
     * Update a specific reservation's text meta details
     */
    updateReservation: async (id: number, payload: { name: string }): Promise<any> => {
        const response = await privateApi.put(`/reservations/${id}`, payload);
        return response.data;
    },

    /**
     * Cancel an existing booking slot
     */
    cancelReservation: async (id: number): Promise<any> => {
        const response = await privateApi.patch(`/reservations/${id}/cancel`);
        return response.data;
    },

    /**
     * Submit photo-verified check-in for a reservation (one or more photos)
     */
    checkIn: async (id: number, photos: File[]): Promise<{ message: string; data: ReservationCheck }> => {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos[]', photo));

        const response = await privateApi.post(`/reservations/${id}/check-in`, formData, {
            headers: {'Content-Type': undefined}
        });
        return response.data;
    },

    /**
     * Submit photo-verified check-out for a reservation (one or more photos)
     */
    checkOut: async (id: number, photos: File[]): Promise<{ message: string; data: ReservationCheck }> => {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos[]', photo));

        const response = await privateApi.post(`/reservations/${id}/check-out`, formData, {
            headers: {'Content-Type': undefined}
        });
        return response.data;
    },
};