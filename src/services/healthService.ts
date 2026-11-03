import {publicApi} from "@/services/api.ts";

// /api/health sits beside the versioned API (VITE_API_URL ends in /api/v1),
// not under it.
const healthUrl = new URL('../health', `${import.meta.env.VITE_API_URL}/`).toString()

// Once per page load - the layout mounts on every navigation.
let apiVersion: Promise<string | null> | null = null

export const healthService = {
    /**
     * The deployed backend's release tag (e.g. "v1.7.0"), or its short commit
     * SHA between releases. Null if it can't be reached - it's only shown
     * as a detail next to the app version.
     */
    getApiVersion: (): Promise<string | null> => {
        apiVersion ??= publicApi.get(healthUrl)
            .then(response => response.data?.version ?? null)
            .catch(() => null)

        return apiVersion
    },
}
