import { expect, test } from '@playwright/test'

import { saveScreenshot } from './mockup'
import { collectRequests } from './support'

const SECTION_IDS = [
  'experience',
  'wins',
  'organized',
  'talks',
  'projects',
  'patents',
  'press',
  'education',
  'contact',
] as const

const MIN_BODY_FONT_PX = 16

/** The width the CV's review screenshot is taken at. */
const REVIEW_WIDTH = 1280
const REVIEW_HEIGHT = 900

test.describe('/cv/', () => {
  test('makes zero script requests and runs no scripts', async ({ page }) => {
    const requests = collectRequests(page)

    await page.goto('/cv/')
    await page.waitForLoadState('networkidle')

    const scripts = requests().filter((request) => request.resourceType() === 'script')
    expect(scripts.map((request) => request.url())).toEqual([])
    await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(0)
  })

  test('still shows the whole page with JavaScript turned off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('/cv/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('main > section')).toHaveCount(SECTION_IDS.length)
    await context.close()
  })

  test('has one h1 and the landmarks', async ({ page }) => {
    await page.goto('/cv/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeVisible()
  })

  for (const id of SECTION_IDS) {
    test(`section anchor #${id} exists and can be reached from the navigation`, async ({
      page,
    }) => {
      await page.goto('/cv/')
      await page.getByRole('navigation', { name: 'Sections' }).locator(`a[href="#${id}"]`).click()

      await expect(page).toHaveURL(new RegExp(`/cv/#${id}$`))
      await expect(page.locator(`section#${id}`)).toBeInViewport()
    })
  }

  test('lists the granted patents, then the pending application, and no abandoned one', async ({
    page,
  }) => {
    await page.goto('/cv/#patents')
    const patents = page.locator('section#patents')

    await expect(patents).toBeInViewport()
    await expect(
      patents.getByRole('list', { name: 'Patents granted' }).getByRole('listitem'),
    ).toHaveText([/US 12,536,579 B2/, /US 12,354,083 B2/])
    await expect(
      patents.getByRole('list', { name: 'Applications' }).getByRole('listitem'),
    ).toHaveText([/Application US 2023\/0032782 A1/])
    await expect(
      patents.getByRole('link', { name: /^Google Patents\s*: Methods and a system for in-store/ }),
    ).toHaveAttribute('href', 'https://patents.google.com/patent/US12536579B2/en')
    await expect(page.getByText(/abandoned|non-fungible/i)).toHaveCount(0)
  })

  test('shows the ninth win, the corrected AI4All row and the merged talk', async ({ page }) => {
    await page.goto('/cv/')
    const wins = page.locator('section#wins')
    const talks = page.locator('section#talks')

    await expect(
      wins.getByText('9 wins: 6 first places, 2 second places and 1 prize.'),
    ).toBeVisible()
    await expect(
      wins.getByRole('listitem').filter({ hasText: 'NCR Global Hackathon' }),
    ).toContainText('Team Eth Heads')
    await expect(wins.getByRole('listitem').filter({ hasText: 'AI4All' })).toContainText(
      'Prize winner: Bitcoin Education Track',
    )
    await expect(talks.getByRole('listitem').filter({ hasText: 'Sovereign Banks' })).toHaveCount(1)
    await expect(
      talks.getByRole('listitem').filter({ hasText: 'The Alex Lewin Experience' }),
    ).toBeVisible()
  })

  test('names a different number of events beside each total', async ({ page }) => {
    await page.goto('/cv/')
    const organized = page.locator('section#organized')

    await expect(
      organized.getByText('The 12 events with a public head count add up to 1,471 participants.'),
    ).toBeVisible()
    await expect(
      organized.getByText('The 14 events with a public prize figure add up to $263,525 in prizes.'),
    ).toBeVisible()
  })

  test(`saves cv-${String(REVIEW_WIDTH)}.png`, async ({ page }) => {
    await page.setViewportSize({ width: REVIEW_WIDTH, height: REVIEW_HEIGHT })
    await page.goto('/cv/')
    await page.evaluate(() => document.fonts.ready)

    const image = await saveScreenshot(page, `cv-${String(REVIEW_WIDTH)}.png`)

    expect(image.byteLength).toBeGreaterThan(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(REVIEW_WIDTH)
  })

  test('the first Tab stop is a visible skip link', async ({ page }) => {
    await page.goto('/cv/')
    await page.keyboard.press('Tab')

    const focused = page.locator(':focus')
    await expect(focused).toHaveAttribute('href', '#content')
    await expect(focused).toBeInViewport()
  })

  test('focused links show a visible outline', async ({ page }) => {
    await page.goto('/cv/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const outlineWidth = await page
      .locator(':focus')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))
    expect(outlineWidth).toBeGreaterThanOrEqual(2)
  })

  test('sets body text at the reader’s default size or larger, in Bricolage Grotesque', async ({
    page,
  }) => {
    await page.goto('/cv/')
    await page.evaluate(() => document.fonts.ready)

    const body = await page.locator('body').evaluate((element) => {
      const style = getComputedStyle(element)
      return { size: Number.parseFloat(style.fontSize), family: style.fontFamily }
    })
    expect(body.size).toBeGreaterThanOrEqual(MIN_BODY_FONT_PX)
    expect(body.family).toContain('Bricolage Grotesque')
    expect(
      await page.evaluate(() => document.fonts.check('1rem "Bricolage Grotesque Variable"')),
    ).toBe(true)
  })

  test('fits a phone screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/cv/')

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('prints with link addresses written out, no navigation and nothing clipped', async ({
    page,
  }) => {
    await page.goto('/cv/')
    await page.emulateMedia({ media: 'print' })

    const github = page.locator('#contact a[href^="https://github.com"]')
    const printed = await github.evaluate((element) => getComputedStyle(element, '::after').content)
    expect(printed).toContain('github.com')

    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeHidden()
    const clipped = await page.evaluate(
      () =>
        [...document.querySelectorAll('main *')].filter((element) => {
          const { overflowX, overflowY } = getComputedStyle(element)
          return overflowX !== 'visible' || overflowY !== 'visible'
        }).length,
    )
    expect(clipped).toBe(0)
  })
})
