import type { Locator, Page, Request } from '@playwright/test'

/** Reads what a collector has gathered so far. */
export type Collected<T> = () => readonly T[]

/** Records every request the page makes from now on. */
export function collectRequests(page: Page): Collected<Request> {
  let requests: readonly Request[] = []
  page.on('request', (request) => {
    requests = [...requests, request]
  })
  return () => requests
}

/** Records console messages and uncaught errors from now on. */
export function collectConsole(page: Page): Collected<string> {
  let output: readonly string[] = []
  const record = (line: string): void => {
    output = [...output, line]
  }
  page.on('console', (message) => {
    record(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => {
    record(`pageerror: ${error.message}`)
  })
  return () => output
}

/** Any height will do for a lid screenshot: every one is of the full page. */
const LID_VIEWPORT_HEIGHT = 900

/**
 * Opens the home page at a given width with motion reduced, so that nothing
 * is swinging when it is measured, clicked or photographed.
 */
export async function openLid(page: Page, width: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: LID_VIEWPORT_HEIGHT })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => image.decode()))
  })
}

/**
 * Makes the window as tall as the lid and hands the lid back, ready to be
 * photographed. Cut out of a shorter window, the lid costs Chromium a painting
 * of the whole long page under it, which a busy machine does not finish in time.
 */
export async function fitWindowToLid(page: Page): Promise<Locator> {
  const lid = page.locator('[data-lid]')
  const { width, height } = await boxOf(lid)
  await page.setViewportSize({
    width: page.viewportSize()?.width ?? Math.round(width),
    height: Math.ceil(height),
  })
  return lid
}

/** Every link on the lid, in the order the markup has them. */
export function lidLinks(page: Page): Locator {
  return page.locator('[data-lid]').getByRole('link')
}

/** How long the stickers take to slap down, the last of them included. */
const SLAP_MS = 1500

/**
 * Opens the home page with motion welcome, as most visitors get it, and waits
 * until every sticker has slapped down and the page's script has run.
 */
export async function openLivelyLid(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: LID_VIEWPORT_HEIGHT })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => image.decode()))
  })
  await page.locator('[data-lid][data-enhanced]').waitFor()
  await page.waitForTimeout(SLAP_MS)
}

/** One sticker on the lid, by its id. */
export function sticker(page: Page, id: string): Locator {
  return page.locator(`[data-sticker="${id}"]`)
}

export interface Box {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** An element's box on the screen. It must have one. */
export async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('Expected the element to be on the page')
  }
  return box
}

/** Where every sticker is on the page, by id, to the tenth of a pixel. */
export async function stickerPlaces(page: Page): Promise<Readonly<Record<string, string>>> {
  return page.locator('[data-sticker]').evaluateAll((stickers) =>
    Object.fromEntries(
      stickers.map((element) => {
        const { left, top, width, height } = element.getBoundingClientRect()
        const place = [left, top + window.scrollY, width, height].map((side) => side.toFixed(1))
        const shown = element.getClientRects().length > 0
        return [element.getAttribute('data-sticker') ?? '', shown ? place.join(' ') : 'not shown']
      }),
    ),
  )
}

/**
 * Presses on a sticker at a point inside it, carries it by a distance and lets
 * go. The mouse moves in steps, as a hand does.
 */
export async function carry(
  page: Page,
  id: string,
  by: { readonly x: number; readonly y: number },
  from: { readonly x: number; readonly y: number } = { x: 0.5, y: 0.5 },
): Promise<void> {
  await sticker(page, id).evaluate((element) => {
    element.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  const box = await boxOf(sticker(page, id))
  const start = { x: box.x + box.width * from.x, y: box.y + box.height * from.y }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + by.x, start.y + by.y, { steps: 12 })
  await page.mouse.up()
  await sticker(page, id).and(page.locator('[data-carry="stuck"]')).waitFor()
}

/** Every link on the lid whose centre is not the link itself when the page is asked what is there. */
export async function linksNotUnderTheirOwnCentre(page: Page): Promise<readonly (string | null)[]> {
  return lidLinks(page).evaluateAll((elements) =>
    elements.flatMap((link) => {
      link.scrollIntoView({ block: 'center', behavior: 'instant' })
      const box = link.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return link.contains(hit) ? [] : [link.getAttribute('href')]
    }),
  )
}

/**
 * The links that lie underneath each of some elements. Every element is probed
 * on a grid of points: whatever is painted at a point below the element, and
 * belongs to a link that is not the element's own, is covered by it.
 */
export async function linksCoveredBy(
  page: Page,
  selectors: readonly string[],
  steps: number,
): Promise<readonly string[]> {
  return page.evaluate(
    ({ selectors: each, steps: side }) => {
      const links = [...document.querySelectorAll('main a')]
      const linkAt = (element: Element): Element | undefined =>
        links.find((link) => link.contains(element))
      return each.flatMap((selector) => {
        const added = document.querySelector(selector)
        if (!added || added.getClientRects().length === 0) {
          return [`${selector} is missing`]
        }
        added.scrollIntoView({ block: 'center', behavior: 'instant' })
        const box = added.getBoundingClientRect()
        const points = Array.from({ length: side * side }, (_, index) => ({
          x: box.left + ((index % side) + 0.5) * (box.width / side),
          y: box.top + (Math.floor(index / side) + 0.5) * (box.height / side),
        }))
        // Everything painted at a point, topmost first: a link under the element is covered.
        const under = points.flatMap(({ x, y }) => {
          const stack = document.elementsFromPoint(x, y)
          const at = stack.findIndex((element) => added.contains(element))
          return at < 0 ? [] : stack.slice(at + 1).flatMap((element) => linkAt(element) ?? [])
        })
        return [...new Set(under)]
          .filter((link) => link !== added && !link.contains(added) && !added.contains(link))
          .map((link) => `${selector} covers ${link.getAttribute('href') ?? ''}`)
      })
    },
    { selectors, steps },
  )
}
