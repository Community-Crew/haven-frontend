import api from './api';

export const userService = {
    getCurrentUser: async () => {
        const response = await api.get('/user');
        return response.data;
    }
}