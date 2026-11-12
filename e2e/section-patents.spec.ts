import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { publishablePatents } from '../src/content/derive'
import { patentNumber } from '../src/features/cv/describe'
import { MIN_TEXT_PX } from '../src/features/lid/placement/artboards'
import { patentsCopy } from '../src/features/sections/patents/copy'
import { formatPartialDate } from '../src/lib/formatDate'
import {
  COLUMN_WIDTHS,
  columnFaults,
  columnUse,
  type Drawn,
  drawnEach,
  drawnOne,
  isNear,
} from './columnUse'
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

const shown = publishablePatents(content.patents)
const RIVETS = 4
const INSPECTION_STICKERS = 3
const STICKERS = `[aria-label="${patentsCopy.stickers.list}"] > li`
/** A sticker is stuck on the plate when this much of it is, and over an edge when this much is not. */
const ON_THE_PLATE = 1 / 3
const OFF_THE_PLATE = 1 / 10

/** How much of one thing lies on another, as a share of its own area. */
function shareOn(thing: Drawn, ground: Drawn): number {
  const across =
    Math.min(thing.fromLeft + thing.width, ground.fromLeft + ground.width) -
    Math.max(thing.fromLeft, ground.fromLeft)
  const down = Math.min(thing.bottom, ground.bottom) - Math.max(thing.top, ground.top)
  return (Math.max(0, across) * Math.max(0, down)) / (thing.width * thing.height)
}

test.describe('the patents plate', () => {
  for (const { width } of SECTION_VIEWPORTS) {
    test(`is on the page at ${String(width)} wide: one plate, a row to a filing`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.locator('[data-plate]')).toBeVisible()
      await expect(section.locator('li[data-patent]')).toHaveCount(shown.length)
      for (const patent of shown) {
        await expect(section.locator(`li[data-patent="${patent.id}"]`)).toBeVisible()
        await expect(section.getByRole('heading', { level: 3, name: patent.title })).toBeVisible()
      }
      await expect(section.locator('[data-rivet]')).toHaveCount(RIVETS)
      await expect(
        section.getByRole('list', { name: patentsCopy.stickers.list }).getByRole('listitem'),
      ).toHaveCount(INSPECTION_STICKERS)
    })

    test(`spills nothing sideways at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'patents')

      expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0)
      expect(await cutOffSideways(section)).toEqual([])
    })

    test(`names every link and leaves its centre clear at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')

      await expectNamedLinks(section, shown.length)
      expect(await linksCoveredAtCentre(section)).toEqual([])
    })

    test(`keeps every sticker off the plate's print at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'patents')
      const rows = await Promise.all(
        shown.map((patent) => pageBox(section.locator(`li[data-patent="${patent.id}"]`))),
      )
      const stickers = await section
        .getByRole('list', { name: patentsCopy.stickers.list })
        .getByRole('listitem')
        .all()

      for (const sticker of stickers) {
        const box = await pageBox(sticker)
        for (const row of rows) {
          const apart =
            box.right <= row.left ||
            box.left >= row.right ||
            box.bottom <= row.top ||
            box.top >= row.bottom
          expect(apart, await sticker.innerText()).toBe(true)
        }
      }
    })
  }

  for (const width of COLUMN_WIDTHS) {
    test(`uses the column at ${String(width)} wide: edge to edge or centred, with no dead block`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')

      expect(columnFaults(await columnUse(section))).toEqual([])
    })

    test(`the plate spans the column, or sits on its middle, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')
      const plate = await drawnOne(section, '[data-plate]')
      const spans = isNear(plate.fromLeft) && isNear(plate.fromRight)

      expect(spans || isNear(plate.offCentre), JSON.stringify(plate)).toBe(true)
    })

    test(`every sticker is stuck on the plate, over one of its edges, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')
      const plate = await drawnOne(section, '[data-plate]')
      const stickers = await drawnEach(section, STICKERS)

      expect(stickers).toHaveLength(INSPECTION_STICKERS)
      for (const [index, sticker] of stickers.entries()) {
        const on = shareOn(sticker, plate)
        expect(on, `sticker ${String(index + 1)} is on the plate`).toBeGreaterThanOrEqual(
          ON_THE_PLATE,
        )
        expect(1 - on, `sticker ${String(index + 1)} hangs over an edge`).toBeGreaterThanOrEqual(
          OFF_THE_PLATE,
        )
      }
    })
  }

  test(`draws no text under ${String(MIN_TEXT_PX)}px on a narrow phone`, async ({ page }) => {
    const section = await openSectionOnNarrowPhone(page, 'patents')
    const sizes = await drawnText(section)

    expect(sizes.length).toBeGreaterThan(shown.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test('makes every number easy to hit with a thumb', async ({ page }) => {
    const section = await openSection(page, PHONE_WIDTH, 'patents')

    for (const { href, height, width } of await linkSizes(section)) {
      expect(height, href).toBeGreaterThanOrEqual(THUMB_PX)
      expect(width, href).toBeGreaterThanOrEqual(THUMB_PX)
    }
  })

  test('counts two granted and one pending, from the derived numbers', async ({ page }) => {
    const section = await openSection(page, 1440, 'patents')
    const counted = (label: string) =>
      section.locator('[data-plate] dt', { hasText: label }).locator('xpath=following-sibling::dd')

    await expect(counted('Patents granted')).toHaveText(String(stats.patents.granted))
    await expect(counted('Application pending')).toHaveText(String(stats.patents.pending))
    await expect(section).not.toContainText(/four patents|abandoned/i)
    await expect(section).toContainText(content.profile.name)
  })

  test('prints every filing as the record has it', async ({ page }) => {
    const section = await openSection(page, 900, 'patents')

    for (const patent of shown) {
      const row = section.locator(`li[data-patent="${patent.id}"]`)
      const link = row.getByRole('link')

      await expect(row.getByRole('heading', { level: 3 })).toHaveText(patent.title)
      await expect(link).toHaveAttribute('href', patent.link.url)
      await expect(link).toHaveAccessibleName(
        `${patentNumber(patent.number)} on ${patent.link.label}`,
      )
      await expect(row).toContainText(patent.assignee)
      for (const inventor of patent.coInventors) {
        await expect(row).toContainText(inventor)
      }
      if (patent.filed !== null) {
        await expect(row).toContainText(formatPartialDate(patent.filed))
      }
      if (patent.status.kind === 'granted') {
        await expect(row).toContainText(`Granted ${formatPartialDate(patent.status.granted)}`)
        await expect(row).toContainText('Patent no.')
      } else {
        await expect(row).toContainText('Application pending')
        await expect(row).toContainText('Application no.')
        await expect(row).not.toContainText('Patent no.')
      }
    }
  })

  test('leaves the abandoned application off the plate', async ({ page }) => {
    const section = await openSection(page, 1440, 'patents')
    const hidden = content.patents.filter((patent) => !patent.shown)

    expect(hidden.length).toBeGreaterThan(0)
    for (const patent of hidden) {
      await expect(section).not.toContainText(patent.number.serial)
      await expect(section).not.toContainText(patent.title)
    }
  })

  test('shows the focus ring on a number the keyboard reaches', async ({ page }) => {
    const section = await openSection(page, 900, 'patents')
    const link = section.getByRole('link').first()

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
