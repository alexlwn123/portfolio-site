import { expect, type Locator, type Page } from '@playwright/test'

import type { HomeSectionId } from '../src/features/sections/sectionIds'

/*
 * What the specs of the "work", "patents" and "contact" sections share: how a
 * section is opened, and the checks every one of them has to pass.
 */

/** A laptop, a tablet and a phone: the three widths each section is designed for. */
export const SECTION_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 900, height: 1100 },
  { width: 390, height: 844 },
] as const

export type SectionWidth = (typeof SECTION_VIEWPORTS)[number]['width']

export const PHONE_WIDTH: SectionWidth = 390
/** A thumb's worth: the smallest side of a link that has to be easy to hit. */
export const THUMB_PX = 44

const NARROW_PHONE = { width: 360, height: 780 } as const
/** A box may round up to a pixel past an edge without anything being cut off. */
const EDGE_TOLERANCE_PX = 1

function viewportFor(width: number): { readonly width: number; readonly height: number } {
  return (
    SECTION_VIEWPORTS.find((viewport) => viewport.width === width) ??
    (width === NARROW_PHONE.width ? NARROW_PHONE : { width, height: NARROW_PHONE.height })
  )
}

/** Opens the home page at a width, with motion reduced, and brings a section into view. */
export async function openSection(page: Page, width: number, id: HomeSectionId): Promise<Locator> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize(viewportFor(width))
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  const section = page.locator(`section#${id}`)
  await section.scrollIntoViewIfNeeded()
  return section
}

/** The narrowest phone the type is checked on. */
export async function openSectionOnNarrowPhone(page: Page, id: HomeSectionId): Promise<Locator> {
  return openSection(page, NARROW_PHONE.width, id)
}

/** How far the page can be scrolled sideways. Nothing, when all is well. */
export async function sidewaysScroll(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

/**
 * Everything in a section that holds text of its own, or is a link, and
 * reaches past the left or right edge of the screen. The section clips what
 * hangs over, so this is what a reader would find cut off.
 */
export async function cutOffSideways(section: Locator): Promise<readonly string[]> {
  return section.evaluate((root, tolerance) => {
    const holdsText = (element: Element): boolean =>
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== '',
      )
    const hidden = (element: Element): boolean =>
      element.closest('[aria-hidden="true"]') !== null ||
      getComputedStyle(element).clipPath === 'inset(50%)'
    return [...root.querySelectorAll('*')]
      .filter((element) => (holdsText(element) || element.tagName === 'A') && !hidden(element))
      .flatMap((element) => {
        const { left, right, width } = element.getBoundingClientRect()
        const inside = left >= -tolerance && right <= window.innerWidth + tolerance
        return width === 0 || inside ? [] : [element.textContent.trim().slice(0, 60)]
      })
  }, EDGE_TOLERANCE_PX)
}

/** Every link in a section whose centre, asked what is there, is not the link itself. */
export async function linksCoveredAtCentre(section: Locator): Promise<readonly string[]> {
  return section.getByRole('link').evaluateAll((links) =>
    links.flatMap((link) => {
      link.scrollIntoView({ block: 'center' })
      const box = link.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return link.contains(hit) ? [] : [link.getAttribute('href') ?? '']
    }),
  )
}

/** Checks that every link in a section has a name, and that there are as many as expected. */
export async function expectNamedLinks(section: Locator, count: number): Promise<void> {
  const links = section.getByRole('link')
  await expect(links).toHaveCount(count)
  for (const link of await links.all()) {
    await expect(link).toHaveAccessibleName(/\S/)
  }
}

export interface DrawnText {
  readonly text: string
  readonly px: number
}

/** Every piece of text a section draws, with the size it is drawn at on the screen. */
export async function drawnText(section: Locator): Promise<readonly DrawnText[]> {
  return section.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const found: { text: string; px: number }[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement
      const text = (node.nodeValue ?? '').trim()
      if (!element || text === '' || element.closest('defs')) {
        continue
      }
      // An SVG's text is sized in the drawing's own units, so scale it to the screen.
      const matrix = element instanceof SVGGraphicsElement ? element.getScreenCTM() : null
      const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
      if (element.getClientRects().length > 0) {
        found.push({ text, px: Number.parseFloat(getComputedStyle(element).fontSize) * scale })
      }
    }
    return found
  })
}

/** The sides of every link in a section, in px, with its address. */
export async function linkSizes(
  section: Locator,
): Promise<readonly { readonly href: string; readonly width: number; readonly height: number }[]> {
  return section.getByRole('link').evaluateAll((links) =>
    links.map((link) => {
      const { width, height } = link.getBoundingClientRect()
      return { href: link.getAttribute('href') ?? '', width, height }
    }),
  )
}

/** An element's box on the page, scrolled or not. */
export async function pageBox(locator: Locator): Promise<{
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}> {
  return locator.evaluate((element) => {
    const { left, top, right, bottom } = element.getBoundingClientRect()
    return { left, top: top + window.scrollY, right, bottom: bottom + window.scrollY }
  })
}
