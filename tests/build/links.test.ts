import { describe, expect, it } from 'vitest'

import { content } from '../../src/content'
import { readPage } from './dist'
import { ROUTES } from './routes'

/*
 * The owner's rule for links, checked on the pages as they are built: a link
 * that leaves the site opens in a new tab, so the tab the visitor was reading
 * stays where it was. A link within the site stays in its tab, and so does
 * one that opens no page at all (a mail address).
 */

const SITE_HOST = new URL(content.profile.site).host
const WEB = /^https?:\/\//i
/** The fewest links out that each page is known to carry: a guard against a test that checks nothing. */
const AT_LEAST = { '/': 40, '/cv/': 20, '/404.html': 0 } as const

function linksOf(page: Document): readonly HTMLAnchorElement[] {
  return [...page.querySelectorAll<HTMLAnchorElement>('a[href]')]
}

function hrefOf(link: Element): string {
  return link.getAttribute('href') ?? ''
}

function goesOut(link: Element): boolean {
  const href = hrefOf(link)
  return WEB.test(href) && new URL(href).host !== SITE_HOST
}

function relOf(link: Element): readonly string[] {
  return (link.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean)
}

describe.each(ROUTES)('the links on %s, as built', (route) => {
  it('opens every link that leaves the site in a new tab', async () => {
    const out = linksOf(await readPage(route)).filter(goesOut)
    const sameTab = out.filter((link) => link.getAttribute('target') !== '_blank').map(hrefOf)

    expect(out.length).toBeGreaterThanOrEqual(AT_LEAST[route])
    expect(sameTab).toEqual([])
  })

  it('cuts every new tab off from the page that opened it', async () => {
    const out = linksOf(await readPage(route)).filter(goesOut)
    const open = out.filter((link) => !relOf(link).includes('noopener')).map(hrefOf)

    expect(open).toEqual([])
  })

  it('keeps every other link in its own tab', async () => {
    const within = linksOf(await readPage(route)).filter((link) => !goesOut(link))
    const moved = within.filter((link) => link.hasAttribute('target')).map(hrefOf)

    expect(within.length).toBeGreaterThan(0)
    expect(moved).toEqual([])
  })
})
