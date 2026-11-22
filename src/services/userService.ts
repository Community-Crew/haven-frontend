import {privateApi} from './api.ts';
import type {UserSettings} from '@/types/userSettings.ts';

export interface MembershipDocument {
    id: number;
    content: string;
}

export interface MembershipDocuments {
    statutes: MembershipDocument | null;
    rules: MembershipDocument | null;
}

export interface PostalAddress {
    line: string;
    postal_code: string;
    city: string;
    country: string;
}

export interface MembershipApplication {
    phone: string;
    birth_date: string;
    postal_address?: PostalAddress;
    statutes_document_id: number;
    rules_document_id: number;
    documents_accepted: boolean;
}

export const userService = {
    getCurrentUser: async () => {
        const response = await privateApi.get('/user');

        return response.data?.data || response.data;
    },

    activateAccount: async (code: string, phone: string) => {
        const response = await privateApi.post('/user/activate', {code, phone});

        return response.data?.data || response.data;
    },

    updateContactDetails: async (details: { phone?: string; birth_date?: string; postal_address?: PostalAddress }) => {
        const response = await privateApi.patch('/user/contact-details', details);

        return response.data?.data || response.data;
    },

    getMembershipDocuments: async (): Promise<MembershipDocuments> => {
        const response = await privateApi.get('/membership-documents');

        return response.data.data;
    },

    applyForMembership: async (application: MembershipApplication) => {
        const response = await privateApi.post('/user/membership-application', application);

        return response.data?.data || response.data;
    },

    updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
        const response = await privateApi.patch('/user/settings', settings);

        return response.data?.data || response.data;
    }
}