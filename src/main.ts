import {createApp} from 'vue'
import {createPinia} from 'pinia'
import './style.css'

import App from './App.vue'
import router from './router'
import {initKeycloak} from './services/keycloak'
import {i18n} from "@/i18n.ts"

const app = createApp(App)

app.use(i18n)
app.use(createPinia())

const mountApp = async () => {
    // The router guard handles everything auth-dependent from here: it
    // starts login() for a private route when signed out, and loads the
    // profile (see stores/profile.ts) before checking the account gates.
    app.use(router)
    await router.isReady()
    app.mount('#app')
}

initKeycloak()
    .catch((error) => {
        // Never leave the page unmounted over an auth failure - start
        // signed out instead, so public pages still render and private
        // ones fall through to login().
        console.error('Keycloak init failed, continuing signed out:', error)
    })
    .then(mountApp)
    .catch((error) => {
        console.error('Application failed to start:', error)
    })
