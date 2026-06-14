import type {RouteRecordRaw} from "vue-router";

export const authRoutes: Array<RouteRecordRaw> = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../../views/auth/LoginView.vue')
    }
]