import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import nl from './locales/nl.json'

const savedLocale = localStorage.getItem('user-locale') || navigator.language.split('-')[0] || 'nl'

export const i18n = createI18n({
    legacy: false,
    locale: savedLocale === 'en' ? 'en' : 'nl',
    fallbackLocale: 'nl',
    messages: {
        en,
        nl
    }
})