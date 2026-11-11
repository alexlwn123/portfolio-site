import type { Locator, Page } from '@playwright/test'

import type { HomeSectionId } from '../src/features/sections/sectionIds'
import { openLid } from './support'

/*
 * What the specs of the "wins" and "organized" sections both ask of the page:
 * that a section is on it, that nothing in it is pushed off the side or under
 * something else, and that its smallest type can be read on a phone.
 */

/** The widths each section is designed for: a laptop, a tablet and a phone. */
export const SECTION_WIDTHS = [1440, 900, 390] as const

/** Opens the home page at a width, with motion reduced, and brings a section into view. */
export async function openSection(page: Page, width: number, id: HomeSectionId): Promise<Locator> {
  await openLid(page, width)
  const section = page.locator(`section#${id}`)
  await section.scrollIntoViewIfNeeded()
  return section
}

/** How far the page can be scrolled sideways. Nothing should be. */
export async function sidewaysOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

/**
 * The text in a section that is cut off by the side of the screen: each piece
 * of text whose own box reaches past the left or the right edge.
 */
export async function textCutOffAtTheSides(section: Locator): Promise<readonly string[]> {
  return section.evaluate((root) => {
    // Every text node under the section, in document order, as a list of its own.
    const found = document.evaluate('.//text()', root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
    const nodes = Array.from({ length: found.snapshotLength }, (_, index) =>
      found.snapshotItem(index),
    )
    return nodes.flatMap((node) => {
      const text = node?.nodeValue?.trim() ?? ''
      const element = node?.parentElement
      // Text for screen readers only is clipped to a box of a pixel, and drawn nowhere.
      const hidden =
        !node ||
        !element ||
        text === '' ||
        element.closest('defs, [aria-hidden="true"]') !== null ||
        element.getBoundingClientRect().width <= 1
      if (hidden) {
        return []
      }
      const range = document.createRange()
      range.selectNodeContents(node)
      const boxes = [...range.getClientRects()].filter(({ width }) => width > 1)
      return boxes.some(({ left, right }) => left < -1 || right > window.innerWidth + 1)
        ? [text]
        : []
    })
  })
}

/** Every link in a section whose centre is not the link itself when the page is asked what is there. */
export async function linksUnderSomethingElse(section: Locator): Promise<readonly string[]> {
  return section.getByRole('link').evaluateAll((links) =>
    links.flatMap((link) => {
      link.scrollIntoView({ block: 'center' })
      const box = link.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return link.contains(hit) ? [] : [link.getAttribute('href') ?? '']
    }),
  )
}

/** Every link in a section that is a smaller target than the minimum, by its address. */
export async function linksSmallerThan(
  section: Locator,
  minimum: number,
): Promise<readonly string[]> {
  return section.getByRole('link').evaluateAll(
    (links, least) =>
      links.flatMap((link) => {
        const { width, height } = link.getBoundingClientRect()
        return width < least || height < least ? [link.getAttribute('href') ?? ''] : []
      }),
    minimum,
  )
}

export interface TextSize {
  readonly text: string
  readonly px: number
}

/** Every piece of rendered text in a section with the size it is actually drawn at. */
export async function textSizes(section: Locator): Promise<readonly TextSize[]> {
  return section.evaluate((root) => {
    const found = document.evaluate('.//text()', root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
    const nodes = Array.from({ length: found.snapshotLength }, (_, index) =>
      found.snapshotItem(index),
    )
    return nodes.flatMap((node) => {
      const element = node?.parentElement
      const text = node?.nodeValue?.trim() ?? ''
      if (
        !element ||
        text === '' ||
        element.closest('defs') ||
        element.getClientRects().length === 0
      ) {
        return []
      }
      // An SVG's text is sized in the drawing's own units, so scale it to the screen.
      const matrix = element instanceof SVGGraphicsElement ? element.getScreenCTM() : null
      const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
      return [{ text, px: Number.parseFloat(getComputedStyle(element).fontSize) * scale }]
    })
  })
}

/** The accessible name of every link in a section, in the order the markup has them. */
export async function linkNames(section: Locator): Promise<readonly string[]> {
  const links = await section.getByRole('link').all()
  return Promise.all(
    links.map(async (link) => {
      // The snapshot is YAML, so a name with a colon in it arrives quoted: - 'link "Code: Pleb FM"'.
      const snapshot = await link.ariaSnapshot()
      return /^- '?link "(.*)"/.exec(snapshot)?.[1] ?? ''
    }),
  )
}
