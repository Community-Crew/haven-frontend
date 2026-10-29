import {defineStore} from 'pinia'
import {userService} from '@/services/userService'

interface UserProfile {
    id: number
    name: string
    email: string
    is_activated: boolean
    activated_at: string | null
    privacy_policy_accepted: boolean
    privacy_policy_accepted_at: string | null
    roles: string[]
    unit: {
        id: number
        building: string
        floor: string
        unit: string
        subunit: string | null
    } | null
}

export const useProfileStore = defineStore('profile', {
    state: () => ({
        profile: null as UserProfile | null,
        isInitialized: false,
    }),

    getters: {
        isActivated: (state) => state.profile?.is_activated ?? false,
        // Defaults to true while the profile hasn't loaded yet, so the
        // router guard doesn't bounce an unauthenticated/unresolved visitor
        // into the accept-gate before fetchProfile() has had a chance to run.
        hasAcceptedPrivacyPolicy: (state) => state.profile?.privacy_policy_accepted ?? true,
    },

    actions: {
        async fetchProfile() {
            // A failed fetch (network error, API down) keeps whatever profile
            // was loaded before and leaves isInitialized untouched, so the
            // router guard retries on the next navigation instead of treating
            // "couldn't load" as "no profile" (which read as not-activated).
            try {
                this.profile = await userService.getCurrentUser()
                this.isInitialized = true
            } catch (error) {
                console.error('Could not sync user profile metadata from Laravel:', error)
            }
        },

        clearProfile() {
            this.profile = null
            this.isInitialized = false
        }
    }
})