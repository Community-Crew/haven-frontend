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
            console.warn('Keycloak session invalid on boot. Redirecting to login handler...')
            app.use(router)
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
        const isPublic = router.currentRoute.value.matched.some(record => record.meta.isPublic === true)

        if (!authState.isAuthenticated && !isPublic) {
            console.log('User unauthenticated on private route. Halting mount for login redirection...')
            return
        }

        app.mount('#app')
    })
    .catch((error) => {
        console.error('Application failed to start due to Auth error:', error)
    })