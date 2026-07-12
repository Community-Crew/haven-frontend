export interface AgendaItem {
    id: number;
    title: string;
    description: string;
    short_description: string | null;
    image_url: string | null;
    start_date: string;
    end_date: string;
    host?: string;
}