import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { expect, type Locator, type Page, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { copy } from '../src/content/copy'
import { cvSection } from '../src/features/lid/facts'
import { flattenStickers } from '../src/features/lid/stickerSpecs'
import { lidStickers } from '../src/features/lid/stickers'
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
 * and the hex badge's larger foot line. Those repaint 1.6% of what is compared.
 * The tolerance leaves a point of room for that and little else.
 *
 * It was 3% while the whole page was compared and those departures came to
 * 1.95%. Leaving the additions out (see below) took the recoloured figure on
 * the wins seal out with them, so the tolerance came down by the same 0.3
 * points. The room is what it was.
 */
const MAX_DIFFERENCE = 0.027

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

/*
 * What has been added to the lid since the mockup was approved, listed under
 * "Additions since the mockup" in DEVIATIONS.md. A picture that predates them
 * cannot match them, so the places they occupy are left out of the comparison:
 * not compared, counted in neither the difference nor the total, and painted
 * blue on lid-728-difference.png. Everything else is held to the tolerances
 * above, which have not moved.
 */

/** Two stickers the mockup does not have: the medal and the compliance label. */
const ADDED_STICKERS = ['ncr-win', 'patents'] as const

/**
 * Three city pills moved down to make room for the fifth ribbon. Each is left
 * out twice: where the lid has it now, and where the mockup still has it.
 */
const MOVED_PILLS = ['city-berlin', 'city-toronto', 'city-austin'] as const

/** How far past its box a place is left out, in px. */
interface Margin {
  readonly top: number
  readonly side: number
  readonly bottom: number
}

/**
 * A sticker's shadow falls outside its box, mostly below it: it is cast 5px
 * down and blurred by 5px. This much around the box is left out with it.
 */
const SHADOW: Margin = { top: 3, side: 6, bottom: 12 }
/** Lettering has no shadow. A hair of margin covers its anti-aliased edge. */
const LETTERING: Margin = { top: 2, side: 2, bottom: 2 }
const NONE: Margin = { top: 0, side: 0, bottom: 0 }

/**
 * The left-out places must stay a small part of the page, or the comparison
 * means nothing. They come to 7.9% of it today.
 */
const MAX_EXCLUDED = 0.09

const stickers = flattenStickers(lidStickers(content, stats))

/** What a moved pill reads, which is how the mockup's copy of it is found. */
function pillText(id: string): string {
  const pill = stickers.find((sticker) => sticker.id === id)
  if (pill?.kind !== 'pill') {
    throw new Error(`The sticker "${id}" is not a pill`)
  }
  return pill.text
}

/**
 * One box around every matched element and everything inside them, grown by a
 * margin. Matching nothing is an error: an addition that has gone missing
 * should fail the comparison, not slip out of it.
 */
async function boxAround(elements: Locator, name: string, margin = NONE): Promise<Region> {
  const rects = await elements.evaluateAll((matched) =>
    matched
      .flatMap((element) => [element, ...element.querySelectorAll('*')])
      .map((part) => part.getBoundingClientRect())
      .filter(({ width, height }) => width > 0 && height > 0)
      .map(({ left, top, right, bottom }) => ({
        left,
        top: top + window.scrollY,
        right,
        bottom: bottom + window.scrollY,
      })),
  )
  if (rects.length === 0) {
    throw new Error(`Nothing on the page to draw a box around for "${name}"`)
  }
  return {
    name,
    left: Math.min(...rects.map(({ left }) => left)) - margin.side,
    top: Math.min(...rects.map(({ top }) => top)) - margin.top,
    right: Math.max(...rects.map(({ right }) => right)) + margin.side,
    bottom: Math.max(...rects.map(({ bottom }) => bottom)) + margin.bottom,
  }
}

/** The box around each sticker and everything inside it. Stickers hidden at this width have none. */
async function stickerRegions(page: Page): Promise<readonly Region[]> {
  const all = page.locator('[data-sticker]')
  const ids = await all.evaluateAll((found) =>
    found
      .filter((sticker) => sticker.getClientRects().length > 0)
      .map((sticker) => sticker.getAttribute('data-sticker') ?? ''),
  )
  return Promise.all(ids.map((id) => boxAround(page.locator(`[data-sticker="${id}"]`), id)))
}

/** Where the additions are on the lid: the new stickers, the new ribbon and the changed count. */
async function additionsOnLid(page: Page): Promise<readonly Region[]> {
  const sticker = (id: string): Locator => page.locator(`[data-sticker="${id}"]`)
  const ribbons = page.getByRole('navigation', { name: copy.lid.nav.sections })
  const { winsSeal, ribbons: words } = copy.lid

  return Promise.all([
    ...ADDED_STICKERS.map((id) => boxAround(sticker(id), `added: ${id}`, SHADOW)),
    ...MOVED_PILLS.map((id) => boxAround(sticker(id), `moved to: ${id}`, SHADOW)),
    boxAround(
      ribbons.locator(`a[href="${cvSection('patents')}"]`),
      'added: inventor ribbon',
      SHADOW,
    ),
    // The ninth win changed the count in two places: the seal's figure and the ribbon's.
    boxAround(
      sticker('wins-count').locator('text', { hasText: winsSeal.times(stats.wins.total) }),
      'changed count: wins seal',
      LETTERING,
    ),
    boxAround(
      ribbons.getByText(words.times(stats.wins.total), { exact: true }),
      'changed count: winner ribbon',
      LETTERING,
    ),
  ])
}

/** Where the mockup still has the pills that the lid has moved. */
async function vacatedOnMockup(mockupPage: Page): Promise<readonly Region[]> {
  return Promise.all(
    MOVED_PILLS.map((id) =>
      boxAround(
        mockupPage.locator('.pill', { hasText: new RegExp(`^${pillText(id)}$`, 'i') }),
        `moved from: ${id}`,
        SHADOW,
      ),
    ),
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

test('looks like the approved mockup at 728 wide, the additions aside', async ({
  page,
  context,
}) => {
  const mockupPage = await context.newPage()
  await openMockup(mockupPage, MOCKUPS.firstScreen, COMPARED_WIDTH)
  const mockup = await mockupPage.screenshot({ fullPage: true, animations: 'disabled' })
  await openLid(page, COMPARED_WIDTH)
  const lid = await page.screenshot({ fullPage: true, animations: 'disabled' })
  const excluded = [...(await additionsOnLid(page)), ...(await vacatedOnMockup(mockupPage))]

  const diff = await diffScreenshots(page, mockup, lid, await stickerRegions(page), excluded)
  const pixels = diff.width * diff.height
  const share = (count: number, of = pixels): string => `${((count / of) * 100).toFixed(2)}%`
  // An addition's own box is left out whole, so nothing is ever counted under its name.
  const untouched = Object.entries(diff.byRegion).filter(
    ([name]) => name !== OUTSIDE && !DEPARTED.some((departed) => departed === name),
  )
  const report = {
    width: diff.width,
    height: diff.height,
    difference: share(diff.differing, diff.compared),
    tolerance: share(MAX_DIFFERENCE * diff.compared, diff.compared),
    excluded: share(diff.excluded),
    excludedPlaces: excluded.map(({ name }) => name),
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
  // Every addition was found on the page, and together they are a small part of it.
  expect(excluded).toHaveLength(ADDED_STICKERS.length + MOVED_PILLS.length * 2 + 3)
  expect(diff.excluded / pixels).toBeLessThanOrEqual(MAX_EXCLUDED)
  expect(diff.ratio).toBeLessThanOrEqual(MAX_DIFFERENCE)
  for (const [name, count] of untouched) {
    expect(count / pixels, `${name} should match the mockup`).toBeLessThanOrEqual(
      MAX_UNTOUCHED_DIFFERENCE,
    )
  }
})
