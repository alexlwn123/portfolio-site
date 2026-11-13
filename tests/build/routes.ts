/** Every route the build must emit, as the URL path a visitor requests. */
export const ROUTES = ['/', '/cv/', '/404.html'] as const

export type Route = (typeof ROUTES)[number]

/** Routes that search engines should index. */
export const INDEXABLE_ROUTES = ['/', '/cv/'] as const satisfies readonly Route[]
