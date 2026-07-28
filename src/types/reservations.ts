export interface Reservation {
    id: number;
    start_at: string;
    end_at: string;
    name: string;
    room_id: number;
    status?: string;
    organisation?: any;
    user_name?: string;
}

export interface ReservationPayload {
    room_id: number;
    name: string;
    start_at: string;
    end_at: string;
    share_name: boolean;
}

export interface ReservationQueryParams {
    status?: string;
    room_slug?: string;
    start_at?: string;
    end_at?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
}