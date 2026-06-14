import Keycloak, {type KeycloakConfig, type KeycloakTokenParsed} from "keycloak-js";
import {reactive} from "vue";
import {Capacitor} from "@capacitor/core";
import {Browser} from "@capacitor/browser";
import App from "@/App.vue";
import {Preferences} from "@capacitor/preferences";


interface AuthState {
    isAuthenticated: boolean;
    user: KeycloakTokenParsed | null;
    token: string | null;
}

const initOptions: KeycloakConfig = {
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

const keycloak = new Keycloak(initOptions);

export const authState = reactive<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
});

const saveTokens = async (token: string, refreshToken: string) => {
    await Preferences.set({ key: 'kc_token', value: token });
    await Preferences.set({ key: 'kc_refreshToken', value: refreshToken });
};

const clearTokens = async () => {
    await Preferences.remove({ key: 'kc_token' });
    await Preferences.remove({ key: 'kc_refreshToken' });
};

export const initKeycloak = async (): Promise<boolean> => {
    const { value: storedToken } = await Preferences.get({ key: 'kc_token' });
    const { value: storedRefreshToken } = await Preferences.get({ key: 'kc_refreshToken' });

    return new Promise((resolve, reject) => {
        const initConfig: any = {
            responseMode: 'query',
        };

        if (storedToken && storedRefreshToken) {
            initConfig.token = storedToken;
            initConfig.refreshToken = storedRefreshToken;
        } else if (!Capacitor.isNativePlatform()) {
            initConfig.onLoad = 'check-sso';
            initConfig.silentCheckSsoRedirectUri = window.location.origin + '/silent-check-sso.html';
        }

        keycloak.init(initConfig)
            .then((authenticated) => {
                updateState(authenticated);

                if (Capacitor.isNativePlatform()) {
                    setupDeepLinkListener();
                }

                resolve(authenticated);
            })
            .catch((err) => {
                clearTokens();
                reject(err);
            });
    });
};

export const login = async (): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
        const redirectUri = 'havenportal://authentication';
        const loginUrl = await keycloak.createLoginUrl({ redirectUri });

        await Browser.open({ url: loginUrl });
    } else {
        // Fallback to normal web browser redirect
        await keycloak.login();
    }
};

const setupDeepLinkListener = () => {
    App.addListener('appUrlOpen', async (data: any) => {
        const url = new URL(data.url);

        if (url.host === 'authentication' || url.protocol === 'havenportal:') {
            await Browser.close();

            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');

            if (code && state) {
                keycloak.init({
                    onLoad: undefined,
                    responseMode: 'query'
                }).then(() => {
                    (keycloak as any).processCallback({ code, state }).then(() => {
                        updateState(true);
                    });
                });
            }
        }
    });
};

const updateState = (authenticated: boolean) => {
    authState.isAuthenticated = authenticated;
    if (authenticated && keycloak.token && keycloak.refreshToken) {
        authState.token = keycloak.token;
        authState.user = keycloak.tokenParsed ?? null;

        saveTokens(keycloak.token, keycloak.refreshToken)
            .catch(err => console.error('Failed to save tokens to storage:', err));

        setInterval(() => {
            keycloak.updateToken(70)
                .then((refreshed) => {
                    if (refreshed && keycloak.token && keycloak.refreshToken) {
                        authState.token = keycloak.token;
                        saveTokens(keycloak.token, keycloak.refreshToken)
                            .catch(err => console.error('Failed to save refreshed tokens:', err));
                    }
                })
                .catch(() => {
                    console.error('Failed to refresh token');
                });
        }, 30000);
    }
};

export const logout = async (): Promise<void> => {
    const redirectUri = Capacitor.isNativePlatform() ? 'havenportal://authentication' : window.location.origin;
    await keycloak.logout({ redirectUri });
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
};
