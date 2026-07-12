import type {AgendaItem} from "@/types/agendaItem.ts";

export interface Agenda {
    id: number;
    slug: string;
    name: string;
    items: AgendaItem[];
}