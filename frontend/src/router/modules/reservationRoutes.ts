import type {RouteRecordRaw} from "vue-router";

export const reservationRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: "reservations",
                name: "reservations.index",
                component: () => import("@/views/dashboard/reservations/ReservationsView.vue"),
            }
        ]
    }
]