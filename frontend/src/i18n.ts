import {createI18n} from 'vue-i18n'
import en from './locales/en.json'
import nl from './locales/nl.json'

const createKeyMirrorProxy = (obj: any, path = ''): any => {
    return new Proxy({}, {
        get(_, key: string) {
            if (typeof key !== 'string') return undefined

            const currentPath = path ? `${path}.${key}` : key

            if (obj && typeof obj[key] === 'object' && obj[key] !== null) {
                return createKeyMirrorProxy(obj[key], currentPath)
            }

            return currentPath
        }
    })
}

const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2] ?? '') : null
}

const determineInitialLocale = (): string => {
    const cookieLocale = getCookie('user-locale')
    if (cookieLocale) return cookieLocale

    const storageLocale = localStorage.getItem('user-locale')
    if (storageLocale) return storageLocale

    const browserLocale = navigator.language?.split('-')[0]
    if (browserLocale === 'en' || browserLocale === 'nl') return browserLocale

    return 'nl'
}

const initialLocale = determineInitialLocale()

export const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'nl',
    messages: {
        en,
        nl,
        dev: createKeyMirrorProxy(en),
    }
})