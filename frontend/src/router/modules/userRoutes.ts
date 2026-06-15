import type {RouteRecordRaw} from "vue-router";

export const userRoutes: Array<RouteRecordRaw> = [
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../../views/user/ProfileView.vue')
    }
]