import type {RouteRecordRaw} from "vue-router";


export const homeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                // "/dashboard" itself has no component of its own (every
                // module re-declares it only as a parent), so it rendered an
                // empty page.
                path: '',
                redirect: {name: 'home.index'},
            },
            {
                path: 'home',
                name: 'home.index',
                component: () => import('@/views/dashboard/home/HomeView.vue'),
            }
        ],
    },
]