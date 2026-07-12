import type {RouteRecordRaw} from "vue-router";


export const homeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'home',
                name: 'home.index',
                component: () => import('@/views/dashboard/home/HomeView.vue'),
            }
        ],
    },
]