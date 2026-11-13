import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { expect, type Locator, type Page, test } from '@playwright/test'

import { stats } from '../src/content'
import { copy } from '../src/content/copy'
import { STICKER_IDS } from '../src/features/lid/stickers'
import { sectionAnchor } from '../src/features/sections/sectionIds'
import { MOCKUPS, openMockup, savePartScreenshot, SCREENSHOT_DIR } from './mockup'
import {
  ADDED_SINCE,
  MOCKUP_ARRANGEMENT,
  MOCKUP_SIZE,
  mockupArrangementCss,
} from './mockupArrangement'
import { diffScreenshots, OUTSIDE, type Region } from './pixelDiff'
import { fitWindowToLid, openLid } from './support'

/*
 * The lid's own screenshots for review, and the comparison with the approved
 * mockup.
 *
 * The lid is no longer arranged as the mockup is: it runs edge to edge, and
 * it is a cover one screen tall with a pile under it, each on artboards of
 * its own. So the comparison does not hold the page to the mockup's layout
 * any more. It dresses the lid as the mockup: the two blocks are taken away
 * and each sticker goes back where the mockup had it, on one stage; what the
 * mockup never had is taken off; and the two stickers that now say something
 * else are given the mockup's words back. Then it compares the two pictures.
 * What it guards is how each sticker is drawn. Both pages are rendered at the
 * mockup's 728px with motion reduced.
 */

/** One for each arrangement, and one past where the page's unit stops growing. */
const REVIEW_WIDTHS = [1920, 1440, 728, 390] as const
const COMPARED_WIDTH = MOCKUP_SIZE.width

/*
 * A faithful port differs from the mockup only where design/mockups/DEVIATIONS.md
 * says it should: recoloured lettering, drawn glyphs, the photo's new pipeline
 * and the hex badge's larger foot line. The tolerance leaves about a point of
 * room over that and little else. It has not moved since the additions were
 * first left out of the comparison.
 */
const MAX_DIFFERENCE = 0.027

/** The stickers the recorded departures touch. Every other sticker must match. */
const DEPARTED = [
  'name', // each letter a piece of its own, set without kerning: the E sits two units to the right
  'lanyard', // lettering in ink, stars drawn
  'badge', // photo through the image pipeline, and no "real title" scrawled beside the name
  'hello', // HELLO in ink, the highlighter a stroke of its own
  'cv', // arrow drawn, and the line over it reworded
  'workshop', // the line under the title no longer says the workshop is a "real" one
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
 * Two stickers of the mockup now say something else. For the comparison each
 * is given back what the mockup printed on it, so that the vinyl, the
 * lettering and the cut of both are still held to the mockup.
 */

/** The hello tag's handwriting in the mockup, around the word it ran the highlighter over. */
const MOCKUP_HELLO = {
  before: 'software engineer from Atlanta, GA. I organize and compete in ',
  marked: 'hackathons',
  after: ' around the world.',
} as const

/**
 * The mockup's four ribbons, in the order it hung them, by the section each
 * leads to. Its first two, for the hackathons he organized and the ones he
 * won, are one ribbon now, two ribbons deep, so it takes the room of both.
 */
const MOCKUP_RIBBONS = (['organized', 'wins', 'talks', 'projects'] as const).map(sectionAnchor)

/*
 * Two things a picture of the mockup cannot match. The ninth win changed the
 * figure on the wins seal. And the mockup's ribbons for the hackathons he
 * organized and the ones he won are one ribbon now, with a pin for each
 * (design/mockups/DEVIATIONS.md). Their places are left out of the
 * comparison: not compared, counted in neither the difference nor the total
 * it is a share of, and painted blue on lid-728-difference.png.
 */

/** How far past its box a place is left out, in px. */
interface Margin {
  readonly top: number
  readonly side: number
  readonly bottom: number
}

/** Lettering has no shadow. A hair of margin covers its anti-aliased edge. */
const LETTERING: Margin = { top: 2, side: 2, bottom: 2 }
const NONE: Margin = { top: 0, side: 0, bottom: 0 }

/**
 * The left-out places must stay a small part of the page, or the comparison
 * means nothing. The seal's figure and the ribbon for the hackathons, which
 * is two ribbons deep, come to 3.6% of it.
 */
const MAX_EXCLUDED = 0.04

/**
 * One box around every matched element and everything that shows inside them,
 * grown by a margin. A note tucked under its sticker shows nothing, so it
 * takes no room. Matching nothing is an error: a place that has gone missing
 * should fail the comparison, not slip out of it.
 */
async function boxAround(elements: Locator, name: string, margin = NONE): Promise<Region> {
  const rects = await elements.evaluateAll((matched) =>
    matched
      .flatMap((element) => [element, ...element.querySelectorAll('*')])
      .filter((part) => getComputedStyle(part).visibility !== 'hidden')
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

/** The box around each sticker and everything inside it. Stickers taken off have none. */
async function stickerRegions(page: Page): Promise<readonly Region[]> {
  const all = page.locator('[data-sticker]')
  const ids = await all.evaluateAll((found) =>
    found
      .filter((sticker) => sticker.getClientRects().length > 0)
      .map((sticker) => sticker.getAttribute('data-sticker') ?? ''),
  )
  return Promise.all(ids.map((id) => boxAround(page.locator(`[data-sticker="${id}"]`), id)))
}

/** What the mockup cannot match: the wins seal's figure, and the ribbon that carries the pins. */
async function changedCounts(page: Page): Promise<readonly Region[]> {
  const { winsSeal } = copy.lid
  const figure = page
    .locator('[data-sticker="wins-count"]')
    .locator('text', { hasText: winsSeal.times(stats.wins.total) })
  const pinned = page
    .getByRole('navigation', { name: copy.lid.nav.sections })
    .locator('li', { has: page.locator('[data-pin]') })
    .first()

  return Promise.all([
    boxAround(figure, 'changed count: wins seal', LETTERING),
    boxAround(pinned, 'one ribbon for the hackathons, with pins', LETTERING),
  ])
}

/**
 * Gives the hello tag and the badge back what the mockup printed on them: the
 * mockup's sentence around its highlighted word, and its four ribbons in its
 * order. Anything that cannot be found is an error, not a quiet pass.
 */
async function printAsMockup(page: Page): Promise<void> {
  await page.evaluate(
    ({ hello, ribbons }) => {
      const marked = document.querySelector('[data-sticker="hello"] mark')
      const list = document.querySelector('[data-sticker="badge"] nav ul')
      if (!marked?.parentElement || !list) {
        throw new Error('The hello tag or the ribbons are not where the comparison looks for them')
      }
      // The tag writes a sentence to a line now. The mockup's one sentence goes on one line.
      const line = marked.parentElement
      marked.textContent = hello.marked
      line.replaceChildren(hello.before, marked, hello.after)
      line.parentElement?.replaceChildren(line)
      const hung = ribbons.map((href) =>
        [...list.children].find((item) => item.querySelector(`a[href="${href}"]`) !== null),
      )
      const found = hung.filter((item) => item !== undefined)
      if (found.length !== ribbons.length) {
        throw new Error('A ribbon of the mockup is no longer on the badge')
      }
      // Two of the mockup's ribbons are one now, two ribbons deep. It is hung once, where the
      // first of them was, and an empty item keeps the second one's turn, so that the ribbons
      // after it lean as the mockup's third and fourth did.
      const [first, ...rest] = [...new Set(found)]
      const turn = document.createElement('li')
      list.replaceChildren(...(first ? [first, turn] : []), ...rest)
    },
    { hello: MOCKUP_HELLO, ribbons: MOCKUP_RIBBONS },
  )
}

/** Opens the lid at the mockup's width and dresses it as the mockup. */
async function openLidAsMockup(page: Page): Promise<void> {
  await openLid(page, COMPARED_WIDTH)
  await page.addStyleTag({ content: mockupArrangementCss() })
  await printAsMockup(page)
  // Under reduced motion a sticker that is not a link still eases for 0.01ms, which a busy
  // machine can leave unfinished: the move to the mockup's place is waited for.
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().map(({ finished }) => finished))
  })
}

for (const width of REVIEW_WIDTHS) {
  test(`saves lid-${String(width)}.png`, async ({ page }) => {
    await openLid(page, width)

    // The lid alone: the sections under it have specs of their own.
    const lid = await fitWindowToLid(page)
    const image = await savePartScreenshot(lid, `lid-${String(width)}.png`)

    expect(image.byteLength).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}

test('accounts for every sticker: on the mockup, or added since', () => {
  const compared = Object.keys(MOCKUP_ARRANGEMENT)

  expect([...compared, ...ADDED_SINCE].toSorted()).toEqual([...STICKER_IDS].toSorted())
  expect(ADDED_SINCE).toEqual([
    'contact',
    'cue',
    'pile-title',
    'pile-kicker',
    'job-finite-computer',
    'job-fedi',
    'job-zion',
    'job-blockspaces',
    'job-ncr',
    'ncr-win',
    'patents',
    'tilt',
    'sound',
    'tidy',
  ])
})

test('every sticker of the mockup is still drawn as the mockup drew it', async ({
  page,
  context,
}) => {
  const mockupPage = await context.newPage()
  await openMockup(mockupPage, MOCKUPS.firstScreen, COMPARED_WIDTH)
  const mockup = await mockupPage.screenshot({ fullPage: true, animations: 'disabled' })
  await openLidAsMockup(page)
  // The lid alone: the strap and the sections under it are no part of the mockup.
  const lid = await (await fitWindowToLid(page)).screenshot({ animations: 'disabled' })
  const excluded = await changedCounts(page)

  const diff = await diffScreenshots(page, mockup, lid, await stickerRegions(page), excluded)
  const pixels = diff.width * diff.height
  const share = (count: number, of = pixels): string => `${((count / of) * 100).toFixed(2)}%`
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
    notCompared: ADDED_SINCE,
    bySticker: Object.fromEntries(
      Object.entries(diff.byRegion)
        .toSorted(([, one], [, other]) => other - one)
        .map(([name, count]) => [name, share(count)]),
    ),
  }
  await writeFile(join(SCREENSHOT_DIR, 'lid-728-as-mockup.png'), lid)
  await writeFile(join(SCREENSHOT_DIR, 'lid-728-difference.png'), diff.image)
  await writeFile(
    join(SCREENSHOT_DIR, 'lid-728-difference.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  )
  test.info().annotations.push({ type: 'difference', description: JSON.stringify(report) })

  expect([diff.width, diff.height]).toEqual([MOCKUP_SIZE.width, MOCKUP_SIZE.height])
  // Each left-out place was found on the page, and together they are a small part of it.
  expect(excluded).toHaveLength(2)
  expect(diff.excluded / pixels).toBeLessThanOrEqual(MAX_EXCLUDED)
  expect(diff.ratio).toBeLessThanOrEqual(MAX_DIFFERENCE)
  for (const [name, count] of untouched) {
    expect(count / pixels, `${name} should match the mockup`).toBeLessThanOrEqual(
      MAX_UNTOUCHED_DIFFERENCE,
    )
  }
})

test('dressing the lid as the mockup puts every sticker where the mockup had it', async ({
  page,
}) => {
  await openLidAsMockup(page)

  const places = await page.locator('[data-sticker]').evaluateAll((stickers) =>
    Object.fromEntries(
      stickers
        .filter((sticker) => sticker.getClientRects().length > 0)
        .map((sticker) => {
          const { left, top } = getComputedStyle(sticker)
          return [sticker.getAttribute('data-sticker') ?? '', [left, top]]
        }),
    ),
  )
  const expected = Object.fromEntries(
    Object.entries(MOCKUP_ARRANGEMENT).map(([id, { x, y }]) => [
      id,
      [`${String(x)}px`, `${String(y)}px`],
    ]),
  )

  expect(places).toEqual(expected)
  expect((await page.locator('[data-lid]').boundingBox())?.height).toBe(MOCKUP_SIZE.height)
  await expect(page.locator('[data-sticker="hello"]')).toContainText(MOCKUP_HELLO.marked)
  await expect(
    page.getByRole('navigation', { name: copy.lid.nav.sections }).getByRole('link'),
  ).toHaveText([/^WINNER/, /^ORGANIZER/, 'SPEAKER', 'BUILDER'])
})
