import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { EMPLOYER_IDS } from '../src/features/lid/stickers'
import { collectConsole, collectRequests, openLid } from './support'

const PAGES = ['/', '/cv/'] as const
/**
 * A tilted heading's corners poke past its own box, and the longest heading
 * runs a little off a phone's edge. "Whole" allows for that much.
 */
const WHOLE = 0.95

/** Each ribbon on the badge, in the order it hangs, and the section of this page it must land on. */
const RIBBONS = [
  { name: 'ENGINEER', section: 'work' },
  { name: /^WINNER/, section: 'wins' },
  { name: 'BUILDER', section: 'projects' },
  { name: /^ORGANIZER/, section: 'organized' },
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

test('the ribbons are the six things he is, in the order of the page', async ({ page }) => {
  await openLid(page, 728)
  const ribbons = page.getByRole('navigation', { name: 'Sections' }).getByRole('link')

  await expect(ribbons).toHaveCount(RIBBONS.length)
  await expect(ribbons).toHaveText([
    'ENGINEER',
    `WINNER ×${String(stats.wins.total)}`,
    'BUILDER',
    `ORGANIZER ×${String(stats.organized.count)}`,
    'SPEAKER',
    'INVENTOR',
  ])
})

for (const { name, section } of RIBBONS) {
  test(`the ${section} ribbon reaches its section of this page`, async ({ page }) => {
    await openLid(page, 390)

    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name }).click()

    await expect(page).toHaveURL(new RegExp(`/#${section}$`))
    await expect(page.locator(`section#${section}`)).toBeInViewport()
    await expect(page.locator(`section#${section} h2`)).toBeInViewport({ ratio: WHOLE })
  })
}

test('the count stickers reach their sections of this page too', async ({ page }) => {
  await openLid(page, 728)

  await page.getByRole('link', { name: /hackathons organized/ }).click()
  await expect(page).toHaveURL(/\/#organized$/)
  await expect(page.locator('section#organized')).toBeInViewport()

  await page.goBack()
  await page.getByRole('link', { name: /hackathon wins$/ }).click()
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

  test(`the compliance label reaches the patents at ${String(width)} wide`, async ({ page }) => {
    await openLid(page, width)
    const label = page.locator('a[data-sticker="patents"]')

    await expect(label).toContainText('U.S. PAT. NOS. 12,354,083 · 12,536,579')
    await expect(label).toContainText('OTHER PATENTS PENDING')
    await label.click()

    await expect(page).toHaveURL(/\/#patents$/)
    await expect(page.locator('section#patents')).toBeInViewport()
  })

  test(`the NCR medal reaches the wins at ${String(width)} wide`, async ({ page }) => {
    await openLid(page, width)

    await page
      .getByRole('link', { name: '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads' })
      .click()

    await expect(page).toHaveURL(/\/#wins$/)
    await expect(page.locator('section#wins')).toBeInViewport()
  })
}

test('the hello tag introduces the whole career, from the records', async ({ page }) => {
  await openLid(page, 1440)
  const hello = page.locator('[data-sticker="hello"]')

  await expect(hello).toContainText(`I build AI agents at ${content.profile.role.organization}.`)
  await expect(hello).toContainText('two granted patents')
  await expect(hello.locator('mark')).toHaveText('AI agents')
  expect(stats.patents.granted).toBe(2)
})

test('the home page describes the whole career to a search engine', async ({ page }) => {
  await page.goto('/')

  const description = page.locator('meta[name="description"]')
  for (const { organization } of content.experience) {
    await expect(description).toHaveAttribute('content', new RegExp(organization))
  }
  await expect(description).toHaveAttribute('content', /2 granted patents/)
})

test('the lid counts nine wins on the seal and on the ribbon', async ({ page }) => {
  await openLid(page, 728)

  await expect(page.getByRole('link', { name: '9 hackathon wins' })).toBeVisible()
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
