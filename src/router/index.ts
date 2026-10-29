import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {Capacitor} from "@capacitor/core"
import {authState, login} from "@/services/keycloak.ts"
import {useProfileStore} from "@/stores/profile.ts";

const modules = import.meta.glob('./modules/*.ts', {eager: true})
const moduleRoutes: Array<RouteRecordRaw> = []

for (const path in modules) {
    const module = modules[path] as { [key: string]: Array<RouteRecordRaw> }
    for (const key in module) {
        if (Array.isArray(module[key])) {
            moduleRoutes.push(...module[key])
        }
    }
}

const routes: Array<RouteRecordRaw> = [
    ...moduleRoutes,
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        component: () => import('@/views/utils/NotFoundView.vue'),
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
})

router.beforeEach(async (to) => {
    if (Capacitor.isNativePlatform() && to.name === 'public.wip') {
        return {name: 'home.index'};
    }

    const isPublic = to.matched.some((record) => record.meta.isPublic === true) && !to.path.startsWith('/dashboard');
    const bypassActivationCheck = to.matched.some((record) => record.meta.bypassActivationCheck === true);
    const profileStore = useProfileStore()

    if (isPublic) {
        return true;
    }

    if (!authState.isAuthenticated) {
        try {
            await login();
        } catch (error) {
            console.error("Failed to initiate Keycloak login redirect flow:", error);
        }
        return false;
    }

    if (!profileStore.isInitialized) {
        await profileStore.fetchProfile();
    }

    // Profile couldn't be loaded (API unreachable) - let the page render
    // rather than guessing the gates below from missing data. The API's own
    // 403 ACCOUNT_NOT_ACTIVATED / PRIVACY_POLICY_NOT_ACCEPTED responses still
    // redirect (see services/api.ts), and the next navigation retries.
    if (!profileStore.profile) {
        return true;
    }

    // Takes priority over activation - always enforced, no bypass, even for
    // a QR-code deep link into /dashboard/activate. The original destination
    // is preserved via ?redirect= so it isn't lost, just delayed.
    if (!profileStore.hasAcceptedPrivacyPolicy && to.name !== 'user.privacy-policy-accept') {
        console.warn("Privacy policy needs to be re-accepted. Redirecting.");
        return {name: 'user.privacy-policy-accept', query: {redirect: to.fullPath}};
    }

    if (to.name === 'user.privacy-policy-accept' && profileStore.hasAcceptedPrivacyPolicy) {
        console.warn("Privacy policy is already accepted. Redirecting away from the accept page.");
        return {name: 'home.index'};
    }

    if (!profileStore.isActivated && !bypassActivationCheck) {
        console.warn("User account is unactivated. Redirecting to activation layout.");
        return {name: 'user.activate'};
    }

    if (to.name === 'user.activate' && profileStore.isActivated) {
        console.warn("User is already activated. Redirecting away from activation page.");
        return {name: 'home.index'};
    }

    return true;
});

// After a deploy, `rsync --delete` removes the previous build's hashed
// chunks, so a tab still running the old build fails to lazy-load a route
// ("Failed to fetch dynamically imported module") and renders nothing.
// Reload once onto the target URL to pick up the new build; the session
// flag stops a reload loop if the chunk is genuinely broken.
const CHUNK_RELOAD_KEY = 'chunk-reload-attempted'

const isChunkLoadError = (error: unknown): boolean =>
    error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)

const reloadOnce = (url: string): boolean => {
    try {
        if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    } catch {
        return false
    }
    window.location.assign(url)
    return true
}

router.onError((error, to) => {
    if (isChunkLoadError(error)) {
        reloadOnce(to.fullPath)
    }
})

window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce(window.location.href)) {
        event.preventDefault()
    }
})

router.afterEach((_to, _from, failure) => {
    if (failure) return
    try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    } catch {
        // storage unavailable - nothing to reset
    }
})

export default router