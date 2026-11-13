import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { publishablePatents } from '../src/content/derive'
import {
  NARROW_PHONE_PX,
  PHONE_MAX_WIDTH_PX,
  WIDE_MIN_WIDTH_PX,
} from '../src/features/lid/placement/artboards'
import { EMPLOYER_IDS } from '../src/features/lid/stickers'
import { collectConsole, collectRequests, openLid } from './support'

const PAGES = ['/', '/cv/'] as const
/**
 * A tilted heading's corners poke past its own box, and the longest heading
 * runs a little off a phone's edge. "Whole" allows for that much.
 */
const WHOLE = 0.95

/**
 * Where the compliance label is checked for holding its print: a width for
 * each arrangement, and the narrowest the phone's and the wide one come at.
 */
const LABEL_WIDTHS = [1440, WIDE_MIN_WIDTH_PX, 728, 390, NARROW_PHONE_PX] as const
/**
 * How many lines the label's print takes: its heading over two rows of
 * numbers, or on a phone two lines across. One more and the label has grown.
 */
const LABEL_LINES = { phone: 2, wider: 3 } as const
/** A line may round up to a pixel past where it is set. */
const HAIR_PX = 1

/**
 * Each way into the page under the badge, in the order they hang, and the
 * section it must land on: a ribbon, or one of the two pins on the ribbon for
 * the hackathons.
 */
const RIBBONS = [
  { name: 'ENGINEER', section: 'work' },
  { name: /^WINNER/, section: 'wins' },
  { name: /^ORGANIZER/, section: 'organized' },
  { name: 'BUILDER', section: 'projects' },
  { name: 'SPEAKER', section: 'talks' },
  { name: 'INVENTOR', section: 'patents' },
] as const

test('the home page is the lid, headed by his name', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
  await expect(page.locator('[data-sticker]').first()).toBeVisible()
})

test('home reaches /cv/ through the asset-tag sticker, and the CV leads back', async ({ page }) => {
  await openLid(page, 1440)
  const tag = page.locator('a[data-sticker="cv"]')

  await expect(tag).toHaveAccessibleName(/Plain CV/)
  await tag.click()

  await expect(page).toHaveURL(/\/cv\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page
    .getByRole('link', { name: /home page/i })
    .first()
    .click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
})

test('the ribbons are the five things he is, with a pin on the hackathons for each count', async ({
  page,
}) => {
  await openLid(page, 728)
  const nav = page.getByRole('navigation', { name: 'Sections' })
  const links = nav.getByRole('link')

  await expect(nav.locator('[data-ribbon]')).toHaveText([
    'ENGINEER',
    'HACKATHONS',
    'BUILDER',
    'SPEAKER',
    'INVENTOR',
  ])
  await expect(links).toHaveCount(RIBBONS.length)
  // A ribbon is named by its word. A pin is a drawing, so it is named by its label.
  const names = await links.evaluateAll((found) =>
    found.map((link) => link.getAttribute('aria-label') ?? link.textContent),
  )
  expect(names).toEqual([
    'ENGINEER',
    `WINNER ×${String(stats.wins.total)}`,
    `ORGANIZER ×${String(stats.organized.count)}`,
    'BUILDER',
    'SPEAKER',
    'INVENTOR',
  ])
  // The hackathons ribbon is not a link itself: its two pins are, each a round button.
  await expect(nav.locator('[data-pin]')).toHaveCount(2)
  await expect(nav.locator('[data-pin] > svg[data-pin-button]')).toHaveCount(2)
  const pins = await nav.locator('[data-pin]').evaluateAll((found) =>
    found.map((pin) => {
      const { width, height } = pin.getBoundingClientRect()
      return {
        round: getComputedStyle(pin).borderRadius === '50%',
        square: Math.abs(width - height),
      }
    }),
  )
  expect(pins.every(({ round, square }) => round && square < 1)).toBe(true)
  await expect(nav.getByText('HACKATHONS')).toBeVisible()
  expect(await nav.getByText('HACKATHONS').evaluate((word) => word.closest('a'))).toBeNull()
})

for (const { name, section } of RIBBONS) {
  test(`the way to ${section} under the badge reaches its section of this page`, async ({
    page,
  }) => {
    await openLid(page, 390)

    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name }).click()

    await expect(page).toHaveURL(new RegExp(`/#${section}$`))
    await expect(page.locator(`section#${section}`)).toBeInViewport()
    await expect(page.locator(`section#${section} h2`)).toBeInViewport({ ratio: WHOLE })
  })
}

test('the count stickers reach their sections of this page too', async ({ page }) => {
  await openLid(page, 728)

  // On the lid: the strap and the career path further down have links of the same name.
  await page
    .locator('[data-lid]')
    .getByRole('link', { name: /hackathons organized/ })
    .click()
  await expect(page).toHaveURL(/\/#organized$/)
  await expect(page.locator('section#organized')).toBeInViewport()

  await page.goBack()
  await page
    .locator('[data-lid]')
    .getByRole('link', { name: /hackathon wins$/ })
    .click()
  await expect(page).toHaveURL(/\/#wins$/)
  await expect(page.locator('section#wins')).toBeInViewport()
})

for (const width of [1440, 728, 390] as const) {
  test(`every employer’s tag reaches the career section at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    const tags = page.getByRole('list', { name: 'Where I have worked' }).getByRole('link')

    await expect(tags).toHaveCount(content.experience.length)
    for (const [index, job] of content.experience.entries()) {
      await expect(tags.nth(index)).toContainText(job.organization)
      await expect(tags.nth(index)).toHaveAttribute('data-sticker', EMPLOYER_IDS[index] ?? '')
    }
    await tags.nth(1).click()

    await expect(page).toHaveURL(/\/#work$/)
    await expect(page.locator('section#work')).toBeInViewport()
  })

  test(`the compliance label lists every filing and reaches the patents at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    const label = page.locator('a[data-sticker="patents"]')
    const serials = publishablePatents(content.patents).map(({ number }) => number.serial)

    expect(serials).toHaveLength(stats.patents.filings)
    await expect(label).toContainText('U.S. PATENT FILINGS')
    for (const serial of serials) {
      await expect(label).toContainText(serial)
    }
    await expect(label).toHaveAccessibleName(
      new RegExp(`^U\\.S\\. PATENT FILINGS .*${serials.at(-1) ?? ''}$`),
    )
    await expect(label).not.toContainText(/grant|pending|abandon/i)
    await label.click()

    await expect(page).toHaveURL(/\/#patents$/)
    await expect(page.locator('section#patents')).toBeInViewport()
  })

  test(`the NCR medal peels, and its note reaches the wins, at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    const medal = page.locator('[data-sticker="ncr-win"]')

    // With the page's script the medal's face is what peels it: a button, named as the link was.
    await medal
      .getByRole('button', { name: '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads' })
      .click()
    await medal
      .locator('[data-note]')
      .getByRole('link', { name: /^Full story/ })
      .click()

    await expect(page).toHaveURL(/\/#wins$/)
    await expect(page.locator('section#wins')).toBeInViewport()
  })
}

for (const width of LABEL_WIDTHS) {
  test(`the compliance label holds its print, and is no line taller, at ${String(width)} wide`, async ({
    page,
  }) => {
    await openLid(page, width)
    // Squared up, so that a run's box is the run itself and not the box around its tilt.
    await page.addStyleTag({
      content: '[data-lid] [data-sticker="patents"]{rotate:none!important}',
    })

    const print = await page.locator('a[data-sticker="patents"]').evaluate((label, hair) => {
      const metal = label.querySelector('[data-sticker-face] > *')
      if (!metal) {
        return { spilt: ['the label has no face'], lines: 0 }
      }
      const box = metal.getBoundingClientRect()
      const { paddingLeft, paddingRight, fontSize } = getComputedStyle(metal)
      const left = box.left + Number.parseFloat(paddingLeft) - hair
      const right = box.right - Number.parseFloat(paddingRight) + hair
      const runs = [...metal.querySelectorAll('span')]
        .filter((run) => run.children.length === 0 && run.getClientRects().length > 0)
        .map((run) => ({ text: run.textContent.trim(), at: run.getBoundingClientRect() }))
      // Runs share a line when their middles are within half a letter's height of each other.
      const middles = runs
        .map(({ at }) => (at.top + at.bottom) / 2)
        .toSorted((one, other) => one - other)
      const apart = Number.parseFloat(fontSize) / 2
      return {
        spilt: runs.flatMap(({ text, at }) => (at.left >= left && at.right <= right ? [] : [text])),
        lines: middles.filter(
          (middle, index) => middle - (middles[index - 1] ?? Number.NEGATIVE_INFINITY) > apart,
        ).length,
      }
    }, HAIR_PX)

    expect(print.spilt).toEqual([])
    expect(print.lines).toBe(width <= PHONE_MAX_WIDTH_PX ? LABEL_LINES.phone : LABEL_LINES.wider)
  })
}

test('the hello tag says who he is and what he does today, from the records', async ({ page }) => {
  await openLid(page, 1440)
  const hello = page.locator('[data-sticker="hello"]')
  const { city, regionCode } = content.profile.location

  await expect(hello).toContainText(`software engineer from ${city}, ${regionCode}.`)
  await expect(hello).toContainText(`I build AI agents at ${content.profile.role.organization}.`)
  await expect(hello.locator('mark')).toHaveText('AI agents')
  // The short hello: the whole career is the pile's business now, and the sections'.
  await expect(hello).not.toContainText('patent')
  expect(content.experience[0]?.organization).toBe(content.profile.role.organization)
})

test('the home page describes the whole career to a search engine', async ({ page }) => {
  await page.goto('/')

  const description = page.locator('meta[name="description"]')
  for (const { organization } of content.experience) {
    await expect(description).toHaveAttribute('content', new RegExp(organization))
  }
  await expect(description).toHaveAttribute(
    'content',
    new RegExp(`named inventor on ${String(stats.patents.filings)} patent filings`),
  )
  await expect(description).not.toHaveAttribute('content', /grant|pending|abandon/i)
})

test('the lid counts nine wins on the seal and on the pin', async ({ page }) => {
  await openLid(page, 728)

  await expect(
    page.locator('[data-lid]').getByRole('link', { name: '9 hackathon wins' }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: /^WINNER/ }),
  ).toHaveText(/×9$/)
})

test('an unknown address gets the 404 page, with ways out', async ({ page }) => {
  const response = await page.goto('/no-such-sticker/')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await expect(page.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/')
  await expect(page.getByRole('link', { name: /CV/ })).toHaveAttribute('href', '/cv/')
})

for (const path of PAGES) {
  test(`${path} makes no third-party requests`, async ({ page, baseURL }) => {
    const requests = collectRequests(page)

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const origin = new URL(baseURL ?? '').origin
    const foreign = requests().filter((request) => new URL(request.url()).origin !== origin)
    expect(foreign.map((request) => request.url())).toEqual([])
    expect(requests().length).toBeGreaterThan(0)
  })

  test(`${path} produces no console output or page errors`, async ({ page }) => {
    const output = collectConsole(page)

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    expect(output()).toEqual([])
  })

  test(`${path} does not block zooming`, async ({ page }) => {
    await page.goto(path)

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i)
  })
}
