import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { expect, type Page, test } from '@playwright/test'

import { MOCKUPS, openMockup, saveScreenshot, SCREENSHOT_DIR } from './mockup'
import { diffScreenshots, OUTSIDE, type Region } from './pixelDiff'
import { openLid } from './support'

/*
 * The lid's own screenshots for review, and the comparison with the approved
 * mockup. Both pages are rendered at the mockup's 728px with motion reduced.
 */

const REVIEW_WIDTHS = [1280, 728, 390] as const
const COMPARED_WIDTH = 728

/*
 * A faithful port differs from the mockup only where design/mockups/DEVIATIONS.md
 * says it should: recoloured lettering, drawn glyphs, the photo's new pipeline
 * and the hex badge's larger foot line. Those repaint about 2% of the page.
 * The tolerance leaves room for that and little else.
 */
const MAX_DIFFERENCE = 0.03

/** The stickers the recorded departures touch. Every other sticker must match. */
const DEPARTED = [
  'lanyard', // lettering in ink, stars drawn
  'badge', // photo through the image pipeline, "real title" in the darker pink, arrow drawn
  'hello', // HELLO in ink
  'cv', // arrow drawn
  'wins-count', // figure in ink
  'organized-count', // stars drawn
  'bitcoin-plus-plus', // mark in ink
  'lightning-welder', // lettering moved up, foot line enlarged
  'tally', // sixteenth mark drawn by the generator
  'elsewhere', // stars drawn
  'more-elsewhere', // stars drawn
] as const

/** Stickers that overlap a departed one, and so share some of its changed pixels. */
const MAX_UNTOUCHED_DIFFERENCE = 0.001

/** The box around each sticker and everything inside it. */
async function stickerRegions(page: Page): Promise<readonly Region[]> {
  return page.locator('[data-sticker]').evaluateAll((stickers) =>
    stickers.map((sticker) => {
      const boxes = [sticker, ...sticker.querySelectorAll('*')]
        .map((element) => element.getBoundingClientRect())
        .filter(({ width, height }) => width > 0 && height > 0)
      return {
        name: sticker.getAttribute('data-sticker') ?? '',
        left: Math.min(...boxes.map(({ left }) => left)),
        top: Math.min(...boxes.map(({ top }) => top)) + window.scrollY,
        right: Math.max(...boxes.map(({ right }) => right)),
        bottom: Math.max(...boxes.map(({ bottom }) => bottom)) + window.scrollY,
      }
    }),
  )
}

for (const width of REVIEW_WIDTHS) {
  test(`saves lid-${String(width)}.png`, async ({ page }) => {
    await openLid(page, width)

    const image = await saveScreenshot(page, `lid-${String(width)}.png`)

    expect(image.byteLength).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}

test('looks like the approved mockup at 728 wide', async ({ page, context }) => {
  const mockupPage = await context.newPage()
  await openMockup(mockupPage, MOCKUPS.firstScreen, COMPARED_WIDTH)
  const mockup = await mockupPage.screenshot({ fullPage: true, animations: 'disabled' })
  await openLid(page, COMPARED_WIDTH)
  const lid = await page.screenshot({ fullPage: true, animations: 'disabled' })

  const diff = await diffScreenshots(page, mockup, lid, await stickerRegions(page))
  const pixels = diff.width * diff.height
  const share = (count: number): string => `${((count / pixels) * 100).toFixed(2)}%`
  const untouched = Object.entries(diff.byRegion).filter(
    ([name]) => name !== OUTSIDE && !DEPARTED.some((departed) => departed === name),
  )
  const report = {
    width: diff.width,
    height: diff.height,
    difference: share(diff.differing),
    tolerance: share(MAX_DIFFERENCE * pixels),
    bySticker: Object.fromEntries(
      Object.entries(diff.byRegion)
        .toSorted(([, one], [, other]) => other - one)
        .map(([name, count]) => [name, share(count)]),
    ),
  }
  await writeFile(join(SCREENSHOT_DIR, 'lid-728-difference.png'), diff.image)
  await writeFile(
    join(SCREENSHOT_DIR, 'lid-728-difference.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  test.info().annotations.push({ type: 'difference', description: JSON.stringify(report) })

  expect([diff.width, diff.height]).toEqual([COMPARED_WIDTH, 1300])
  expect(diff.ratio).toBeLessThanOrEqual(MAX_DIFFERENCE)
  for (const [name, count] of untouched) {
    expect(count / pixels, `${name} should match the mockup`).toBeLessThanOrEqual(
      MAX_UNTOUCHED_DIFFERENCE,
    )
  }
})
