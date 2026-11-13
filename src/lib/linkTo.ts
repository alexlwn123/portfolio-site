import { content } from '../content'

/** What an anchor needs to lead somewhere: its address, and how to open it. */
export interface LinkAttributes {
  readonly href: string
  readonly target?: '_blank'
  readonly rel?: string
}

/** The schemes that open a page. A mail address opens none, so it has no tab to keep. */
const WEB_SCHEMES: readonly string[] = ['http:', 'https:']

/**
 * A new tab is cut off from the page that opened it: it cannot reach back
 * through `window.opener`. The referrer is left on, so the page it lands on
 * can see the visit came from here.
 */
const NEW_TAB = { target: '_blank', rel: 'noopener' } as const

/** The address as a URL, or null when it is not a whole one ("/cv/", "#work", ""). */
function parsed(address: string): URL | null {
  return URL.canParse(address) ? new URL(address) : null
}

/**
 * True for an address that takes the visitor to a page on another host. An
 * address within the site, the site by its full address, and one that opens
 * no page are all false.
 */
export function leavesSite(href: string, site: string = content.profile.site): boolean {
  const url = parsed(href)
  if (url === null || !WEB_SCHEMES.includes(url.protocol)) return false
  return url.host !== parsed(site)?.host
}

/**
 * The attributes for a link to an address. A link that leaves the site opens
 * in a new tab, so the tab the visitor was reading stays where it was. Every
 * other link stays in its tab.
 */
export function linkTo(href: string, site: string = content.profile.site): LinkAttributes {
  return Object.freeze(leavesSite(href, site) ? { href, ...NEW_TAB } : { href })
}
