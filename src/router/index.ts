import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
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
        try {
            await profileStore.fetchProfile();
        } catch (error) {
            console.error("Router guard failed to fetch profile:", error);
        }
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
export default router