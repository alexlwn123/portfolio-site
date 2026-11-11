import { expect, type Page, test } from '@playwright/test'

import { pileAnchor } from '../src/features/lid/anchor'
import { SECTION_IDS, sectionAnchor } from '../src/features/sections/sectionIds'
import { diffScreenshots } from './pixelDiff'
import { boxOf, openCover, type Screen } from './support'

/*
 * How the page arrives, when motion is welcome: the cover's name goes on a
 * letter at a time, the pile's stickers are slapped down as they scroll into
 * view, and each section's stickers are pressed on as they do. And what must
 * hold whatever happens: nothing stays hidden, with the script, without it,
 * or with motion reduced.
 */

const LAPTOP: Screen = { width: 1440, height: 900 }
const PHONE: Screen = { width: 390, height: 844 }
/** The cover's arrival is over in about this long, the cue's idle nod aside. */
const ARRIVAL_MS = 1600
/** The name can be read sooner than that. */
const NAME_ON_MS = 1000
/** The share of a picture's pixels that may differ by anti-aliasing alone: one in two thousand. */
const HAIR_OF_DIFFERENCE = 0.0005
/** A landing, with the longest wait before it and a little to spare. */
const LANDED_MS = 4000

interface Playing {
  readonly name: string
  readonly endsMs: number
  readonly forEver: boolean
  readonly delayMs: number
  /** The element it plays on, by its tag. */
  readonly on: string
  /** What it changes. */
  readonly properties: readonly string[]
}

/** Opens a page with motion welcome and waits for its fonts, its photo and its script. */
async function openLively(page: Page, screen: Screen, path = '/'): Promise<void> {
  await page.setViewportSize(screen)
  await page.goto(path)
  await page.locator('[data-lid][data-enhanced]').waitFor()
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => image.decode()))
  })
}

/**
 * Notes down every CSS animation on the cover as the page starts, before any
 * of them has finished: a finished animation is no longer on the page to be
 * asked about, and a busy machine may not ask in time.
 */
async function recordArrival(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const note = (): void => {
      const cover = document.querySelector('[data-lid-cover]')
      const playing = document
        .getAnimations()
        .filter((animation) => animation instanceof CSSAnimation)
        .filter(({ effect }) => effect instanceof KeyframeEffect && cover?.contains(effect.target))
        .map((animation) => {
          const timing = animation.effect?.getComputedTiming()
          return {
            name: animation.animationName,
            endsMs: Number(timing?.endTime ?? 0),
            forEver: timing?.iterations === Infinity,
            delayMs: timing?.delay ?? 0,
            on: animation.effect instanceof KeyframeEffect ? animation.effect.target?.tagName : '',
            properties:
              animation.effect instanceof KeyframeEffect
                ? animation.effect
                    .getKeyframes()
                    .flatMap((frame) => Object.keys(frame))
                    .filter(
                      (key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key),
                    )
                : [],
          }
        })
      Object.assign(window, { arrival: playing })
    }
    document.addEventListener('DOMContentLoaded', () => {
      requestAnimationFrame(note)
    })
  })
}

/** The cover's animations as they were when the page started. */
async function arrivalOf(page: Page): Promise<readonly Playing[]> {
  await page.waitForFunction(() => 'arrival' in window)
  return page.evaluate(() => (window as unknown as { arrival: Playing[] }).arrival)
}

/** Every CSS animation playing now on or inside some elements. */
async function animationsIn(
  page: Page,
  selector: string,
): Promise<readonly Pick<Playing, 'name' | 'forEver'>[]> {
  return page.evaluate((within) => {
    const roots = [...document.querySelectorAll(within)]
    return document
      .getAnimations()
      .filter((animation) => animation instanceof CSSAnimation)
      .filter(
        ({ effect }) =>
          effect instanceof KeyframeEffect && roots.some((root) => root.contains(effect.target)),
      )
      .map((animation) => ({
        name: animation.animationName,
        forEver: animation.effect?.getComputedTiming().iterations === Infinity,
      }))
  }, selector)
}

interface Standing {
  readonly id: string
  /** Held back ("wait"), landing ("slap" or "press"), or null once it is simply on. */
  readonly land: string | null
  readonly opacity: string
  /**
   * True when enough of it is on the screen for the page's script to count it
   * as seen: a quarter of it and a little more, or a quarter of the screen.
   */
  readonly seen: boolean
}

/** The stickers of some block that are shown, with how each stands. */
async function standing(page: Page, selector: string): Promise<readonly Standing[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const { top, bottom, height } = element.getBoundingClientRect()
        const showing = Math.min(bottom, window.innerHeight) - Math.max(top, 0)
        return {
          id: element.getAttribute('data-sticker') ?? element.id,
          land: element.getAttribute('data-land'),
          opacity: getComputedStyle(element).opacity,
          seen: showing >= height * 0.3 || showing >= window.innerHeight * 0.25,
        }
      }),
  )
}

async function scrollTo(page: Page, selector: string, above = 0): Promise<void> {
  await page
    .locator(selector)
    .first()
    .evaluate((element, margin) => {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - margin,
        behavior: 'instant',
      })
    }, above)
}

test.describe('the cover arriving', () => {
  test.beforeEach(async ({ page }) => {
    await recordArrival(page)
  })

  test('the name goes on a letter at a time, every copy of a letter in the same turn', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)

    const letters = (await arrivalOf(page)).filter(({ name }) => name.includes('letter-on'))
    const turns = [...new Set(letters.map(({ delayMs }) => delayMs))].toSorted((a, b) => a - b)

    // Nine letters, each drawn as six copies that land together.
    expect(letters).toHaveLength(54)
    expect(turns).toHaveLength(9)
    expect(turns[0]).toBe(0)
    for (const [index, turn] of turns.entries()) {
      expect(turn - (turns[index - 1] ?? turn)).toBeLessThan(80)
    }
    // The whole name is down in under a second.
    expect(Math.max(...letters.map(({ endsMs }) => endsMs))).toBeLessThan(NAME_ON_MS)
  })

  test('is over in about a second and a half, in order: the name, the tag and its highlighter, the cue', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)

    const cover = await arrivalOf(page)
    const ending = (name: string): number =>
      Math.max(
        ...cover.filter((playing) => playing.name.includes(name)).map(({ endsMs }) => endsMs),
      )
    const starting = (name: string): number =>
      Math.min(
        ...cover.filter((playing) => playing.name.includes(name)).map(({ delayMs }) => delayMs),
      )

    expect(starting('lid-slap')).toBeGreaterThan(starting('letter-on'))
    expect(starting('stroke')).toBeGreaterThanOrEqual(ending('lid-slap'))
    expect(starting('light-pass')).toBeGreaterThanOrEqual(ending('letter-on'))
    expect(starting('cue-on')).toBeGreaterThan(starting('stroke'))
    // The badge is not among them: the page's script has it by now, and drops it by its physics.
    for (const name of ['letter-on', 'lid-slap', 'stroke', 'light-pass', 'cue-on']) {
      expect(ending(name), name).toBeLessThanOrEqual(ARRIVAL_MS)
      expect(ending(name), name).toBeGreaterThan(0)
    }
  })

  test('nothing on the cover loops for ever but the nod of the cue’s arrow, once the script has the badge', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)

    const forEver = (await arrivalOf(page))
      .filter((animation) => animation.forEver)
      .map(({ name }) => name)
    const afterScript = (await animationsIn(page, '[data-lid-cover]')).filter(
      (animation) => animation.forEver,
    )

    // Before the script runs the badge sways from its lanyard. The script hangs it on its physics.
    expect(forEver.filter((name) => !name.includes('sway'))).toHaveLength(1)
    expect(forEver.some((name) => name.includes('cue-nod'))).toBe(true)
    expect(afterScript.map(({ name }) => name).filter((name) => !name.includes('cue-nod'))).toEqual(
      [],
    )
  })

  test('animates nothing but where things are drawn and how much they show', async ({ page }) => {
    await openLively(page, LAPTOP)

    const animated = [...new Set((await arrivalOf(page)).flatMap(({ properties }) => properties))]

    expect(animated.length).toBeGreaterThan(0)
    for (const property of animated) {
      expect(['transform', 'translate', 'rotate', 'scale', 'opacity']).toContain(property)
    }
  })

  test('comes to rest as the still cover: every letter on, the tag down, the cue written', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)
    await page.waitForTimeout(ARRIVAL_MS + 400)

    const shown = await page.evaluate(() =>
      [
        ...document.querySelectorAll('h1 use, [data-sticker="hello"], [data-sticker="cue"] span'),
      ].map((element) => getComputedStyle(element).opacity),
    )
    expect(shown.length).toBeGreaterThan(54)
    expect(new Set(shown)).toEqual(new Set(['1']))
    // The light has crossed and is gone again.
    expect(
      await page.locator('h1 [data-light]').evaluate((light) => getComputedStyle(light).opacity),
    ).toBe('0')
  })
})

test.describe('the pile arriving', () => {
  test('is held back until it scrolls into view, then lands in a cascade, never all on one frame', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)
    await expect(page.locator('[data-lid-pile] [data-land="wait"]').first()).toBeAttached()
    const before = await standing(page, '[data-lid-pile] [data-sticker]')

    expect(before.length).toBeGreaterThan(30)
    expect(new Set(before.map(({ land }) => land))).toEqual(new Set(['wait']))
    expect(new Set(before.map(({ opacity }) => opacity))).toEqual(new Set(['0']))

    await scrollTo(page, '[data-lid-pile]', 80)
    await expect(page.locator('[data-lid-pile] [data-land="slap"]').first()).toBeAttached()
    const delays = await page
      .locator('[data-lid-pile] [data-land="slap"]')
      .evaluateAll((landing) =>
        landing.map((element) =>
          Number.parseFloat((element as HTMLElement).style.getPropertyValue('--land-delay')),
        ),
      )

    // Neighbours never land together, and nothing waits longer than half a second for its turn.
    expect(delays.length).toBeGreaterThan(8)
    expect(new Set(delays).size).toBe(delays.length)
    expect(Math.max(...delays)).toBeLessThanOrEqual(480)
  })

  test('every sticker that has scrolled into view ends up on, with nothing left on it', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)
    await scrollTo(page, '[data-lid-pile]', 80)

    await expect
      .poll(
        async () =>
          (await standing(page, '[data-lid-pile] [data-sticker]')).filter(
            ({ seen, land, opacity }) => seen && (land !== null || opacity !== '1'),
          ),
        { timeout: LANDED_MS },
      )
      .toEqual([])
    // The marks are taken off again: no attribute and no style is left behind.
    await expect(page.locator('[data-lid-pile] [data-land="slap"]')).toHaveCount(0)
    expect(await page.locator('[data-lid-pile] [style]').evaluateAll((left) => left.length)).toBe(0)
  })

  test('a sticker that has landed stays landed', async ({ page }) => {
    await openLively(page, LAPTOP)
    await scrollTo(page, '[data-lid-pile]', 80)
    await expect(page.locator('[data-sticker="pile-title"]')).not.toHaveAttribute('data-land', {
      timeout: LANDED_MS,
    })
    await expect(page.locator('[data-lid-pile] [data-land="slap"]')).toHaveCount(0, {
      timeout: LANDED_MS,
    })
    const landed = (await standing(page, '[data-lid-pile] [data-sticker]')).filter(
      ({ land }) => land === null,
    )

    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await page.waitForTimeout(200)
    await scrollTo(page, '[data-lid-pile]', 80)
    await page.waitForTimeout(200)

    const after = await standing(page, '[data-lid-pile] [data-sticker]')
    expect(landed.length).toBeGreaterThan(20)
    for (const { id } of landed) {
      expect(
        after.find((sticker) => sticker.id === id),
        id,
      ).toMatchObject({ land: null, opacity: '1' })
    }
  })

  test('lands on a phone too, one sticker after another down the screen', async ({ page }) => {
    await openLively(page, PHONE)
    await scrollTo(page, '[data-lid-pile]', 60)

    await expect
      .poll(
        async () =>
          (await standing(page, '[data-lid-pile] [data-sticker]')).filter(
            ({ seen, land, opacity }) => seen && (land !== null || opacity !== '1'),
          ),
        { timeout: LANDED_MS },
      )
      .toEqual([])
  })
})

test.describe('the sections arriving', () => {
  for (const screen of [LAPTOP, PHONE]) {
    test(`everything in every section is on once it has been scrolled to, at ${String(screen.width)} wide`, async ({
      page,
    }) => {
      await openLively(page, screen)
      await expect(page.locator('[data-section] [data-land="wait"]').first()).toBeAttached()

      for (const id of SECTION_IDS) {
        const section = `[data-section="${id}"]`
        const tall = (await boxOf(page.locator(section))).height
        // Down the section a screen at a time, as a visitor reads it.
        for (let down = 0; down < tall; down += screen.height * 0.8) {
          await scrollTo(page, section, -down)
          await expect
            .poll(
              async () =>
                (await standing(page, `${section} [data-stuck]`)).filter(
                  ({ seen, land, opacity }) => seen && (land === 'wait' || opacity === '0'),
                ),
              { timeout: LANDED_MS, message: `${id}, ${String(Math.round(down))}px down` },
            )
            .toEqual([])
        }
      }
      // To the very foot of the page: what lies there is seen too.
      await page.evaluate(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      })
      await expect(page.locator('[data-section] [data-land]')).toHaveCount(0, {
        timeout: LANDED_MS,
      })
      const hidden = (await standing(page, '[data-section] [data-stuck]')).filter(
        ({ opacity }) => opacity !== '1',
      )
      expect(hidden).toEqual([])
    })
  }

  test('each section’s heading is pressed on with the rest: it is one of the stickers', async ({
    page,
  }) => {
    await openLively(page, LAPTOP)

    const headings = page.locator('[data-section] h2 [data-stuck]')
    await expect(headings).toHaveCount(SECTION_IDS.length)
    await expect(headings.first()).toHaveAttribute('data-land', 'wait')
    await scrollTo(page, '[data-section]', 100)
    await expect(headings.first()).not.toHaveAttribute('data-land', 'wait')
    await expect
      .poll(() => headings.first().evaluate((heading) => getComputedStyle(heading).opacity))
      .toBe('1')
  })

  test('what is on screen when the page opens is never hidden, not for a frame', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // Every frame from the first: whether anything well on screen has been made to vanish.
      const vanished: string[] = []
      const look = (): void => {
        const all = document.querySelectorAll('[data-stuck], [data-lid-pile] [data-sticker]')
        for (const element of all) {
          const { top, bottom, height } = element.getBoundingClientRect()
          const inView = height > 0 && bottom > 40 && top < window.innerHeight - 40
          if (inView && getComputedStyle(element).opacity === '0') {
            vanished.push(element.getAttribute('data-sticker') ?? element.className)
          }
        }
        requestAnimationFrame(look)
      }
      requestAnimationFrame(look)
      Object.assign(window, { vanished })
    })
    await openLively(page, LAPTOP)
    await scrollTo(page, '[data-section="work"]', 40)
    await expect(page.locator('[data-section="work"] h2 [data-stuck]')).not.toHaveAttribute(
      'data-land',
      { timeout: LANDED_MS },
    )

    // Opened again where it was left: the browser puts the page back at the section at once.
    await page.reload()
    await page.locator('[data-lid][data-enhanced]').waitFor()
    await page.waitForTimeout(600)

    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(LAPTOP.height)
    const shown = (await standing(page, '[data-section="work"] [data-stuck]')).filter(
      (sticker) => sticker.seen,
    )
    expect(shown.length).toBeGreaterThan(0)
    expect(shown.filter(({ land }) => land !== null)).toEqual([])
    expect(
      await page.evaluate(() => (window as unknown as { vanished: string[] }).vanished),
    ).toEqual([])
  })
})

test.describe('with motion reduced, or without the script', () => {
  test('motion reduced: nothing is ever held back, and nothing moves', async ({ page }) => {
    await openCover(page, LAPTOP)
    await page.locator('[data-lid][data-enhanced]').waitFor()

    for (const selector of [
      '[data-lid-pile]',
      ...SECTION_IDS.map((id) => `[data-section="${id}"]`),
    ]) {
      await scrollTo(page, selector, 60)
      await expect(page.locator('[data-land]')).toHaveCount(0)
    }
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    const dim = await page
      .locator('[data-stuck], [data-lid] [data-sticker]')
      .evaluateAll(
        (all) =>
          all
            .filter((element) => element.getClientRects().length > 0)
            .filter((element) => getComputedStyle(element).opacity !== '1').length,
      )
    expect(dim).toBe(0)
  })

  test('JavaScript off: the pile is whole, the same picture with motion welcome as with it reduced', async ({
    browser,
    page,
  }) => {
    const width = 728
    await openCover(page, { width, height: 900 })
    const pile = Math.ceil((await boxOf(page.locator('[data-lid-pile]'))).height)
    /** A browser without scripts, opened at the pile in a window as tall as the pile is. */
    const openPlain = async (reducedMotion: 'no-preference' | 'reduce'): Promise<Page> => {
      const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion })
      const plain = await context.newPage()
      await plain.setViewportSize({ width, height: pile })
      await plain.goto(pileAnchor())
      await expect(plain.locator('[data-land]')).toHaveCount(0)
      await expect(plain.locator('[data-lid][data-enhanced]')).toHaveCount(0)
      // A link to somewhere on the page glides there when motion is welcome: wait for its end.
      await expect
        .poll(async () => (await plain.locator('[data-lid-pile]').boundingBox())?.y)
        .toBe(0)
      return plain
    }
    const still = await openPlain('reduce')
    const moving = await openPlain('no-preference')

    const { ratio, height } = await diffScreenshots(
      page,
      await moving.screenshot({ animations: 'disabled' }),
      await still.screenshot({ animations: 'disabled' }),
      [],
      [],
    )
    expect(height).toBe(pile)
    // A sticker held back would be thousands of pixels. What is allowed for is a hundred or so
    // on the turned edges of a few stickers, which Chromium draws a hair differently for the
    // first seconds after the page has glided to the pile, and the same after that.
    expect(ratio).toBeLessThan(HAIR_OF_DIFFERENCE)
    await still.context().close()
    await moving.context().close()
  })

  test('JavaScript off: every section’s stickers are simply there', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const plain = await context.newPage()
    await plain.setViewportSize(LAPTOP)
    await plain.goto(sectionAnchor('wins'))

    await expect(plain.locator('[data-land]')).toHaveCount(0)
    await expect(plain.locator('[data-section="wins"] [data-stuck]').first()).toBeVisible()
    await expect(plain.locator('[data-stuck]').first()).toBeAttached()
    await context.close()
  })
})
