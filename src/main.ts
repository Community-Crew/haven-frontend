import {createApp} from 'vue'
import {createPinia} from 'pinia'
import './style.css'

import App from './App.vue'
import router from './router'
import {initKeycloak, authState} from './services/keycloak'
import {useProfileStore} from '@/stores/profile'
import {i18n} from "@/i18n.ts"

const app = createApp(App)

app.use(i18n)
app.use(createPinia())

initKeycloak()
    .then(async () => {
        const profileStore = useProfileStore()

        if (!authState.isAuthenticated) {
            console.warn('Keycloak session invalid on boot.')
            app.use(router)
            await router.isReady()
            // The router guard's login() call takes over for a private
            // route (see router/index.ts); for a public one (e.g. "/" or
            // "/privacy-policy") this just renders normally, which was
            // broken before - the app never used to mount at all here, so
            // public pages never rendered for a signed-out visitor.
            app.mount('#app')
            return
        }

        try {
            await profileStore.fetchProfile()
        } catch (error) {
            console.error('Could not sync user profile metadata from Laravel:', error)
            profileStore.clearProfile()
        }

        app.use(router)
        await router.isReady()
        app.mount('#app')
    })
    .catch((error) => {
        console.error('Application failed to start due to Auth error:', error)
    })