import {privateApi, publicApi} from "@/services/api.ts";

export const privacyPolicyService = {
    // Public - readable whether the visitor is signed in or not.
    getPrivacyPolicy: async () => {
        const response = await publicApi.get('/privacy-policy');

        return response.data?.data || response.data;
    },

    // Requires auth. Records that the current user accepts the policy as it
    // currently reads - see EnsureUserAcceptedPrivacyPolicy on the backend.
    acceptPrivacyPolicy: async () => {
        const response = await privateApi.post('/privacy-policy/accept');

        return response.data?.data || response.data;
    }
}
