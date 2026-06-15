import type {RouteRecordRaw} from "vue-router";


export const roomRoutes: Array<RouteRecordRaw> = [
    {
        path: '/rooms',
        name: 'Rooms',
        component: () => import('@/views/rooms/RoomsView.vue'),
    }
]