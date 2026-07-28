import type {RouteRecordRaw} from "vue-router";

export const userRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'profile',
                name: 'user.profile',
                component: () => import('@/views/dashboard/user/ProfileView.vue')
            },
            {
                path: 'activate',
                name: 'user.activate',
                component: () => import('@/views/dashboard/user/ActivateView.vue'),
                meta: { bypassActivationCheck: true }
            }
        ]
    }
]