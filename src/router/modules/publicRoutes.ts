import type {RouteRecordRaw} from "vue-router";

export const publicRoutes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'public.wip',
        component: () => import('@/views/public/WipView.vue'),
        // Was missing this - without it the router guard treated "/" as a
        // private route, which (once the privacy-policy gate started
        // running on every non-public route) caused an authenticated,
        // not-yet-accepted visitor to bounce between "/" and the accept
        // page forever.
        meta: {isPublic: true},
    },
    {
        path: '/privacy-policy',
        name: 'public.privacy-policy',
        component: () => import('@/views/public/PrivacyPolicyView.vue'),
        meta: {isPublic: true},
    },
]