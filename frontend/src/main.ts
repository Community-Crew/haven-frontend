import {createApp} from 'vue'
import {createPinia} from 'pinia'
import './style.css'

import App from './App.vue'
import router from './router'
import {initKeycloak} from './services/keycloak';
import {i18n} from "@/i18n.ts";

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)

initKeycloak()
    .then(() => {
        app.mount('#app');
    })
    .catch((error) => {
        console.error('Application failed to start due to Auth error:', error);
    });