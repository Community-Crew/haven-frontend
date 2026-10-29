import DOMPurify from 'dompurify'

// Links that open a new tab must not hand the opened page a reference back
// to this one (window.opener).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer')
    }
})

// Rich text from the API (agenda descriptions, privacy policy) is rendered
// with v-html. Strip scripts, event handlers and javascript: URLs first, so
// content edited in the admin can't run code in a user's session - which
// would expose the auth tokens kept in storage.
export const sanitizeHtml = (html: string | null | undefined): string =>
    html ? DOMPurify.sanitize(html, {USE_PROFILES: {html: true}}) : ''
