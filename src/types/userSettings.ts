export type Locale = 'nl' | 'en';

export type Theme = 'system' | 'light' | 'dark';

export interface UserSettings {
    locale: Locale;
    theme: Theme;
}
