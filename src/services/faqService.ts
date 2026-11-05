import {publicApi} from "@/services/api.ts";
import type {FaqCategory} from "@/types/faq.ts";

export const faqService = {
    // Public, edited by admins in Filament (Content → FAQ).
    getFaq: async (): Promise<FaqCategory[]> => {
        const response = await publicApi.get('/faq');
        return response.data.data;
    },
};
