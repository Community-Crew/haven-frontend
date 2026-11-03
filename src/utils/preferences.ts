import {ref} from 'vue'
import {i18n} from '@/i18n.ts'
import type {Locale, Theme} from '@/types/userSettings.ts'

// Applies language and theme on this device. The values are also kept in
// localStorage so the inline script in index.html and i18n.ts can apply them
// before the profile (with the account's settings) has loaded.

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

const readStoredTheme = (): Theme => {
    try {
        const stored = localStorage.getItem('theme')
        if (stored === 'light' || stored === 'dark') return stored
    } catch {
        // Storage unavailable - fall back to following the system.
    }
    return 'system'
}

export const currentTheme = ref<Theme>(readStoredTheme())
export const isDark = ref(document.documentElement.classList.contains('dark'))

const syncDarkClass = () => {
    isDark.value = currentTheme.value === 'dark' || (currentTheme.value === 'system' && darkQuery.matches)
    document.documentElement.classList.toggle('dark', isDark.value)
}

darkQuery.addEventListener('change', () => {
    if (currentTheme.value === 'system') syncDarkClass()
})

export const applyTheme = (theme: Theme) => {
    currentTheme.value = theme
    try {
        localStorage.setItem('theme', theme)
    } catch {
        // Not persisted on this device; the account setting still applies on next load.
    }
    syncDarkClass()
}

export const applyLocale = (locale: Locale) => {
    i18n.global.locale.value = locale
    document.documentElement.lang = locale
    try {
        localStorage.setItem('user-locale', locale)
    } catch {
        // Not persisted on this device; the account setting still applies on next load.
    }
}
