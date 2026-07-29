import Keycloak, {type KeycloakConfig, type KeycloakTokenParsed} from "keycloak-js";
import {reactive} from "vue";
import {Capacitor} from "@capacitor/core";
import {Browser} from "@capacitor/browser";
import {App} from "@capacitor/app";
import {Preferences} from "@capacitor/preferences";
import {useProfileStore} from "@/stores/profile";

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

let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

export const authState = reactive<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
});

const saveTokens = async (token: string, refreshToken: string) => {
    await Preferences.set({key: 'kc_token', value: token});
    await Preferences.set({key: 'kc_refreshToken', value: refreshToken});
};

const clearTokens = async () => {
    await Preferences.remove({key: 'kc_token'});
    await Preferences.remove({key: 'kc_refreshToken'});
};

const getRealmUrl = (): string => {
    const baseUrl = (import.meta.env.VITE_KEYCLOAK_URL as string).replace(/\/+$/, '');
    return `${baseUrl}/realms/${encodeURIComponent(import.meta.env.VITE_KEYCLOAK_REALM as string)}`;
};

const nativeRedirectUri = 'havenportal://authentication';

const base64UrlEncode = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const generateCodeVerifier = (): string => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes.buffer as ArrayBuffer);
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64UrlEncode(digest);
};

// keycloak-js's own createLoginUrl()/processCallback() can't be used for the
// native flow: Capacitor's Cordova compatibility layer makes it auto-detect
// the 'cordova' adapter (whose redirectUri resolver ignores per-call options),
// and processCallback is a private class method, inaccessible from outside
// the library. So the native login/callback exchange is handled manually here
// with our own PKCE state, then the app is reloaded to pick up the resulting
// tokens through the already-working "resume from stored tokens" boot path.
let pendingNativeLogin: { state: string; codeVerifier: string } | null = null;

export const initKeycloak = async (): Promise<boolean> => {
    const {value: storedToken} = await Preferences.get({key: 'kc_token'});
    const {value: storedRefreshToken} = await Preferences.get({key: 'kc_refreshToken'});

    return new Promise((resolve, reject) => {
        const initConfig: any = {
            responseMode: 'query',
            checkLoginIframe: false,
            // Requesting offline_access gets us a refresh token whose lifetime
            // is governed by Keycloak's realm "Offline Session Idle"/"Max"
            // settings instead of the much shorter default SSO session
            // timeout, so a user stays logged in as long as they open the
            // app at least that often (needs the offline_access scope
            // enabled for this client in Keycloak).
            scope: 'openid offline_access',
        };

        if (Capacitor.isNativePlatform()) {
            // Capacitor's Cordova compatibility layer makes keycloak-js
            // auto-detect its 'cordova' adapter, whose redirectUri resolver
            // ignores the per-call redirectUri passed to createLoginUrl and
            // only reads this.redirectUri (falling back to a hardcoded
            // 'http://localhost' otherwise). Setting it here is required.
            initConfig.redirectUri = nativeRedirectUri;
        }

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
        const state = crypto.randomUUID();
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        pendingNativeLogin = {state, codeVerifier};

        const params = new URLSearchParams({
            client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
            redirect_uri: nativeRedirectUri,
            response_type: 'code',
            response_mode: 'query',
            scope: 'openid offline_access',
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        await Browser.open({url: `${getRealmUrl()}/protocol/openid-connect/auth?${params.toString()}`});
    } else {
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

            if (!code) {
                // Not a login callback (e.g. a logout redirect) - nothing to do.
                pendingNativeLogin = null;
                return;
            }

            if (!state || !pendingNativeLogin || state !== pendingNativeLogin.state) {
                console.error('Native login callback missing or did not match the pending request');
                pendingNativeLogin = null;
                return;
            }

            const {codeVerifier} = pendingNativeLogin;
            pendingNativeLogin = null;

            try {
                const response = await fetch(`${getRealmUrl()}/protocol/openid-connect/token`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
                        code,
                        redirect_uri: nativeRedirectUri,
                        code_verifier: codeVerifier,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Token exchange failed with status ${response.status}`);
                }

                const tokens = await response.json();
                await saveTokens(tokens.access_token, tokens.refresh_token);

                window.location.reload();
            } catch (error) {
                console.error('Native login token exchange failed:', error);
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

        if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
        }

        tokenRefreshInterval = setInterval(() => {
            keycloak.updateToken(70)
                .then(async (refreshed) => {
                    if (refreshed && keycloak.token && keycloak.refreshToken) {
                        authState.token = keycloak.token;

                        const profileStore = useProfileStore();
                        await profileStore.fetchProfile();

                        saveTokens(keycloak.token, keycloak.refreshToken)
                            .catch(err => console.error('Failed to save refreshed tokens:', err));
                    }
                })
                .catch(() => {
                    console.error('Failed to refresh token');
                });
        }, 60000);
    }
};

export const logout = async (): Promise<void> => {
    if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
    }

    const profileStore = useProfileStore();
    profileStore.clearProfile();
    await clearTokens();

    if (Capacitor.isNativePlatform()) {
        // keycloak.logout() routes through the same auto-detected 'cordova'
        // adapter as login (see the comment above pendingNativeLogin) - its
        // logout() opens a window via Cordova's InAppBrowser APIs, which
        // don't exist under Capacitor. createLogoutUrl() is public and safe
        // to call directly, so build the URL ourselves and open it the same
        // way as login.
        const logoutUrl = keycloak.createLogoutUrl({redirectUri: nativeRedirectUri});
        await Browser.open({url: logoutUrl});
    } else {
        await keycloak.logout({redirectUri: window.location.origin});
    }

    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
};