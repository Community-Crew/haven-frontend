import type {RouteRecordRaw} from "vue-router";


export const roomRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'rooms',
                name: 'rooms.index',
                component: () => import('@/views/dashboard/rooms/RoomsView.vue'),
            },
            {
                path: 'rooms/:slug',
                name: 'rooms.show',
                component: () => import('@/views/dashboard/rooms/RoomView.vue'),
            }
        ]
    }

]