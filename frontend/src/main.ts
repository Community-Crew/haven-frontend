import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initKeycloak } from './services/keycloak';

const app = createApp(App)

app.use(createPinia())
app.use(router)

initKeycloak()
    .then(() => {
        app.mount('#app');
    })
    .catch((error) => {
        console.error('Application failed to start due to Auth error:', error);
    });