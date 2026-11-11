import { expect, test } from '@playwright/test'

import { collectRequests } from './support'

const SECTION_IDS = [
  'experience',
  'wins',
  'organized',
  'talks',
  'projects',
  'press',
  'education',
  'contact',
] as const

const MIN_BODY_FONT_PX = 16

test.describe('/cv/', () => {
  test('makes zero script requests and runs no scripts', async ({ page }) => {
    const requests = collectRequests(page)

    await page.goto('/cv/')
    await page.waitForLoadState('networkidle')

    const scripts = requests.filter((request) => request.resourceType() === 'script')
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
