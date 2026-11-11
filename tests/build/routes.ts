/** Every route the build must emit, as the URL path a visitor requests. */
export const ROUTES = ['/', '/404.html'] as const

export type Route = (typeof ROUTES)[number]
