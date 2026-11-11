import {Capacitor} from "@capacitor/core";
import {Browser} from "@capacitor/browser";
import type {Router} from "vue-router";

/**
 * Opens a link from admin-edited content (the FAQ): an app path like
 * /dashboard/rooms navigates inside the app, anything else opens outside it
 * - the in-app browser on iOS/Android, a new tab on the web.
 */
export const openLink = async (url: string, router: Router) => {
    if (url.startsWith('/') && !url.startsWith('//')) {
        await router.push(url)
        return
    }

    if (url.startsWith('mailto:')) {
        window.location.href = url
        return
    }

    if (Capacitor.isNativePlatform()) {
        await Browser.open({url})
    } else {
        window.open(url, '_blank', 'noopener,noreferrer')
    }
}
