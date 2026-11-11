import { expect, test } from '@playwright/test'

import { content } from '../src/content'
import { MIN_TEXT_PX } from '../src/features/lid/placement/artboards'
import { contactCopy } from '../src/features/sections/contact/copy'
import {
  cutOffSideways,
  drawnText,
  expectNamedLinks,
  linksCoveredAtCentre,
  linkSizes,
  openSection,
  openSectionOnNarrowPhone,
  pageBox,
  PHONE_WIDTH,
  SECTION_VIEWPORTS,
  sidewaysScroll,
  THUMB_PX,
} from './sectionsA'

const { profile } = content
/** The address, a strip for each profile link, and the plain CV. */
const LINKS = profile.links.length + 2

test.describe('say hello', () => {
  for (const { width } of SECTION_VIEWPORTS) {
    test(`is on the page at ${String(width)} wide: the label, the strips, the CV tag`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'contact')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.locator('[data-return-label]')).toBeVisible()
      await expect(section.getByText(profile.name)).toBeVisible()
      await expect(section.getByRole('link', { name: new RegExp(profile.email) })).toBeVisible()
      for (const { id } of profile.links) {
        await expect(section.locator(`li[data-band="${id}"]`)).toBeVisible()
      }
      await expect(section.getByRole('link', { name: /Plain CV/ })).toBeVisible()
      await expect(section.getByText(contactCopy.smallPrint)).toBeVisible()
    })

    test(`spills nothing sideways at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'contact')

      expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0)
      expect(await cutOffSideways(section)).toEqual([])
    })

    test(`names every link and leaves its centre clear at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'contact')

      await expectNamedLinks(section, LINKS)
      expect(await linksCoveredAtCentre(section)).toEqual([])
    })

    test(`makes every link easy to hit with a thumb at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'contact')

      for (const { href, height, width: across } of await linkSizes(section)) {
        expect(height, href).toBeGreaterThanOrEqual(THUMB_PX)
        expect(across, href).toBeGreaterThanOrEqual(THUMB_PX)
      }
    })
  }

  test(`draws no text under ${String(MIN_TEXT_PX)}px on a narrow phone`, async ({ page }) => {
    const section = await openSectionOnNarrowPhone(page, 'contact')
    const sizes = await drawnText(section)

    expect(sizes.length).toBeGreaterThan(profile.links.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test('prints his name, his city and the work address from the profile', async ({ page }) => {
    const section = await openSection(page, 1440, 'contact')
    const label = section.locator('[data-return-label]')
    const { city, regionCode } = profile.location

    await expect(label).toContainText(profile.name)
    await expect(label).toContainText(`${city}, ${regionCode}`)
    await expect(label.getByRole('link')).toHaveAttribute('href', `mailto:${profile.email}`)
    await expect(label.getByRole('link')).toContainText(profile.email)
  })

  test('publishes one address and no other', async ({ page }) => {
    const section = await openSection(page, 1440, 'contact')

    await expect(section.locator('a[href^="mailto:"]')).toHaveCount(1)
    const addresses = (await section.innerText()).match(/[\w.+-]+@[\w.-]+/g)
    expect(addresses?.map((address) => address.toLowerCase())).toEqual([profile.email])
  })

  test('has a strip for every profile link, each leading where the record says', async ({
    page,
  }) => {
    const section = await openSection(page, 900, 'contact')

    for (const { id, label, shortLabel, url } of profile.links) {
      const link = section.locator(`li[data-band="${id}"]`).getByRole('link')
      await expect(link).toHaveAttribute('href', url)
      await expect(link).toHaveText(shortLabel ?? label, { ignoreCase: true })
    }
  })

  test('the asset tag leads to the plain CV', async ({ page }) => {
    const section = await openSection(page, PHONE_WIDTH, 'contact')

    await section.getByRole('link', { name: /Plain CV/ }).click()

    await expect(page).toHaveURL(/\/cv\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('is the end of the page: the small print is the last thing on it', async ({ page }) => {
    const section = await openSection(page, 1440, 'contact')
    const smallPrint = await pageBox(section.getByText(contactCopy.smallPrint))
    const links = await Promise.all((await section.getByRole('link').all()).map(pageBox))
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)

    await expect(page.locator('main > section').last()).toHaveAttribute('id', 'contact')
    for (const link of links) {
      expect(link.top).toBeLessThan(smallPrint.top)
    }
    expect(pageHeight - smallPrint.bottom).toBeLessThan(400)
  })

  test('shows the focus ring on the address when the keyboard reaches it', async ({ page }) => {
    const section = await openSection(page, 900, 'contact')
    const link = section.locator('a[href^="mailto:"]')

    await link.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')

    await expect(link).toBeFocused()
    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element)
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle }
    })
    expect(outline.style).toBe('solid')
    expect(outline.width).toBeGreaterThanOrEqual(2)
  })
})
