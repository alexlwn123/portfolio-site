import { expect, type Page, test } from '@playwright/test'

import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { navCopy } from '../src/features/nav/copy'
import { SECTION_IDS } from '../src/features/sections/sectionIds'
import { openLid } from './support'

/*
 * The strap pinned to the top of the home page: the lanyard's strap laid
 * flat, with the way back to the top and a link to each section. It is CSS
 * and nothing else, with one exception: the page's script brings a link the
 * keyboard reaches wholly into view where the links scroll sideways.
 */

const MIN_TARGET_PX = 24
const WIDTHS = [1440, 728, NARROW_PHONE_PX] as const
/**
 * A tilted heading's corners poke past its own box, and the longest heading
 * runs a little off a phone's edge. "Whole" allows for that much.
 */
const WHOLE = 0.95

function strap(page: Page) {
  return page.getByRole('navigation', { name: navCopy.label })
}

interface Edges {
  readonly top: number
  readonly bottom: number
}

async function edgesOf(page: Page, selector: string): Promise<Edges> {
  return page.locator(selector).evaluate((element) => {
    const { top, bottom } = element.getBoundingClientRect()
    return { top, bottom }
  })
}

test('the strap is a landmark of its own, named differently from the ribbons', async ({ page }) => {
  await openLid(page, 728)

  const names = await page
    .getByRole('navigation')
    .evaluateAll((landmarks) => landmarks.map((nav) => nav.getAttribute('aria-label')))
  expect(names).toEqual(['Sections', 'Elsewhere', 'More elsewhere', navCopy.label])
  await expect(strap(page).getByRole('link')).toHaveText([
    navCopy.top,
    ...SECTION_IDS.map((id) => navCopy.sections[id]),
  ])
})

for (const width of WIDTHS) {
  test(`the strap lies under the lid, then stays at the top of the screen, at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    const lid = await edgesOf(page, '[data-lid]')
    const atRest = await edgesOf(page, '[data-pinned-strap]')

    // Before any scrolling it is not in the way: it lies where the lid ends.
    expect(atRest.top).toBeCloseTo(lid.bottom, 1)

    for (const id of SECTION_IDS) {
      await page.locator(`section#${id}`).evaluate((section) => {
        section.scrollIntoView({ block: 'start' })
      })
      const pinned = await edgesOf(page, '[data-pinned-strap]')
      expect(pinned.top, id).toBe(0)
      await expect(strap(page), id).toBeInViewport({ ratio: 1 })
    }
    // Pulled to the very end of the page, it is still there.
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    expect((await edgesOf(page, '[data-pinned-strap]')).top).toBe(0)
  })

  test(`a strap link lands its section's heading clear of the strap at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    await page.locator('section#work').evaluate((section) => {
      section.scrollIntoView()
    })

    for (const id of SECTION_IDS) {
      const link = strap(page).locator(`a[data-to="${id}"]`)
      await link.scrollIntoViewIfNeeded()
      await link.click()

      await expect(page).toHaveURL(new RegExp(`/#${id}$`))
      const pinned = await edgesOf(page, '[data-pinned-strap]')
      const section = await edgesOf(page, `section#${id}`)
      const heading = await edgesOf(page, `section#${id} h2`)
      const atTheEnd = await page.evaluate(
        () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1,
      )
      // The section starts exactly where the strap ends, unless the page ran out first.
      expect(atTheEnd || Math.abs(section.top - pinned.bottom) <= 1, id).toBe(true)
      expect(section.top, id).toBeGreaterThanOrEqual(pinned.bottom - 1)
      expect(heading.top, id).toBeGreaterThanOrEqual(pinned.bottom)
      await expect(page.locator(`section#${id} h2`), id).toBeInViewport({ ratio: WHOLE })
    }
  })

  test(`the strap's way back returns to the top of the lid at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    await page.locator('section#talks').evaluate((section) => {
      section.scrollIntoView()
    })
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    await strap(page).getByRole('link', { name: navCopy.top }).click()

    await expect(page).toHaveURL(/\/#top$/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  })

  test(`the strap never widens the page at ${String(width)} wide`, async ({ page }) => {
    await openLid(page, width)
    await page.locator('section#wins').evaluate((section) => {
      section.scrollIntoView()
    })

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    const box = await strap(page).boundingBox()
    expect(overflow).toBeLessThanOrEqual(0)
    expect(box?.x).toBe(0)
    expect(box?.width).toBe(width)
  })
}

test('on a phone the links scroll sideways inside the strap, and the way back stays put', async ({
  page,
}) => {
  await openLid(page, NARROW_PHONE_PX)
  await page.locator('section#work').evaluate((section) => {
    section.scrollIntoView()
  })
  const run = strap(page).getByRole('list')
  const top = strap(page).getByRole('link', { name: navCopy.top })
  const last = strap(page).locator(`a[data-to="${SECTION_IDS.at(-1) ?? ''}"]`)

  const before = await run.evaluate((list) => ({
    scrolls: list.scrollWidth > list.clientWidth,
    overflow: getComputedStyle(list).overflowX,
  }))
  expect(before).toEqual({ scrolls: true, overflow: 'auto' })
  await expect(last).not.toBeInViewport({ ratio: 1 })

  await last.scrollIntoViewIfNeeded()

  await expect(last).toBeInViewport({ ratio: 1 })
  await expect(top).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => window.scrollX)).toBe(0)
  expect((await top.boundingBox())?.x).toBe(0)
})

/** How many links back from the foot of the page the keyboard is walked. */
const STOPS_WALKED = 30

test('a link reached by keyboard is never left under the strap', async ({ page }) => {
  await openLid(page, 728)
  await page.locator('section#contact a').last().focus()

  const hidden: string[] = []
  for (let stop = 0; stop < STOPS_WALKED; stop += 1) {
    await page.keyboard.press('Shift+Tab')
    const under = await page.evaluate(() => {
      const focused = document.activeElement
      const pinned = document.querySelector('[data-pinned-strap]')
      if (!focused?.closest('section[data-section]') || !pinned) {
        return null
      }
      const top = focused.getBoundingClientRect().top
      return top < pinned.getBoundingClientRect().bottom ? focused.textContent : null
    })
    if (under !== null) {
      hidden.push(under)
    }
  }

  expect(hidden).toEqual([])
})

test('on a phone, a strap link reached by keyboard is brought wholly into view', async ({
  page,
}) => {
  await openLid(page, NARROW_PHONE_PX)
  await page.locator('section#work').evaluate((section) => {
    section.scrollIntoView()
  })
  const list = await strap(page).getByRole('list').boundingBox()
  const buckle = await strap(page).getByRole('link', { name: navCopy.top }).boundingBox()
  // The buckle is beside the list, not over it: nothing in the list can be under it.
  expect((buckle?.x ?? 0) + (buckle?.width ?? 0)).toBeLessThanOrEqual(list?.x ?? 0)
  await strap(page).getByRole('link').last().focus()

  const cutOff: string[] = []
  for (const id of SECTION_IDS.toReversed().slice(1)) {
    await page.keyboard.press('Shift+Tab')
    const link = strap(page).locator(`a[data-to="${id}"]`)
    await expect(link).toBeFocused()
    const box = await link.boundingBox()
    const left = box?.x ?? 0
    const right = left + (box?.width ?? 0)
    if (left < (list?.x ?? 0) - 1 || right > (list?.x ?? 0) + (list?.width ?? 0) + 1) {
      cutOff.push(`${id} ${String(Math.round(left))}-${String(Math.round(right))}`)
    }
  }

  // The page's script moves a half-hidden link the rest of the way: a browser alone does not.
  expect(cutOff).toEqual([])
})

test('on a phone, a strap link pressed while half in view stays put and is followed', async ({
  page,
}) => {
  await openLid(page, NARROW_PHONE_PX)
  await page.locator('section#work').evaluate((section) => {
    section.scrollIntoView()
  })
  const list = strap(page).getByRole('list')
  await list.evaluate((run) => {
    run.scrollTo({ left: run.scrollWidth, behavior: 'instant' })
  })
  // The first link the list's edge cuts through: part of it shows, part does not.
  const half = await list.evaluate((run) => {
    const edge = run.getBoundingClientRect().left
    const cut = [...run.querySelectorAll('a')].find((link) => {
      const { left, right } = link.getBoundingClientRect()
      return left < edge && right > edge + 1
    })
    return cut
      ? { id: cut.getAttribute('data-to'), right: cut.getBoundingClientRect().right }
      : null
  })
  if (half === null) {
    // No link happens to be cut at this width: there is nothing to press.
    return
  }
  const box = await strap(page).getByRole('list').boundingBox()
  const before = await list.evaluate((run) => run.scrollLeft)

  await page.mouse.click(half.right - 2, (box?.y ?? 0) + (box?.height ?? 0) / 2)

  await expect(page).toHaveURL(new RegExp(`/#${half.id ?? ''}$`))
  expect(await list.evaluate((run) => run.scrollLeft)).toBe(before)
})

test('every strap link is a full-height target, in type no smaller than the lid allows', async ({
  page,
}) => {
  await openLid(page, NARROW_PHONE_PX)

  const links = await strap(page)
    .getByRole('link')
    .evaluateAll((all) =>
      all.map((link) => {
        const { width, height } = link.getBoundingClientRect()
        return { width, height, px: Number.parseFloat(getComputedStyle(link).fontSize) }
      }),
    )
  expect(links).toHaveLength(SECTION_IDS.length + 1)
  for (const { width, height, px } of links) {
    expect(width).toBeGreaterThanOrEqual(MIN_TARGET_PX)
    expect(height).toBeGreaterThanOrEqual(MIN_TARGET_PX)
    expect(px).toBeGreaterThanOrEqual(MIN_TEXT_PX)
  }
})

test('the keyboard reaches every strap link, each with a ring that shows', async ({ page }) => {
  await openLid(page, 728)
  await page.locator('section#work').evaluate((section) => {
    section.scrollIntoView()
  })

  for (const link of await strap(page).getByRole('link').all()) {
    await link.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(link).toBeFocused()
    await expect(link).toBeInViewport({ ratio: 1 })
    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element)
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle }
    })
    expect(outline.width).toBeGreaterThanOrEqual(2)
    expect(outline.style).toBe('solid')
  }
})

test('the page scrolls smoothly, and at once when motion is not welcome', async ({ page }) => {
  await page.goto('/')
  const behaviour = (): Promise<string> =>
    page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)

  expect(await behaviour()).toBe('smooth')

  await page.emulateMedia({ reducedMotion: 'reduce' })

  expect(await behaviour()).toBe('auto')
})

test('the strap works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
  const plain = await context.newPage()
  await plain.setViewportSize({ width: 728, height: 900 })
  await plain.goto('/')

  await strap(plain).locator('a[data-to="organized"]').click()

  await expect(plain).toHaveURL(/\/#organized$/)
  await expect(plain.locator('section#organized h2')).toBeInViewport({ ratio: WHOLE })
  await expect(strap(plain)).toBeInViewport({ ratio: 1 })
  expect((await strap(plain).boundingBox())?.y).toBe(0)
  await context.close()
})
