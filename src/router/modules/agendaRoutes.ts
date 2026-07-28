import type {RouteRecordRaw} from "vue-router";


export const agendaRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'agenda',
                name: 'agenda.index',
                component: () => import('@/views/dashboard/agendas/AgendasView.vue'),

            }
        ]
    }

]