import { type BrowserContext, expect, type Locator, type Page, test } from '@playwright/test'

import { boxOf, openLivelyLid, sticker } from './support'

/*
 * A link that leaves the site opens in a new tab, and the tab the visitor was
 * reading stays where it was. Nothing here reaches the network: every address
 * off the site is answered with an empty page.
 */

const WIDTH = 1280
const ELSEWHERE = '<!doctype html><title>elsewhere</title>'
/** What marks a link to another host that says it opens a new tab. */
const OUT = '[href^="http"][target="_blank"]'
/** A press that wanders this little is still a click, on a sticker that can be picked up. */
const WANDER_PX = 3

async function answerEverythingElse(context: BrowserContext, baseURL: string): Promise<void> {
  const own = new URL(baseURL).origin
  await context.route(
    (url) => url.origin !== own,
    (route) => route.fulfill({ contentType: 'text/html', body: ELSEWHERE }),
  )
}

/** Does something that should open a tab, and checks the new tab and the old one. */
async function expectNewTab(page: Page, link: Locator, press: () => Promise<void>): Promise<void> {
  const before = page.url()
  const address = new URL((await link.getAttribute('href')) ?? '').href

  const [opened] = await Promise.all([page.context().waitForEvent('page'), press()])
  await opened.waitForLoadState('domcontentloaded')

  expect(opened.url()).toBe(address)
  expect(await opened.evaluate(() => window.opener === null)).toBe(true)
  expect(page.url()).toBe(before)
  expect(page.context().pages()).toHaveLength(2)
  await opened.close()
}

test.beforeEach(async ({ context, baseURL }) => {
  await answerEverythingElse(context, baseURL ?? '')
})

test.describe('a link that leaves the site', () => {
  test('opens in a new tab from a sticker on the lid that can be picked up', async ({ page }) => {
    await openLivelyLid(page, WIDTH)
    const link = sticker(page, 'bitcoin-plus-plus')
    await link.scrollIntoViewIfNeeded()
    const box = await boxOf(link)
    const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 }

    await expectNewTab(page, link, async () => {
      await page.mouse.move(middle.x, middle.y)
      await page.mouse.down()
      await page.mouse.move(middle.x + WANDER_PX, middle.y + WANDER_PX)
      await page.mouse.up()
    })
  })

  test('opens in a new tab from a wristband on the lid', async ({ page }) => {
    await openLivelyLid(page, WIDTH)
    const link = sticker(page, 'elsewhere').locator(`a${OUT}`).first()
    await link.scrollIntoViewIfNeeded()

    await expectNewTab(page, link, () => link.click())
  })

  test('opens in a new tab from a sticker in a section', async ({ page }) => {
    await openLivelyLid(page, WIDTH)
    const link = page.locator(`section[data-section] a[data-stuck]${OUT}`).first()

    await expectNewTab(page, link, () => link.click())
  })

  test('opens in a new tab from the keyboard', async ({ page }) => {
    await openLivelyLid(page, WIDTH)
    const link = page.locator(`section#patents a${OUT}`).first()
    await link.focus()

    await expectNewTab(page, link, () => page.keyboard.press('Enter'))
  })

  test('opens in a new tab from the plain CV, which runs no script', async ({ page }) => {
    await page.goto('/cv/')
    const link = page.locator(`main a${OUT}`).first()

    await expectNewTab(page, link, () => link.click())
  })
})

test('a link within the site opens no tab', async ({ page }) => {
  await openLivelyLid(page, WIDTH)
  await sticker(page, 'cv').scrollIntoViewIfNeeded()

  await sticker(page, 'cv').click()

  await expect(page).toHaveURL(/\/cv\/$/)
  expect(page.context().pages()).toHaveLength(1)
})
