import { expect, type Page, test } from '@playwright/test'

import { openLid } from './support'

/*
 * Nothing that lifts or slides under the pointer may move out from under it.
 * The thing hovered keeps its place and something inside it does the moving,
 * so a pointer resting on an edge holds the hover instead of losing it,
 * dropping the thing back under itself and catching it again, over and over.
 */

const WIDTH = 1440
/** How far inside an edge the pointer rests, in px: less than any lift. */
const INSIDE_PX = 1
/** How many times the pointer is nudged where it rests. */
const NUDGES = 8
/** A nudge too small to leave the spot, so the browser looks again at what is under the pointer. */
const NUDGE_PX = 0.02

const SIDES = ['top', 'right', 'bottom', 'left'] as const
type Side = (typeof SIDES)[number]

/** Everything on the page that moves when hovered, by what it is. */
const MOVERS = [
  ['a sticker on the lid that is a link', '[data-lid] a[data-sticker="cv"]'],
  ['a sticker on the lid that is not', '[data-lid] [data-sticker="hello"]'],
  ['a ribbon on the badge', '[data-badge-card] nav a'],
  ['a pin on a ribbon of the badge', '[data-badge-card] nav a[data-pin]'],
  ['a sticker in a section that is a link', 'section[data-section] a[data-stuck]'],
  ['the address on the return label', 'section#contact a[href^="mailto:"]'],
  ['a patent number on the plate', 'section#patents a[href*="patents.google"]'],
] as const

interface Spot {
  readonly x: number
  readonly y: number
}

/** A point just inside one edge of the first element found, where the element itself is on top. */
async function justInside(page: Page, selector: string, side: Side): Promise<Spot | null> {
  return page.evaluate(
    ({ selector, side, inside }) => {
      const element = document.querySelector(selector)
      if (!element) {
        return null
      }
      element.scrollIntoView({ block: 'center', behavior: 'instant' })
      const box = element.getBoundingClientRect()
      const middle = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      const from = {
        top: { x: middle.x, y: box.top },
        right: { x: box.right, y: middle.y },
        bottom: { x: middle.x, y: box.bottom },
        left: { x: box.left, y: middle.y },
      }[side]
      const reach = Math.hypot(middle.x - from.x, middle.y - from.y)
      const step = { x: (middle.x - from.x) / reach, y: (middle.y - from.y) / reach }
      // Walk in from the edge of the box to where the element is first met: it may be tilted.
      for (let gone = 0; gone < reach; gone += 1) {
        const at = { x: from.x + step.x * gone, y: from.y + step.y * gone }
        const met = document.elementFromPoint(at.x, at.y)
        if (met && element.contains(met)) {
          return { x: at.x + step.x * inside, y: at.y + step.y * inside }
        }
      }
      return null
    },
    { selector, side, inside: INSIDE_PX },
  )
}

async function restsElsewhere(page: Page): Promise<void> {
  await page.mouse.move(0, 0)
}

test.describe('hovering on an edge', () => {
  for (const [what, selector] of MOVERS) {
    for (const side of SIDES) {
      test(`${what} keeps the hover with the pointer on its ${side} edge`, async ({ page }) => {
        await openLid(page, WIDTH)
        await restsElsewhere(page)
        const spot = await justInside(page, selector, side)
        expect(spot, `${selector} is on the page and can be reached`).not.toBeNull()
        const { x, y } = spot ?? { x: 0, y: 0 }
        const element = page.locator(selector).first()
        const before = await element.boundingBox()

        const held: boolean[] = []
        for (let nudge = 0; nudge < NUDGES; nudge += 1) {
          await page.mouse.move(x + (nudge % 2) * NUDGE_PX, y)
          held.push(await element.evaluate((node) => node.matches(':hover')))
        }

        expect(held).toEqual(Array.from({ length: NUDGES }, () => true))
        // What is hovered has not moved: only what is inside it has.
        expect(await element.boundingBox()).toEqual(before)
      })
    }
  }
})
