import type {RouteRecordRaw} from "vue-router";

export const faqRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'faq',
                name: 'faq.index',
                component: () => import('@/views/dashboard/faq/FaqView.vue'),
            }
        ]
    }
]
