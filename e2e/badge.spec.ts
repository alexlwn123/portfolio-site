import { expect, type Page, test } from '@playwright/test'

import { labelWidth } from '../src/features/stickers/geometry/labelFace'
import { STRAP_LETTERING } from '../src/features/stickers/geometry/lanyard'
import { boxOf, type Box, openLid, openLivelyLid, sticker } from './support'

/*
 * The badge on its lanyard, worked by hand in a real browser: picked up,
 * pulled until the straps stretch, let go to swing home. Run at the three
 * widths the lid is laid out for.
 */

const WIDTHS = [390, 728, 1280] as const
/** How far a strap may be pulled past its length, as a share of it, with a hair for rounding. */
const MOST_STRETCH = 0.12 + 0.01
/** Back home means within this many px of where it hung. */
const HOME_PX = 3

const card = (page: Page) => page.locator('[data-badge-card]')

/** Waits until the badge has stopped moving and the script has handed it back to the stylesheet. */
async function asleep(page: Page): Promise<void> {
  await expect(sticker(page, 'badge')).toHaveAttribute('data-hang', '')
  await expect(sticker(page, 'badge')).not.toHaveAttribute('data-hang-moving', { timeout: 8000 })
}

/** The length of the left strap as drawn, in its own units. */
function strapLength(page: Page): Promise<number> {
  return page.evaluate(() => {
    const line = document.querySelector<SVGPathElement>('[data-strap="from"] [data-strap-line]')
    return line?.getTotalLength() ?? 0
  })
}

function strapPath(page: Page): Promise<string | null> {
  return page.locator('[data-strap="from"] [data-strap-line]').getAttribute('d')
}

/** Presses on the card at a share of its box, and moves the pointer by an offset, holding on. */
async function pull(page: Page, from: Box, by: { x: number; y: number }): Promise<void> {
  const start = { x: from.x + from.width / 2, y: from.y + from.height * 0.25 }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + by.x, start.y + by.y, { steps: 12 })
}

async function openAndSettle(page: Page, width: number): Promise<Box> {
  await openLivelyLid(page, width)
  await asleep(page)
  await card(page).scrollIntoViewIfNeeded()
  return boxOf(card(page))
}

for (const width of WIDTHS) {
  test.describe(`the badge at ${String(width)} wide`, () => {
    test('drops in, settles, and then hangs exactly where the page draws it', async ({ page }) => {
      await openLivelyLid(page, width)
      await asleep(page)

      expect(await sticker(page, 'badge').getAttribute('style')).toBeNull()
      expect(await strapPath(page)).toMatch(/^M-?\d+ -?\d+L-?\d+ -?\d+$/)
    })

    test('is picked up and pulled: the badge and its straps follow the pointer', async ({
      page,
    }) => {
      const rest = await openAndSettle(page, width)
      const restPath = await strapPath(page)

      await pull(page, rest, { x: -60, y: -40 })
      await page.waitForTimeout(400)
      const held = await boxOf(card(page))

      expect(Math.abs(held.x - rest.x)).toBeGreaterThan(20)
      expect(await strapPath(page)).not.toBe(restPath)
      await expect(sticker(page, 'badge')).toHaveAttribute('data-hang-held', '')
      await page.mouse.up()
    })

    test('pulled far, the straps stretch, and stop at their limit', async ({ page }) => {
      const rest = await openAndSettle(page, width)
      const restLength = await strapLength(page)

      await pull(page, rest, { x: 40, y: 900 })
      await page.waitForTimeout(600)
      const stretched = await strapLength(page)
      const thin = await page
        .locator('[data-strap="from"]')
        .evaluate((strap) => Number(getComputedStyle(strap).getPropertyValue('--thin')))

      expect(stretched).toBeGreaterThan(restLength * 1.04)
      expect(stretched).toBeLessThan(restLength * (1 + MOST_STRETCH) + 20)
      expect(thin).toBeLessThan(0.95)
      await page.mouse.up()
    })

    test('let go, it swings home within a few seconds and asks for nothing more', async ({
      page,
    }) => {
      const rest = await openAndSettle(page, width)

      await pull(page, rest, { x: 160, y: 120 })
      await page.waitForTimeout(300)
      await page.mouse.up()
      await asleep(page)
      const back = await boxOf(card(page))

      expect(Math.abs(back.x - rest.x)).toBeLessThanOrEqual(HOME_PX)
      expect(Math.abs(back.y - rest.y)).toBeLessThanOrEqual(HOME_PX)
    })

    test('a drag does not follow the ribbon it ends on, and a click on a ribbon still does', async ({
      page,
    }) => {
      await openAndSettle(page, width)
      const ribbon = page.locator('[data-badge-card] nav a').first()
      const href = (await ribbon.getAttribute('href')) ?? ''
      const box = await boxOf(ribbon)
      const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

      await page.mouse.move(middle.x, middle.y)
      await page.mouse.down()
      await page.mouse.move(middle.x + 80, middle.y + 30, { steps: 8 })
      await page.mouse.up()
      await page.waitForTimeout(200)
      expect(new URL(page.url()).pathname).toBe('/')

      await asleep(page)
      await ribbon.click()
      await expect(page).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    })
  })
}

test('tidying the lid puts the badge back from wherever it was left swinging', async ({ page }) => {
  const rest = await openAndSettle(page, 1280)
  await pull(page, rest, { x: -200, y: 60 })
  await page.mouse.up()

  await page.getByRole('button', { name: 'Reset stickers' }).click()

  expect(await sticker(page, 'badge').getAttribute('style')).toBeNull()
  await expect(sticker(page, 'badge')).not.toHaveAttribute('data-hang-moving')
})

test('under reduced motion it does not drop in, and comes straight home when let go', async ({
  page,
}) => {
  await openLid(page, 728)
  await expect(sticker(page, 'badge')).toHaveAttribute('data-hang', '')
  await expect(sticker(page, 'badge')).not.toHaveAttribute('data-hang-moving')
  const rest = await boxOf(card(page))

  await pull(page, rest, { x: 150, y: 0 })
  await page.waitForTimeout(300)
  await page.mouse.up()
  const lefts = await page.evaluate(async () => {
    const badge = document.querySelector<HTMLElement>('[data-sticker="badge"]')
    const seen: number[] = []
    for (let frame = 0; frame < 40; frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      seen.push(Number.parseFloat(badge?.style.getPropertyValue('--hang-dx') ?? '') || 0)
    }
    return seen
  })

  // How far it is from where it hangs: never past it, and never back the way it came.
  expect(lefts[0]).toBeGreaterThan(2)
  for (const [index, left] of lefts.entries()) {
    expect(left).toBeGreaterThanOrEqual(0)
    expect(left).toBeLessThanOrEqual(lefts[index - 1] ?? Infinity)
  }
  await asleep(page)
  expect(Math.abs((await boxOf(card(page))).x - rest.x)).toBeLessThanOrEqual(HOME_PX)
})

test('the lanyard’s lettering is set as long as the browser draws it', async ({ page }) => {
  await openLid(page, 1280)
  const words = await page.evaluate(() =>
    [...document.querySelectorAll<SVGTextPathElement>('[data-lanyard] textPath')].map((word) => {
      const text = word.closest('text')
      const copy = text?.cloneNode(true) as SVGTextElement
      copy.querySelector('textPath')?.removeAttribute('textLength')
      text?.parentNode?.append(copy)
      const natural = copy.getComputedTextLength()
      copy.remove()
      return { text: word.textContent, natural }
    }),
  )

  expect(words.length).toBeGreaterThan(4)
  for (const { text, natural } of words) {
    const set = labelWidth(text, STRAP_LETTERING.size, STRAP_LETTERING.tracking)
    expect(Math.abs(natural - set) / set, text).toBeLessThan(0.03)
  }
})

test.describe('without script', () => {
  test.use({ javaScriptEnabled: false })

  test('nothing is lost: the straps are drawn, the badge hangs, and every ribbon is a link', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.locator('[data-lanyard] [data-strap]')).toHaveCount(2)
    await expect(sticker(page, 'badge')).not.toHaveAttribute('data-hang')
    await expect(page.locator('[data-badge-card] nav a').first()).toBeVisible()
    expect(await page.locator('[data-badge-card] nav a').count()).toBeGreaterThan(3)
    expect(await page.locator('[data-lanyard] textPath').count()).toBeGreaterThan(4)
  })
})
