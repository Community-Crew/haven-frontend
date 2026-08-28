import type {RouteRecordRaw} from "vue-router";

export const userRoutes: Array<RouteRecordRaw> = [
    {
        path: '/dashboard',
        children: [
            {
                path: 'profile',
                name: 'user.profile',
                component: () => import('@/views/dashboard/user/ProfileView.vue')
            },
            {
                path: 'activate',
                name: 'user.activate',
                component: () => import('@/views/dashboard/user/ActivateView.vue'),
                // Does NOT bypass the privacy-policy gate - that check takes
                // priority over activation, so an unaccepted user is sent to
                // accept it first even if they arrived via a QR-code deep
                // link (?code=...); the router guard preserves that link via
                // history so it isn't lost, just delayed.
                meta: { bypassActivationCheck: true }
            },
            {
                path: 'privacy-policy/accept',
                name: 'user.privacy-policy-accept',
                component: () => import('@/views/dashboard/user/PrivacyPolicyAcceptView.vue'),
                // Reached before activation is checked (see router guard),
                // so a not-yet-activated user can still clear this gate too.
                meta: { bypassActivationCheck: true }
            }
        ]
    }
]