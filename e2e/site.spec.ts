import { expect, test } from '@playwright/test'

import { content } from '../src/content'
import { collectConsole, collectRequests, openLid } from './support'

const PAGES = ['/', '/cv/'] as const

/** Each ribbon on the badge, and the CV section it must land on. */
const RIBBONS = [
  { name: /^ORGANIZER/, section: 'organized' },
  { name: /^WINNER/, section: 'wins' },
  { name: 'SPEAKER', section: 'talks' },
  { name: 'BUILDER', section: 'projects' },
  { name: 'INVENTOR', section: 'patents' },
] as const

test('the home page is the lid, headed by his name', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
  await expect(page.locator('[data-sticker]').first()).toBeVisible()
})

test('home reaches /cv/ through the asset-tag sticker, and the CV leads back', async ({ page }) => {
  await openLid(page, 1280)
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

for (const { name, section } of RIBBONS) {
  test(`the ${section} ribbon reaches its CV section`, async ({ page }) => {
    await openLid(page, 390)

    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name }).click()

    await expect(page).toHaveURL(new RegExp(`/cv/#${section}$`))
    await expect(page.locator(`section#${section}`)).toBeInViewport()
  })
}

test('the count stickers reach their CV sections too', async ({ page }) => {
  await openLid(page, 728)

  // On the lid: the career path further down has counts of its own.
  await page
    .locator('[data-lid]')
    .getByRole('link', { name: /hackathons organized/ })
    .click()
  await expect(page).toHaveURL(/\/cv\/#organized$/)
  await expect(page.locator('section#organized')).toBeInViewport()

  await page.goBack()
  await page
    .locator('[data-lid]')
    .getByRole('link', { name: /hackathon wins$/ })
    .click()
  await expect(page).toHaveURL(/\/cv\/#wins$/)
})

for (const width of [1280, 390] as const) {
  test(`the compliance label reaches the patents at ${String(width)} wide`, async ({ page }) => {
    await openLid(page, width)
    const label = page.locator('a[data-sticker="patents"]')

    await expect(label).toContainText('U.S. PAT. NOS. 12,354,083 · 12,536,579')
    await expect(label).toContainText('OTHER PATENTS PENDING')
    await label.click()

    await expect(page).toHaveURL(/\/cv\/#patents$/)
    await expect(page.locator('section#patents')).toBeInViewport()
    await expect(page.locator('section#patents')).toContainText('US 12,354,083 B2')
  })

  test(`the NCR medal reaches the wins at ${String(width)} wide`, async ({ page }) => {
    await openLid(page, width)

    await page
      .getByRole('link', { name: '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads' })
      .click()

    await expect(page).toHaveURL(/\/cv\/#wins$/)
    await expect(page.locator('section#wins')).toContainText('Team Eth Heads')
  })
}

test('the lid counts nine wins on the seal and on the ribbon', async ({ page }) => {
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
