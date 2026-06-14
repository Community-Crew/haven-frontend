import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'

const modules = import.meta.glob('./modules/*.ts', {eager: true})
const moduleRoutes: Array<RouteRecordRaw> = []

for (const path in modules) {
    const module = modules[path] as { [key: string]: Array<RouteRecordRaw> }
    for (const key in module) {
        if (Array.isArray(module[key])) {
            moduleRoutes.push(...module[key])
        }
    }
}

const routes: Array<RouteRecordRaw> = [
    ...moduleRoutes,
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes,
})

export default router
