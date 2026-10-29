export interface ReservationCheck {
    type: 'check_in' | 'check_out';
    verification_status: 'pending' | 'verified' | 'rejected';
    occurred_at: string;
    image_urls: string[];
    rejection_note: string | null;
}

export interface ReservationNote {
    body: string;
    created_at: string;
}

export interface Reservation {
    id: number;
    start_at: string;
    end_at: string;
    name: string;
    room_id: number;
    status?: string;
    organisation?: any;
    user_name?: string;
    checks?: ReservationCheck[];
    notes?: ReservationNote[];
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

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedReservations {
    data: Reservation[];
    meta: PaginationMeta;
}