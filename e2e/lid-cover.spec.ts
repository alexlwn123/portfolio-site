import { expect, type Page, test } from '@playwright/test'

import { content } from '../src/content'
import { copy } from '../src/content/copy'
import {
  ARTBOARDS,
  MAX_ARTBOARD_WIDTH_PX,
  PHONE_MAX_WIDTH_PX,
  WIDE_MIN_WIDTH_PX,
} from '../src/features/lid/placement/artboards'
import { COVER_IDS, PILE_IDS } from '../src/features/lid/stickers'
import {
  type Edges,
  edgesOf,
  openCover,
  type Screen,
  sticker,
  stickersCoveringLinks,
} from './support'

/*
 * The lid's two parts. The cover is the first screen and nothing but: the
 * name, the hello tag, the badge on its lanyard and a cue to scroll. The pile
 * is every other sticker, one scroll down, under a heading of its own.
 */

/** The screens the cover must hold on: laptops, a tablet both ways up, and two phones. */
const SCREENS: readonly Screen[] = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
]
/** A screen or two for each of the pile's arrangements. */
const PILE_SCREENS: readonly Screen[] = [
  { width: 1440, height: 900 },
  { width: 900, height: 1100 },
  // The tablet's artboard at its own width, where a unit is a pixel and a near miss shows.
  { width: 728, height: 900 },
  { width: 390, height: 844 },
]
/**
 * Screens short enough that the badge's ribbons trail off the cover and come
 * to rest on the pile: a small laptop, a tablet both ways up, and a phone with
 * its browser's bars showing.
 */
const SHORT_SCREENS: readonly Screen[] = [
  { width: 1280, height: 720 },
  { width: 1100, height: 620 },
  { width: 1024, height: 768 },
  { width: 900, height: 1100 },
  { width: 390, height: 664 },
]
/** What the page's script shows only on a touch screen, and what the phone leaves off. */
const NOT_SHOWN = { wide: ['tilt'], desktop: ['tilt'], phone: ['tilt', 'tally'] } as const
/** Each sticker is probed on a grid of this many points a side. */
const SAMPLES_PER_SIDE = 12
/** Rounding, and the hair a turned corner pokes out by. */
const HAIR_PX = 1

function named({ width, height }: Screen): string {
  return `${String(width)} by ${String(height)}`
}

function arrangementAt(width: number): keyof typeof NOT_SHOWN {
  if (width <= PHONE_MAX_WIDTH_PX) {
    return 'phone'
  }
  return width >= WIDE_MIN_WIDTH_PX ? 'wide' : 'desktop'
}

function isOnScreen(edges: Edges, { width, height }: Screen): boolean {
  return (
    edges.left >= -HAIR_PX &&
    edges.top >= -HAIR_PX &&
    edges.right <= width + HAIR_PX &&
    edges.bottom <= height + HAIR_PX
  )
}

/** The ids of the stickers of a block that are shown, in the order the markup has them. */
async function shownIn(page: Page, block: string): Promise<readonly string[]> {
  return page
    .locator(`${block} [data-sticker]`)
    .evaluateAll((stickers) =>
      stickers
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => element.getAttribute('data-sticker') ?? ''),
    )
}

/** An element's layout box on the page, before any turn: its left and right edges. */
async function layoutEdges(page: Page, selector: string): Promise<{ left: number; right: number }> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const steps = (at: Element | null, left: number): number =>
        at instanceof HTMLElement ? steps(at.offsetParent, left + at.offsetLeft) : left
      const left = steps(element, 0)
      return { left, right: left + (element as HTMLElement).offsetWidth }
    })
}

test.describe('the cover', () => {
  for (const screen of SCREENS) {
    test(`is exactly one screen tall at ${named(screen)}`, async ({ page }) => {
      await openCover(page, screen)

      const cover = await edgesOf(page.locator('[data-lid-cover]'))
      expect(cover.top).toBe(0)
      expect(cover.left).toBe(0)
      expect(cover.right).toBe(screen.width)
      expect(cover.bottom).toBeCloseTo(screen.height, 0)
    })

    test(`shows the name and the hello tag whole, and the badge’s photo and name, at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)
      const badge = sticker(page, 'badge')

      for (const id of ['name', 'hello', 'cue'] as const) {
        expect(isOnScreen(await edgesOf(sticker(page, id)), screen), id).toBe(true)
      }
      // The frame the photo shows through: the picture itself is larger, and cropped by it.
      const photo = await edgesOf(badge.locator('picture').locator('xpath=..'))
      const given = await edgesOf(badge.getByText(content.profile.givenName, { exact: true }))
      const family = await edgesOf(badge.getByText(content.profile.familyName, { exact: true }))
      expect(isOnScreen(photo, screen), 'the photo').toBe(true)
      expect(isOnScreen(given, screen), 'the given name').toBe(true)
      expect(isOnScreen(family, screen), 'the family name').toBe(true)
    })

    test(`holds nothing else, and shows no sticker of the pile, at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)

      expect(await shownIn(page, '[data-lid-cover]')).toEqual(COVER_IDS)
      const showing = await page.locator('[data-lid-pile] [data-sticker]').evaluateAll(
        (stickers, tall) =>
          stickers
            .filter((element) => element.getClientRects().length > 0)
            .filter((element) => element.getBoundingClientRect().top < tall)
            .map((element) => element.getAttribute('data-sticker')),
        screen.height,
      )
      expect(showing).toEqual([])
      // No buttons, no counts, no tags: its only links are the six ribbons and the cue.
      await expect(page.locator('[data-lid-cover]').getByRole('link')).toHaveCount(7)
      await expect(page.locator('[data-lid-cover]').getByRole('button')).toHaveCount(0)
    })

    test(`keeps the hello tag, the name and the cue clear of the badge at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)
      // The sleeve is the card itself. The ribbons under it trail off the screen.
      const card = await edgesOf(page.locator('[data-badge-card] > :first-child'))

      for (const id of ['name', 'hello', 'cue'] as const) {
        const box = await edgesOf(sticker(page, id))
        const apart =
          box.right <= card.left ||
          box.left >= card.right ||
          box.bottom <= card.top ||
          box.top >= card.bottom
        expect(apart, `${id} and the badge's card`).toBe(true)
      }
    })
  }

  test('says hello in two short lines, from the records', async ({ page }) => {
    await openCover(page, { width: 1440, height: 900 })
    const { city, regionCode } = content.profile.location
    const [job] = content.experience

    await expect(sticker(page, 'hello')).toHaveText(
      new RegExp(
        `^HELLO\\s+I’m a\\s+software engineer from ${city}, ${regionCode}\\.\\s+` +
          `I build AI agents at ${job?.organization ?? ''}\\.\\s*$`,
      ),
    )
    await expect(sticker(page, 'hello').locator('mark')).toHaveText(copy.lid.hello.highlight)
  })

  test('writes a cue to scroll in his marker, which leads to the pile', async ({ page }) => {
    await openCover(page, { width: 1440, height: 900 })
    const cue = page.getByRole('link', { name: copy.lid.cue.text })

    await expect(cue).toHaveAttribute('data-sticker', 'cue')
    expect(
      await cue
        .locator('span')
        .first()
        .evaluate((words) => getComputedStyle(words).fontFamily),
    ).toContain('Permanent Marker')
    await cue.click()
    await expect(page).toHaveURL(/#pile$/)
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeInViewport()
  })

  for (const screen of SCREENS.filter(({ width }) => width >= WIDE_MIN_WIDTH_PX)) {
    test(`puts the name on the left of the column and the badge on its right at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)
      const column = await page
        .locator('[data-section] [data-section-body]')
        .first()
        .evaluate((body) => {
          const { left, right } = body.getBoundingClientRect()
          return { left, right, unit: Number.parseFloat(getComputedStyle(body).fontSize) }
        })
      const name = await layoutEdges(page, '[data-sticker="name"]')
      const sleeve = await layoutEdges(page, '[data-badge-card] > :first-child')
      const share = (name.right - name.left) / (column.right - column.left)

      // The same edge every section's heading sits on, to within a unit or so.
      expect(Math.abs(name.left - column.left)).toBeLessThanOrEqual(column.unit)
      expect(Math.abs(sleeve.right - column.right)).toBeLessThanOrEqual(column.unit)
      // The hero: more than half the column, and far larger than the 42% it was.
      expect(share).toBeGreaterThanOrEqual(0.55)
      expect(share).toBeLessThanOrEqual(0.7)
    })
  }

  test('grows with the screen past the width the rest of the page stops at, but only a little', async ({
    page,
  }) => {
    const unitAt = async (screen: Screen): Promise<number> => {
      await openCover(page, screen)
      return page
        .locator('[data-lid-cover]')
        .evaluate((cover) => Number.parseFloat(getComputedStyle(cover).fontSize))
    }
    const pageUnit = MAX_ARTBOARD_WIDTH_PX / (ARTBOARDS.wide.width / 10)

    expect(await unitAt({ width: 1440, height: 900 })).toBeCloseTo(pageUnit, 1)
    const large = await unitAt({ width: 1920, height: 1080 })
    expect(large).toBeGreaterThan(pageUnit)
    expect(await unitAt({ width: 2560, height: 1440 })).toBeCloseTo(large, 2)
  })

  test('takes its unit from the height on a short screen, so the composition still fits', async ({
    page,
  }) => {
    await openCover(page, { width: 1440, height: 700 })
    const short = await page
      .locator('[data-lid-cover]')
      .evaluate((cover) => Number.parseFloat(getComputedStyle(cover).fontSize))

    expect(short).toBeLessThan(1440 / 110)
    for (const id of ['name', 'hello'] as const) {
      expect(isOnScreen(await edgesOf(sticker(page, id)), { width: 1440, height: 700 }), id).toBe(
        true,
      )
    }
  })

  test('grows taller than a screen too short to read it on, sooner than shrink its type', async ({
    page,
  }) => {
    await openCover(page, { width: 844, height: 390 })
    const cover = await page.locator('[data-lid-cover]').evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      unit: Number.parseFloat(getComputedStyle(element).fontSize),
    }))

    expect(cover.unit).toBe(10)
    expect(cover.height).toBeGreaterThan(390)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
})

test.describe('the pile', () => {
  for (const screen of PILE_SCREENS) {
    test(`has every other sticker, each inside it, at ${named(screen)}`, async ({ page }) => {
      await openCover(page, screen)
      const missing: readonly string[] = NOT_SHOWN[arrangementAt(screen.width)]

      expect(await shownIn(page, '[data-lid-pile]')).toEqual(
        PILE_IDS.filter((id) => !missing.includes(id)),
      )
      const pile = await page.locator('[data-lid-pile]').evaluate((element) => {
        const { top, bottom } = element.getBoundingClientRect()
        return { top: top + window.scrollY, bottom: bottom + window.scrollY }
      })
      const outside = await page.locator('[data-lid-pile] [data-sticker]').evaluateAll(
        (stickers, { top, bottom }) =>
          stickers
            .filter((element) => element.getClientRects().length > 0)
            .filter((element) => {
              const box = element.getBoundingClientRect()
              const middle = (box.top + box.bottom) / 2 + window.scrollY
              return middle < top || middle > bottom
            })
            .map((element) => element.getAttribute('data-sticker')),
        pile,
      )
      expect(outside).toEqual([])
    })

    test(`no sticker covers a link at ${named(screen)}`, async ({ page }) => {
      await openCover(page, screen)

      expect(await stickersCoveringLinks(page, SAMPLES_PER_SIDE)).toEqual([])
    })

    test(`starts with a heading sticker on the sections’ left edge at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)
      const headings = page.getByRole('heading', { level: 2 })
      const title = await layoutEdges(page, '[data-sticker="pile-title"]')
      const section = await layoutEdges(page, '[data-section] h2')

      await expect(headings.first()).toHaveText(copy.lid.pile.title.join(' '))
      await expect(headings.first()).toHaveAttribute('data-sticker', 'pile-title')
      expect(title.left).toBeCloseTo(section.left, 0)
      // The same label as a section's: the same type at the same size.
      const sizes = await page
        .locator('[data-sticker="pile-title"] span span, [data-section] h2 span span')
        .evaluateAll((words) => words.slice(0, 2).map((word) => getComputedStyle(word).fontSize))
      expect(new Set(sizes).size).toBe(1)
    })
  }

  for (const screen of SHORT_SCREENS) {
    test(`the ribbons that trail off the cover land on bare lid at ${named(screen)}`, async ({
      page,
    }) => {
      await openCover(page, screen)

      expect(await stickersCoveringLinks(page, SAMPLES_PER_SIDE)).toEqual([])
      const under = await page.evaluate(() => {
        const ribbons = document
          .querySelector('[data-sticker="badge"] nav')
          ?.getBoundingClientRect()
        if (!ribbons) {
          return ['the ribbons are missing']
        }
        return [...document.querySelectorAll('[data-lid-pile] [data-sticker]')]
          .filter((element) => element.getClientRects().length > 0)
          .filter((element) => {
            const box = element.getBoundingClientRect()
            return (
              box.left < ribbons.right &&
              box.right > ribbons.left &&
              box.top < ribbons.bottom &&
              box.bottom > ribbons.top
            )
          })
          .map((element) => element.getAttribute('data-sticker'))
      })
      expect(under).toEqual([])
    })
  }

  test('stops growing where the sections stop, and sits in the middle of the lid', async ({
    page,
  }) => {
    const pileAt = async (
      width: number,
    ): Promise<{ unit: number; left: number; width: number }> => {
      await openCover(page, { width, height: 900 })
      return page.locator('[data-lid-pile]').evaluate((pile) => {
        const { left, width: across } = pile.getBoundingClientRect()
        return { unit: Number.parseFloat(getComputedStyle(pile).fontSize), left, width: across }
      })
    }
    const ems = ARTBOARDS.wide.width / 10

    expect((await pileAt(WIDE_MIN_WIDTH_PX)).unit).toBeCloseTo(WIDE_MIN_WIDTH_PX / ems, 2)
    expect(await pileAt(MAX_ARTBOARD_WIDTH_PX)).toMatchObject({ left: 0 })
    const beyond = await pileAt(2560)
    expect(beyond.unit).toBeCloseTo(MAX_ARTBOARD_WIDTH_PX / ems, 2)
    expect(beyond.width).toBe(MAX_ARTBOARD_WIDTH_PX)
    expect(beyond.left).toBe((2560 - MAX_ARTBOARD_WIDTH_PX) / 2)
    // The sections' own unit, at any width: one page, one measure.
    const section = await page
      .locator('[data-section] [data-units]')
      .first()
      .evaluate((units) => Number.parseFloat(getComputedStyle(units).fontSize))
    expect(beyond.unit).toBeCloseTo(section, 2)
  })

  test('uses the arrangement that belongs to each width', async ({ page }) => {
    const heightAt = async (width: number): Promise<number> => {
      await openCover(page, { width, height: 900 })
      return page.locator('[data-lid-pile]').evaluate((pile) => {
        const { fontSize, height } = getComputedStyle(pile)
        return Math.round((Number.parseFloat(height) / Number.parseFloat(fontSize)) * 10)
      })
    }

    expect(await heightAt(PHONE_MAX_WIDTH_PX)).toBe(ARTBOARDS.phone.height)
    expect(await heightAt(PHONE_MAX_WIDTH_PX + 1)).toBe(ARTBOARDS.desktop.height)
    expect(await heightAt(WIDE_MIN_WIDTH_PX - 1)).toBe(ARTBOARDS.desktop.height)
    expect(await heightAt(WIDE_MIN_WIDTH_PX)).toBe(ARTBOARDS.wide.height)
  })

  test('is the lid still: one surface, one script, from the name to the last link', async ({
    page,
  }) => {
    await openCover(page, { width: 1440, height: 900 })

    await expect(page.locator('[data-lid]')).toHaveCount(1)
    await expect(page.locator('[data-lid] [data-lid-cover]')).toHaveCount(1)
    await expect(page.locator('[data-lid] [data-lid-pile]')).toHaveCount(1)
    const edges = await page.evaluate(() =>
      ['[data-lid-cover]', '[data-lid-pile]', '[data-pinned-strap]'].map((selector) => {
        const box = document.querySelector(selector)?.getBoundingClientRect()
        return {
          top: (box?.top ?? -1) + window.scrollY,
          bottom: (box?.bottom ?? -1) + window.scrollY,
        }
      }),
    )
    const [cover, pile, strap] = edges
    expect(pile?.top).toBeCloseTo(cover?.bottom ?? -1, 0)
    expect(strap?.top).toBeCloseTo(pile?.bottom ?? -1, 0)
  })
})
