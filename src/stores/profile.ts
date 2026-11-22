import {defineStore} from 'pinia'
import {userService, type MembershipApplication, type PostalAddress} from '@/services/userService'
import {applyLocale, applyTheme} from '@/utils/preferences.ts'
import type {UserSettings} from '@/types/userSettings.ts'

interface UserProfile {
    id: number
    name: string
    email: string
    phone: string | null
    birth_date: string | null
    membership: {
        status: string
        identity_verified: boolean
        documents_accepted: boolean
        is_beneficiary: boolean
        is_honorary: boolean
    } | null
    is_former_resident: boolean
    postal_address: PostalAddress | null
    anonymizes_at: string | null
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
    settings: UserSettings
}

const applySettings = (settings: UserSettings) => {
    applyLocale(settings.locale)
    applyTheme(settings.theme)
}

export const useProfileStore = defineStore('profile', {
    state: () => ({
        profile: null as UserProfile | null,
        isInitialized: false,
    }),

    getters: {
        isActivated: (state) => state.profile?.is_activated ?? false,
        // Moved out: only the profile is left, to stay on as a beneficiary.
        isFormerResident: (state) => state.profile?.is_former_resident ?? false,
        // Defaults to true while the profile hasn't loaded yet, so the
        // router guard doesn't bounce an unauthenticated/unresolved visitor
        // into the accept-gate before fetchProfile() has had a chance to run.
        hasAcceptedPrivacyPolicy: (state) => state.profile?.privacy_policy_accepted ?? true,
        // Existing users get a reminder rather than a block - see
        // ContactDetailsBanner.vue.
        isMissingContactDetails: (state) => {
            const profile = state.profile
            if (!profile?.is_activated) return false
            return !profile.phone || (!!profile.membership && !profile.birth_date)
        },
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
                // The account's settings win over whatever this device had stored.
                if (this.profile?.settings) applySettings(this.profile.settings)
            } catch (error) {
                console.error('Could not sync user profile metadata from Laravel:', error)
            }
        },

        // Applies the change right away and saves it to the account; rolls
        // back and rethrows if saving fails.
        async updateSettings(changes: Partial<UserSettings>) {
            if (!this.profile) return

            const previous = {...this.profile.settings}
            this.profile.settings = {...previous, ...changes}
            applySettings(this.profile.settings)

            try {
                this.profile.settings = await userService.updateSettings(changes)
            } catch (error) {
                this.profile.settings = previous
                applySettings(previous)
                throw error
            }
        },

        async updateContactDetails(details: { phone?: string; birth_date?: string; postal_address?: PostalAddress }) {
            this.profile = await userService.updateContactDetails(details)
        },

        async applyForMembership(application: MembershipApplication) {
            this.profile = await userService.applyForMembership(application)
        },

        clearProfile() {
            this.profile = null
            this.isInitialized = false
        }
    }
})