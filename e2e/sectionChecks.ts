import type { Locator, Page } from '@playwright/test'

/*
 * The checks every section of the home page is held to: it fits the width,
 * every link is named and can be clicked at its centre, and no text is drawn
 * too small to read. Each returns what failed, so a spec expects an empty list.
 */

/** The widths each section is designed for: a laptop, a tablet and a phone. */
export const SECTION_WIDTHS = [1440, 900, 390] as const

/** Any height will do: a section is measured, never photographed. */
const VIEWPORT_HEIGHT = 900

/** Opens the home page at a width with motion reduced, and returns one section of it. */
export async function openSection(page: Page, id: string, width: number): Promise<Locator> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  return page.locator(`section#${id}`)
}

/** How far the page can be scrolled sideways, in pixels. Zero when nothing overflows. */
export async function sidewaysScroll(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

/** The links in a section that have no accessible name. */
export async function unnamedLinks(section: Locator): Promise<readonly string[]> {
  const links = await section.getByRole('link').all()
  const names = await Promise.all(
    links.map(async (link) => ({
      href: (await link.getAttribute('href')) ?? '',
      name: await link.evaluate((element) => {
        const label = element.getAttribute('aria-label') ?? element.textContent
        return label.trim()
      }),
    })),
  )
  return names.filter(({ name }) => name === '').map(({ href }) => href)
}

/** The links in a section whose centre, scrolled into view, is something else. */
export async function linksNotUnderTheirCentre(section: Locator): Promise<readonly string[]> {
  return section.getByRole('link').evaluateAll((links) =>
    links.flatMap((link) => {
      link.scrollIntoView({ block: 'center' })
      const box = link.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return link.contains(hit) ? [] : [link.getAttribute('href') ?? '']
    }),
  )
}

export interface DrawnText {
  readonly text: string
  readonly px: number
}

/** Every piece of text the section draws, with the size it is drawn at on the screen. */
export async function drawnText(section: Locator): Promise<readonly DrawnText[]> {
  return section.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const found: DrawnText[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement
      const text = node.nodeValue?.trim() ?? ''
      const shown = element !== null && element.getClientRects().length > 0
      if (element && text !== '' && shown && !element.closest('defs')) {
        // An SVG's text is sized in the drawing's own units, so scale it to the screen.
        const matrix = element instanceof SVGGraphicsElement ? element.getScreenCTM() : null
        const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
        found.push({ text, px: Number.parseFloat(getComputedStyle(element).fontSize) * scale })
      }
    }
    return found
  })
}

/** The hrefs of every link in a section. */
export async function hrefsIn(section: Locator): Promise<ReadonlySet<string>> {
  const hrefs = await section
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
  return new Set(hrefs)
}
