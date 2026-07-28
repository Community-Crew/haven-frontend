import type {RouteRecordRaw} from "vue-router";

export const publicRoutes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'public.wip',
        component: () => import('@/views/public/WipView.vue'),
    },
]