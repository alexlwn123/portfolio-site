import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { lidNotes, NOTED_IDS } from '../src/features/lid/notes'
import { flattenStickers, linksOf } from '../src/features/lid/stickerSpecs'
import { lidStickers } from '../src/features/lid/stickers'
import {
  boxOf,
  carry,
  collectConsole,
  lidLinks,
  linksCoveredBy,
  linksNotUnderTheirOwnCentre,
  openLid,
  openLivelyLid,
  setDown,
  sticker,
  stickerPlaces,
} from './support'

/*
 * What the home page's script adds to the lid: one lamp, stickers that can be
 * picked up and peeled back, three buttons and three sounds. Most of these run
 * with motion welcome, as a visitor gets it. The ones that measure where
 * things end up run with motion reduced, where nothing is still moving.
 */

const notes = lidNotes(content)
const hrefs = flattenStickers(lidStickers(content, stats)).flatMap(linksOf)

/** Somewhere on the desk, off the lid, for the pointer to rest where it touches nothing. */
const OFF_THE_LID = { x: 4, y: 4 } as const
/** Things that hang and swing, so are never in the same place twice while motion is welcome. */
const SWINGING = ['lanyard', 'badge']
const SAMPLES_PER_SIDE = 12

/** Counts the animation frames and timers the page asks for, from before its script runs. */
async function countWork(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counts = { frames: 0, timers: 0, audio: 0 }
    const requestFrame = window.requestAnimationFrame.bind(window)
    const setTimer = window.setTimeout.bind(window)
    const RealAudio = window.AudioContext
    window.requestAnimationFrame = (callback) => {
      counts.frames += 1
      return requestFrame(callback)
    }
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...rest: unknown[]) => {
      counts.timers += 1
      return setTimer(handler, delay, ...rest)
    }) as typeof window.setTimeout
    window.AudioContext = class extends RealAudio {
      constructor(options?: AudioContextOptions) {
        super(options)
        counts.audio += 1
      }
    }
    Object.assign(window, { lidWork: counts })
  })
}

async function work(page: Page): Promise<{ frames: number; timers: number; audio: number }> {
  return page.evaluate(
    () =>
      (window as unknown as { lidWork: { frames: number; timers: number; audio: number } }).lidWork,
  )
}

/** The lamp as the script last wrote it on the lid, or null where it never has. */
async function lampOf(page: Page): Promise<{ x: number; y: number } | null> {
  return page.locator('[data-lid]').evaluate((lid: HTMLElement) => {
    const [x, y] = [lid.style.getPropertyValue('--lamp-x'), lid.style.getPropertyValue('--lamp-y')]
    return x === '' ? null : { x: Number(x), y: Number(y) }
  })
}

function withoutSwingers(places: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(places).filter(([id]) => !SWINGING.includes(id)))
}

/** The corner of a sticker that peels. It shows when the sticker is under the pointer. */
async function cornerOf(page: Page, id: string) {
  await sticker(page, id).hover()
  return sticker(page, id).locator('[data-peel-tab]')
}

function noteOf(page: Page, id: string) {
  return sticker(page, id).locator('[data-note]')
}

/** How long the stickers take to slap down on a page opened with motion welcome. */
const SLAP_MS = 1500

interface TouchScreen {
  readonly context: BrowserContext
  readonly page: Page
  /** Reports an orientation, as the phone's sensor would. */
  readonly lean: (beta: number, gamma: number) => Promise<void>
}

/**
 * A phone or tablet: a touch screen. Headless Chromium has the orientation
 * event and no sensor behind it: asked for readings, it sends one event with
 * nothing in it. The test stands in for the sensor. It holds that empty event
 * back and sends events of its own, and it answers the question iOS asks.
 */
async function touchScreen(
  browser: Browser,
  width: number,
  permission: 'granted' | 'denied' = 'granted',
): Promise<TouchScreen> {
  // The screen is given as well as the viewport: it is what says the phone is held upright.
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    screen: { width, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  })
  await context.addInitScript((answer) => {
    if (typeof window.DeviceOrientationEvent !== 'function') {
      return
    }
    Object.assign(window.DeviceOrientationEvent, {
      requestPermission: () => Promise.resolve(answer),
    })
    const holdBackEmpty = (event: DeviceOrientationEvent): void => {
      if (event.isTrusted) {
        event.stopImmediatePropagation()
      }
    }
    window.addEventListener('deviceorientation', holdBackEmpty, true)
  }, permission)
  const page = await context.newPage()
  await page.goto('/')
  await page.locator('[data-lid][data-enhanced]').waitFor()
  await page.waitForTimeout(SLAP_MS)
  const lean = (beta: number, gamma: number): Promise<void> =>
    page.evaluate(
      ([front, side]) => {
        window.dispatchEvent(
          Object.assign(new Event('deviceorientation'), { beta: front, gamma: side }),
        )
      },
      [beta, gamma],
    )
  return { context, page, lean }
}

test.describe('one lamp for the whole lid', () => {
  test('the lamp follows the pointer and the loop stops when idle', async ({ page }) => {
    await countWork(page)
    await openLivelyLid(page, 1280)
    const lid = await boxOf(page.locator('[data-lid]'))

    await page.mouse.move(lid.x + lid.width * 0.8, lid.y + lid.height * 0.25, { steps: 6 })
    await expect.poll(() => lampOf(page)).toEqual({ x: 0.8, y: 0.25 })

    // Settled: no frame and no timer is asked for while the pointer is still.
    await expect
      .poll(async () => {
        const before = await work(page)
        await page.waitForTimeout(400)
        const after = await work(page)
        return [after.frames - before.frames, after.timers - before.timers]
      })
      .toEqual([0, 0])

    const rested = await work(page)
    await page.mouse.move(lid.x + lid.width * 0.2, lid.y + lid.height * 0.4, { steps: 6 })
    await expect.poll(() => lampOf(page)).toEqual({ x: 0.2, y: 0.4 })
    expect((await work(page)).frames).toBeGreaterThan(rested.frames)
  })

  test('the lamp is two custom properties on the lid, and every sticker on screen reads them', async ({
    page,
  }) => {
    await openLivelyLid(page, 1280)
    const lid = await boxOf(page.locator('[data-lid]'))
    const shadowOf = (): Promise<string> =>
      sticker(page, 'hello').evaluate((element) => getComputedStyle(element).filter)

    await page.mouse.move(lid.x + 20, lid.y + 20, { steps: 4 })
    await expect.poll(() => lampOf(page)).not.toBeNull()
    await expect.poll(async () => (await lampOf(page))?.x).toBeLessThan(0.05)
    const fromTopLeft = await shadowOf()
    await page.mouse.move(lid.x + lid.width - 20, lid.y + 800, { steps: 4 })
    await expect.poll(async () => (await lampOf(page))?.x).toBeGreaterThan(0.95)
    const fromRight = await shadowOf()

    expect(fromTopLeft).not.toBe(fromRight)
    const written = await page
      .locator('[data-lid]')
      .evaluate((element: HTMLElement) => [...element.style])
    expect(written).toEqual(['--lamp-x', '--lamp-y'])
    await expect(sticker(page, 'hello')).toHaveAttribute('data-lit', '')
    // What is far off screen is not lit, so it does not repaint as the lamp moves.
    await expect(sticker(page, 'more-elsewhere')).not.toHaveAttribute('data-lit')
  })

  test('the foil turns with the lamp: the CSS foil and the SVG foil alike', async ({ page }) => {
    await openLivelyLid(page, 1280)
    const lid = await boxOf(page.locator('[data-lid]'))
    const foil = () =>
      page.evaluate(() => ({
        sheen: document.getElementById('lid-foil')?.getAttribute('gradientTransform'),
        glow: document.getElementById('name-glow')?.getAttribute('cx'),
        roles: getComputedStyle(
          document.querySelector('[data-sticker="badge"] ul') ?? document.body,
        ).backgroundImage,
      }))

    await page.mouse.move(lid.x + 30, lid.y + 30, { steps: 4 })
    await expect.poll(async () => (await lampOf(page))?.x).toBeLessThan(0.05)
    const left = await foil()
    await page.mouse.move(lid.x + lid.width - 30, lid.y + 700, { steps: 4 })
    await expect.poll(async () => (await lampOf(page))?.x).toBeGreaterThan(0.95)
    const right = await foil()

    expect(right.sheen).not.toBe(left.sheen)
    expect(right.glow).not.toBe(left.glow)
    expect(right.roles).not.toBe(left.roles)
  })

  test('with no pointer the lamp drifts, on a timer and not on every frame', async ({ page }) => {
    await countWork(page)
    await openLivelyLid(page, 1280)

    const before = await work(page)
    await page.waitForTimeout(2000)
    const after = await work(page)

    // A frame a few times a second, where following a pointer takes sixty.
    expect(after.frames - before.frames).toBeGreaterThan(2)
    expect(after.frames - before.frames).toBeLessThan(40)
  })

  test('reduced motion leaves no running animations and peel still toggles', async ({ page }) => {
    await countWork(page)
    await openLid(page, 728)
    const lid = await boxOf(page.locator('[data-lid]'))
    const before = await stickerPlaces(page)

    await page.mouse.move(lid.x + 600, lid.y + 300, { steps: 5 })
    expect(await lampOf(page)).toBeNull()
    await expect(page.locator('[data-lit]')).toHaveCount(0)

    await (await cornerOf(page, 'latest-win')).click()
    await expect(noteOf(page, 'latest-win')).toBeVisible()
    await expect(noteOf(page, 'latest-win')).toHaveCSS('opacity', '1')
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(noteOf(page, 'latest-win')).toBeHidden()
    // The lamp never ran and the peel was a plain toggle: not one frame or timer was asked for.
    expect(await work(page)).toMatchObject({ frames: 0, timers: 0 })

    // Tidy still works, and a carried sticker sticks where it is let go.
    await carry(page, 'wins-count', { x: -120, y: 90 })
    expect(await stickerPlaces(page)).not.toEqual(before)
    await page.getByRole('button', { name: 'Tidy the lid' }).click()
    await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    expect(await stickerPlaces(page)).toEqual(before)

    // Carrying a sticker takes frames while it is in the hand, and none once it is let go.
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    const rested = await work(page)
    await page.waitForTimeout(300)
    expect(await work(page)).toEqual(rested)
    expect(rested.timers).toBe(0)
  })
})

/** How many points across a dropped sticker are looked under. */
const POINTS_ACROSS = 9

test.describe('pick up, throw, re-stick', () => {
  test('dragging moves and raises a sticker without navigating', async ({ page }) => {
    await openLivelyLid(page, 1280)
    const cv = sticker(page, 'cv')
    const before = await boxOf(cv)
    const url = page.url()

    // Across the pile, onto the employers' tags.
    await setDown(page, 'cv', { x: 440, y: -60 })

    const after = await boxOf(cv)
    expect(after.x - before.x).toBeGreaterThan(400)
    expect(page.url()).toBe(url)
    // Where it was dropped it lies on top of whatever was there. It is on top at its middle,
    // and somewhere across it there is another sticker underneath: the tags it was dropped on
    // have gaps between them, so one point alone could fall in a gap.
    const onTop = await cv.evaluate((element, across) => {
      const { left, top, width, height } = element.getBoundingClientRect()
      const middle = document.elementsFromPoint(left + width / 2, top + height / 2)
      const stacks = Array.from({ length: across }, (_, index) =>
        document.elementsFromPoint(left + ((index + 0.5) * width) / across, top + height / 2),
      )
      return {
        first: element.contains(middle[0] ?? null),
        overAnother: stacks.some((stack) =>
          stack.some((under) => {
            const other = under.closest('[data-sticker]')
            return other !== null && other !== element
          }),
        ),
      }
    }, POINTS_ACROSS)
    expect(onTop).toEqual({ first: true, overAnother: true })
  })

  test('a sticker dropped on the badge lies above it, though the badge lies above every sticker', async ({
    page,
  }) => {
    await openLivelyLid(page, 1280)
    const hello = sticker(page, 'hello')
    // The badge drops in and swings: the photo is aimed at once it hangs still.
    await expect(sticker(page, 'badge')).not.toHaveAttribute('data-hang-moving')
    const before = await boxOf(hello)
    // The badge's own box is where it hangs from; its card, and the photo on it, hang below.
    const photo = await boxOf(sticker(page, 'badge').locator('picture').locator('xpath=..'))

    await setDown(page, 'hello', {
      x: photo.x + photo.width / 2 - (before.x + before.width / 2),
      y: photo.y + photo.height / 2 - (before.y + before.height / 2),
    })

    const onTop = await hello.evaluate((element) => {
      const { left, top, width, height } = element.getBoundingClientRect()
      const stack = document.elementsFromPoint(left + width / 2, top + height / 2)
      const badge = document.querySelector('[data-sticker="badge"]')
      return {
        first: element.contains(stack[0] ?? null),
        overBadge: stack.some((under) => badge?.contains(under)),
      }
    })
    expect(onTop).toEqual({ first: true, overBadge: true })
  })

  test('a plain click still navigates', async ({ page }) => {
    await openLivelyLid(page, 1280)
    // The plain CV is in the pile, one scroll down.
    await sticker(page, 'cv').scrollIntoViewIfNeeded()
    const box = await boxOf(sticker(page, 'cv'))
    const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

    // A press that wanders less than 5px is a click.
    await page.mouse.move(middle.x, middle.y)
    await page.mouse.down()
    await page.mouse.move(middle.x + 3, middle.y + 2)
    await page.mouse.up()

    await expect(page).toHaveURL(/\/cv\/$/)
    await page.goBack()
    await page.locator('[data-lid][data-enhanced]').waitFor()
    // The face of a sticker with a note under it is a link like any other.
    await sticker(page, 'lightning-welder').locator('a').first().click()
    await expect(page).toHaveURL(/\/#wins$/)
  })

  test('a sticker cannot leave the lid', async ({ page }) => {
    await openLivelyLid(page, 1280)
    const seal = sticker(page, 'wins-count')
    // The seal is in the pile, one scroll down. Everything is measured once it is in view.
    await seal.scrollIntoViewIfNeeded()
    const lid = await boxOf(page.locator('[data-lid]'))
    const start = await boxOf(seal)

    // Held, with the pointer far off the lid: it stops at the edge.
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(1276, 2, { steps: 15 })
    await page.waitForTimeout(500)
    // In the hand it is lifted and swings, so a corner may reach a little past the edge.
    const held = await boxOf(seal)
    const reach = 0.12
    expect(held.x + held.width * (1 - reach)).toBeLessThanOrEqual(lid.x + lid.width)
    expect(held.y + held.height * reach).toBeGreaterThanOrEqual(lid.y)

    // Thrown at the edge: it bounces back, and comes to rest wholly on the lid.
    await page.mouse.move(900, 400, { steps: 3 })
    await page.mouse.move(1200, 420, { steps: 2 })
    await page.mouse.up()
    await seal.and(page.locator('[data-carry="stuck"]')).waitFor()
    await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)
    const stuck = await boxOf(seal)
    expect(stuck.x).toBeGreaterThanOrEqual(lid.x - 1)
    expect(stuck.x + stuck.width).toBeLessThanOrEqual(lid.x + lid.width + 1)
    expect(stuck.y).toBeGreaterThanOrEqual(lid.y - 1)
    expect(stuck.y + stuck.height).toBeLessThanOrEqual(lid.y + lid.height + 1)
  })

  test('touch scrolls and never drags', async ({ browser }) => {
    const { context, page } = await touchScreen(browser, 390)
    const url = page.url()
    const before = await stickerPlaces(page)
    const box = await boxOf(sticker(page, 'hello'))
    const finger = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const client = await context.newCDPSession(page)

    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [finger] })
    for (let moved = 1; moved <= 12; moved += 1) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: finger.x + moved * 4, y: finger.y - moved * 30 }],
      })
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150)
    await expect(page.locator('[data-carry]')).toHaveCount(0)
    expect(page.url()).toBe(url)
    // The scroll brought the top of the pile into view, and its stickers are slapped down as it
    // does. They are measured once they have landed: where each is stuck has not changed.
    await expect(page.locator('[data-land="slap"]')).toHaveCount(0)
    expect(withoutSwingers(await stickerPlaces(page))).toEqual(withoutSwingers(before))
    await context.close()
  })

  test('tidy restores every sticker', async ({ page }) => {
    await openLivelyLid(page, 1280)
    await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)
    const before = withoutSwingers(await stickerPlaces(page))

    await carry(page, 'cv', { x: 300, y: 200 })
    // The pill goes first: on the wide lid the name, carried, lands on top of it.
    await carry(page, 'city-riga', { x: 400, y: -500 })
    await carry(page, 'name', { x: 120, y: 260 }, { x: 0.5, y: 0.3 })
    await carry(page, 'cv', { x: -80, y: 300 })
    await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)
    expect(withoutSwingers(await stickerPlaces(page))).not.toEqual(before)

    await page.getByRole('button', { name: 'Tidy the lid' }).focus()
    await page.keyboard.press('Enter')
    await page.locator(':focus').blur()

    await expect.poll(async () => withoutSwingers(await stickerPlaces(page))).toEqual(before)
    await expect(page.locator('[data-carry]')).toHaveCount(0)
    await expect(page.locator('[data-sticker][style]')).toHaveCount(0)
  })

  test('every link is still reachable by keyboard and its centre still hit-tests to itself after tidy', async ({
    page,
    baseURL,
  }) => {
    await openLid(page, 728)

    // The seal goes first: on the full-width lid the hello tag, carried, lands on top of it.
    await carry(page, 'wins-count', { x: -200, y: 60 })
    await carry(page, 'hello', { x: 150, y: 400 })
    await carry(page, 'workshop', { x: 200, y: 120 })
    expect((await linksNotUnderTheirOwnCentre(page)).length).toBeGreaterThan(0)
    await (await cornerOf(page, 'ncr-win')).click()
    await page.getByRole('button', { name: 'Tidy the lid' }).click()
    await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)

    expect(await linksNotUnderTheirOwnCentre(page)).toEqual([])
    await expect(lidLinks(page)).toHaveCount(hrefs.length)
    await page.locator('body').evaluate((body) => {
      window.scrollTo(0, 0)
      ;(document.activeElement as HTMLElement | null)?.blur()
      // Start tabbing from the top of the page, not from the button just pressed:
      // the sections under the lid have links of their own.
      body.setAttribute('tabindex', '-1')
      body.focus({ preventScroll: true })
      body.removeAttribute('tabindex')
    })
    // The strap and the sections under the lid have links too: only the lid's are counted.
    const stops = (await page.locator('a[href], button').count()) * 2
    const visited: string[] = []
    for (let stop = 0; visited.length < hrefs.length && stop < stops; stop += 1) {
      await page.keyboard.press('Tab')
      const href = await page.evaluate(() => {
        const focused = document.activeElement
        return focused instanceof HTMLAnchorElement && focused.closest('[data-lid]') !== null
          ? focused.href
          : null
      })
      if (href !== null) {
        visited.push(href)
      }
    }
    expect(visited).toEqual(hrefs.map((href) => new URL(href, baseURL).href))
  })
})

test.describe('peel to reveal', () => {
  test('peel by keyboard reveals the note and Escape closes it', async ({ page }) => {
    await openLivelyLid(page, 1280)
    const corner = page.getByRole('button', { name: 'Peel back Pleb FM' })
    const note = noteOf(page, 'pleb-fm')

    await expect(note).toBeHidden()
    await corner.focus()
    await page.keyboard.press('Enter')

    await expect(corner).toHaveAttribute('aria-expanded', 'true')
    await expect(note).toBeVisible()
    await expect(note).toHaveCSS('opacity', '1')
    await expect(note).toBeInViewport()
    for (const line of [notes['pleb-fm'].title, ...notes['pleb-fm'].lines]) {
      await expect(note).toContainText(line)
    }
    await expect(note.getByRole('link')).toHaveCount(notes['pleb-fm'].links.length)

    // The note's own links come next in the tab order.
    await page.keyboard.press('Tab')
    await expect(note.getByRole('link', { name: /^Site\s*: Pleb FM$/ })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(note).toBeHidden()
    await expect(corner).toHaveAttribute('aria-expanded', 'false')
    await expect(corner).toBeFocused()

    // Space opens it too, and the arrow keys are the keyboard's way of pulling the corner.
    await page.keyboard.press('Space')
    await expect(note).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expect(note).toBeHidden()
    await page.keyboard.press('ArrowUp')
    await expect(note).toBeVisible()
  })

  test('opening one note closes the one that was open', async ({ page }) => {
    await openLid(page, 1280)

    await (await cornerOf(page, 'arion-parking')).click()
    await expect(noteOf(page, 'arion-parking')).toBeVisible()
    await page.getByRole('button', { name: 'Peel back Lightning Welder' }).focus()
    await page.keyboard.press('Enter')

    await expect(noteOf(page, 'lightning-welder')).toBeVisible()
    await expect(noteOf(page, 'arion-parking')).toBeHidden()
    await expect(page.locator('[aria-expanded="true"]')).toHaveCount(1)
  })

  test('every project and win sticker has its story under it', async ({ page }) => {
    await openLid(page, 1280)

    for (const id of NOTED_IDS) {
      await (await cornerOf(page, id)).click()
      const note = noteOf(page, id)

      await expect(note, id).toBeVisible()
      await expect(note, id).toContainText(notes[id].title)
      for (const line of notes[id].lines) {
        await expect(note, id).toContainText(line)
      }
      const links = await note
        .getByRole('link')
        .evaluateAll((found) => found.map((link) => link.getAttribute('href')))
      expect(links, id).toEqual(notes[id].links.map(({ href }) => href))
      // The whole note lies on the lid, where it can be read.
      const [slip, lid] = [await boxOf(note), await boxOf(page.locator('[data-lid]'))]
      expect(slip.x, id).toBeGreaterThanOrEqual(lid.x)
      expect(slip.x + slip.width, id).toBeLessThanOrEqual(lid.x + lid.width)
      await page.keyboard.press('Escape')
      await expect(note, id).toBeHidden()
    }
  })

  test('dragging the corner past halfway opens the note, and short of it the sticker springs back', async ({
    page,
  }) => {
    await openLivelyLid(page, 1280)
    const corner = await cornerOf(page, 'latest-win')
    const [tab, box] = [await boxOf(corner), await boxOf(sticker(page, 'latest-win'))]
    const from = { x: tab.x + tab.width / 2, y: tab.y + tab.height / 2 }
    // The corner travels six tenths of the sticker's diagonal, towards the far corner.
    const reach = Math.hypot(box.width, box.height) * 0.6
    const pullTo = async (share: number): Promise<void> => {
      const along = (reach * share) / Math.SQRT2
      await page.mouse.move(from.x, from.y)
      await page.mouse.down()
      await page.mouse.move(from.x - along, from.y - along, { steps: 10 })
    }

    await pullTo(0.3)
    await expect(sticker(page, 'latest-win')).toHaveAttribute('data-peel', 'held')
    await page.mouse.up()
    await expect(sticker(page, 'latest-win')).not.toHaveAttribute('data-peel')
    await expect(noteOf(page, 'latest-win')).toBeHidden()

    await pullTo(0.8)
    await page.mouse.up()
    await expect(corner).toHaveAttribute('aria-expanded', 'true')
    await expect(noteOf(page, 'latest-win')).toBeVisible()
    await expect(noteOf(page, 'latest-win')).toHaveCSS('opacity', '1')
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('clicking the face of a sticker still follows its link, peeled or not', async ({ page }) => {
    await openLid(page, 1280)

    await (await cornerOf(page, 'latest-win')).click()
    await expect(noteOf(page, 'latest-win')).toBeVisible()
    await sticker(page, 'latest-win').locator('a').first().click()

    await expect(page).toHaveURL(/\/#wins$/)
  })

  test('a note never traps the visitor: a press, a key or the Tab key gets past it', async ({
    page,
  }) => {
    await openLid(page, 1280)
    const lid = await boxOf(page.locator('[data-lid]'))
    let coveredAtAll = 0

    for (const [index, id] of NOTED_IDS.entries()) {
      await (await cornerOf(page, id)).click()
      await expect(noteOf(page, id), id).toBeVisible()
      await page.mouse.move(OFF_THE_LID.x, OFF_THE_LID.y)
      coveredAtAll += (await linksNotUnderTheirOwnCentre(page)).length

      // Escape re-sticks it, and so does a press anywhere that is not the sticker itself.
      if (index % 2 === 0) {
        await page.keyboard.press('Escape')
      } else {
        await noteOf(page, id).evaluate((note) => {
          note.scrollIntoView({ block: 'center' })
        })
        await page.mouse.click(lid.x - 40, 450)
      }
      await expect(noteOf(page, id), id).toBeHidden()
      expect(await linksNotUnderTheirOwnCentre(page), id).toEqual([])
    }
    // The test means something: some note did lie over a neighbour's link while it was out.
    expect(coveredAtAll).toBeGreaterThan(0)

    // By keyboard: tabbing on past the note's last link re-sticks it behind the visitor.
    const corner = page.getByRole('button', { name: `Peel back ${notes['pleb-fm'].title}` })
    await corner.focus()
    await page.keyboard.press('Enter')
    for (let stop = 0; stop <= notes['pleb-fm'].links.length; stop += 1) {
      await page.keyboard.press('Tab')
    }
    await expect(noteOf(page, 'pleb-fm')).toBeHidden()
    const focused = page.locator(':focus')
    await expect(focused).toBeInViewport()
    expect(
      await focused.evaluate((element) => {
        const { left, top, width, height } = element.getBoundingClientRect()
        return element.contains(document.elementFromPoint(left + width / 2, top + height / 2))
      }),
    ).toBe(true)
  })
})

test.describe('the buttons', () => {
  for (const width of [390, 820] as const) {
    test(`"tilt me" shows on a touch screen ${String(width)} wide, and covers no link`, async ({
      browser,
    }) => {
      const { context, page } = await touchScreen(browser, width)
      const tilt = page.getByRole('button', { name: 'Tilt me' })

      await expect(tilt).toBeVisible()
      await expect(tilt).toHaveAttribute('aria-pressed', 'false')
      expect(
        await linksCoveredBy(
          page,
          ['[data-sticker="tilt"]', '[data-sticker="sound"]', '[data-sticker="tidy"]'],
          SAMPLES_PER_SIDE,
        ),
      ).toEqual([])
      const box = await boxOf(tilt)
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24)
      await context.close()
    })
  }

  test('"tilt me" asks for motion, then a tilted phone moves the lamp', async ({ browser }) => {
    const { context, page, lean } = await touchScreen(browser, 390)
    const tilt = page.getByRole('button', { name: 'Tilt me' })

    await tilt.tap()
    await expect(tilt).toHaveAttribute('aria-pressed', 'true')
    // However the phone is held when the readings start is level: the lamp rests.
    await lean(40, 0)
    await lean(40, 20)
    await expect.poll(async () => (await lampOf(page))?.x ?? 0).toBeGreaterThan(0.6)
    await expect.poll(async () => (await lampOf(page))?.y ?? 0).toBeCloseTo(0.3, 2)

    // Further than the range, the lamp goes no further.
    await lean(40, 89)
    await expect.poll(async () => (await lampOf(page))?.x ?? 0).toBe(0.85)

    // Pressed again, it lets go of the lamp.
    await tilt.tap()
    await expect(tilt).toHaveAttribute('aria-pressed', 'false')
    await context.close()
  })

  test('"tilt me" goes away when motion is refused, and nothing breaks', async ({ browser }) => {
    const { context, page } = await touchScreen(browser, 390, 'denied')
    const output = collectConsole(page)

    await page.getByRole('button', { name: 'Tilt me' }).tap()

    await expect(page.locator('[data-control="tilt"]')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Tidy the lid' })).toBeVisible()
    expect(output()).toEqual([])
    await context.close()
  })

  test('"tilt me" stays hidden on a desktop', async ({ page }) => {
    await openLivelyLid(page, 1280)

    await expect(page.locator('[data-control="tilt"]')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Sound' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tidy the lid' })).toBeVisible()
  })
})

test.describe('sound, off until asked', () => {
  test('the sound preference survives a reload', async ({ page }) => {
    await openLivelyLid(page, 1280)
    const speaker = page.getByRole('button', { name: 'Sound' })
    const stored = (): Promise<string | null> =>
      page.evaluate(() => window.localStorage.getItem('lid:sound'))

    await expect(speaker).toHaveAttribute('aria-pressed', 'false')
    expect(await stored()).toBeNull()

    await speaker.click()
    await expect(speaker).toHaveAttribute('aria-pressed', 'true')
    expect(await stored()).toBe('{"v":1,"on":true,"reduced":false}')
    await page.reload()
    await expect(speaker).toHaveAttribute('aria-pressed', 'true')

    await speaker.click()
    await expect(speaker).toHaveAttribute('aria-pressed', 'false')
    await page.reload()
    await expect(speaker).toHaveAttribute('aria-pressed', 'false')

    // What is in storage is not trusted: anything malformed means off.
    await page.evaluate(() => {
      window.localStorage.setItem('lid:sound', '{"v":1,"on":"yes","reduced":false}')
    })
    await page.reload()
    await expect(speaker).toHaveAttribute('aria-pressed', 'false')
  })

  test('no audio context is made until sound is asked for, and then only from a gesture', async ({
    page,
  }) => {
    await countWork(page)
    await openLivelyLid(page, 1280)

    await carry(page, 'cv', { x: 200, y: 100 })
    await (await cornerOf(page, 'pleb-fm')).click()
    await page.keyboard.press('Escape')
    expect((await work(page)).audio).toBe(0)

    await page.getByRole('button', { name: 'Sound' }).click()
    expect((await work(page)).audio).toBe(1)
    await carry(page, 'cv', { x: 100, y: 50 })
    expect((await work(page)).audio).toBe(1)

    // Remembered as on: still nothing is made until the visitor does something.
    await page.reload()
    await page.locator('[data-lid][data-enhanced]').waitFor()
    await page.waitForTimeout(300)
    expect((await work(page)).audio).toBe(0)
    await page.mouse.click(OFF_THE_LID.x, OFF_THE_LID.y)
    expect((await work(page)).audio).toBe(1)
  })

  test('playing with everything on the lid writes nothing to the console', async ({ page }) => {
    const output = collectConsole(page)
    await openLivelyLid(page, 1280)

    await page.getByRole('button', { name: 'Sound' }).click()
    await carry(page, 'wins-count', { x: 300, y: 150 })
    await (await cornerOf(page, 'last-pay-wins')).click()
    await expect(noteOf(page, 'last-pay-wins')).toBeVisible()
    // The badge swings, so the pointer is taken to where its first ribbon is now.
    const ribbon = await boxOf(page.locator('[data-sticker="badge"] nav a').first())
    await page.mouse.move(ribbon.x + ribbon.width / 2, ribbon.y + ribbon.height / 2, { steps: 4 })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Tidy the lid' }).click()
    await page.waitForTimeout(500)

    expect(output()).toEqual([])
  })
})
