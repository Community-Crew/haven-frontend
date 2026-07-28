import {privateApi} from './api.ts';

export const userService = {
    getCurrentUser: async () => {
        const response = await privateApi.get('/user');

        return response.data?.data || response.data;
    },

    activateAccount: async (code: string) => {
        const response = await privateApi.post('/user/activate', {code});

        return response.data?.data || response.data;
    }
}