import { expect, test } from '@playwright/test'

import { collectConsole, collectRequests } from './support'

const PAGES = ['/', '/cv/'] as const

test('the home page says the lid is coming', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/lid/i)
})

test('home links to /cv/ and back', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /CV/ }).click()

  await expect(page).toHaveURL(/\/cv\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page
    .getByRole('link', { name: /home page/i })
    .first()
    .click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/lid/i)
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
    const foreign = requests.filter((request) => new URL(request.url()).origin !== origin)
    expect(foreign.map((request) => request.url())).toEqual([])
    expect(requests.length).toBeGreaterThan(0)
  })

  test(`${path} produces no console output or page errors`, async ({ page }) => {
    const output = collectConsole(page)

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    expect(output).toEqual([])
  })

  test(`${path} does not block zooming`, async ({ page }) => {
    await page.goto(path)

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i)
  })
}
