import {defineStore} from 'pinia'
import {userService} from '@/services/userService'

interface UserProfile {
    id: number
    name: string
    email: string
    is_activated: boolean
    activated_at: string | null
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
    },

    actions: {
        async fetchProfile() {
            try {
                this.profile = await userService.getCurrentUser()
            } catch (error) {
                console.error('Could not sync user profile metadata from Laravel:', error)
                this.profile = null
            } finally {
                this.isInitialized = true
            }
        },

        clearProfile() {
            this.profile = null
            this.isInitialized = false
        }
    }
})