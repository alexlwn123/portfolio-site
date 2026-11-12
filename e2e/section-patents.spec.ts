import { expect, type Locator, test } from '@playwright/test'

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

/** What the plate never says of a filing: what became of it, or which kind of filing it is. */
const STATUS_WORDS = /grant|pending|abandon|application|status/i
/** A box may be a pixel off its place once its edges are rounded. */
const HAIR_PX = 1

/** One line of a row's fields: where it starts and ends, and the gaps between its boxes. */
interface FieldLine {
  readonly left: number
  readonly right: number
  readonly gaps: readonly number[]
}

/**
 * A row's fields as they are laid out, line by line, against the edges of the
 * row. Measured before the plate's tilt, so that boxes on one line share a top.
 */
async function fieldLines(row: Locator): Promise<{
  readonly left: number
  readonly right: number
  readonly gap: number
  readonly lines: readonly FieldLine[]
}> {
  return row.locator('dl').evaluate((fields) => {
    const boxes = [...fields.children].flatMap((child) =>
      child instanceof HTMLElement
        ? [
            {
              top: child.offsetTop,
              left: child.offsetLeft,
              right: child.offsetLeft + child.offsetWidth,
            },
          ]
        : [],
    )
    const tops = [...new Set(boxes.map((box) => box.top))].toSorted((one, other) => one - other)
    const lines = tops.map((top) => {
      const line = boxes
        .filter((box) => box.top === top)
        .toSorted((one, other) => one.left - other.left)
      return {
        left: line[0]?.left ?? 0,
        right: line.at(-1)?.right ?? 0,
        gaps: line.slice(1).map((box, index) => box.left - (line[index]?.right ?? 0)),
      }
    })
    const list = fields as HTMLElement
    return {
      left: list.offsetLeft,
      right: list.offsetLeft + list.offsetWidth,
      gap: Number.parseFloat(getComputedStyle(list).columnGap),
      lines,
    }
  })
}

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

    test(`leaves no hole in a row: its fields run from edge to edge at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')

      for (const patent of shown) {
        const { left, right, gap, lines } = await fieldLines(
          section.locator(`li[data-patent="${patent.id}"]`),
        )

        expect(lines.length, patent.id).toBeGreaterThan(0)
        for (const line of lines) {
          expect(Math.abs(line.left - left), patent.id).toBeLessThanOrEqual(HAIR_PX)
          expect(Math.abs(line.right - right), patent.id).toBeLessThanOrEqual(HAIR_PX)
          for (const between of line.gaps) {
            expect(Math.abs(between - gap), patent.id).toBeLessThanOrEqual(HAIR_PX)
          }
        }
      }
    })

    test(`keeps every sticker off the plate's print at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'patents')
      const rows = await Promise.all(
        [
          section.locator('[data-count]'),
          ...shown.map((patent) => section.locator(`li[data-patent="${patent.id}"]`)),
        ].map((printed) => pageBox(printed)),
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

  test('sets a filing’s fields on one row on a laptop, the number first', async ({ page }) => {
    const section = await openSection(page, 1440, 'patents')

    for (const patent of shown) {
      const row = section.locator(`li[data-patent="${patent.id}"]`)

      expect((await fieldLines(row)).lines, patent.id).toHaveLength(1)
      await expect(row.locator('dt').first()).toHaveText(patentsCopy.plate.fields.number)
    }
  })

  for (const { width } of SECTION_VIEWPORTS) {
    test(`counts every filing in one box, from the derived number, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'patents')
      const count = section.locator('[data-count]')
      const { label, many } = patentsCopy.plate.count

      await expect(count).toHaveCount(1)
      await expect(count.locator('dt')).toHaveText(label)
      await expect(count.locator('[data-figure]')).toHaveText(String(stats.patents.filings))
      await expect(count.locator('dd')).toHaveText(`${String(stats.patents.filings)} ${many}`)
      // The figure and its words stay inside the box that holds them.
      const box = await pageBox(count)
      for (const part of await count.locator('dt, dd > span').all()) {
        const inside = await pageBox(part)
        expect(inside.left, await part.innerText()).toBeGreaterThanOrEqual(box.left)
        expect(inside.right, await part.innerText()).toBeLessThanOrEqual(box.right)
      }
    })
  }

  test('never states a number of patents: what it counts is patent filings', async ({ page }) => {
    const section = await openSection(page, 1440, 'patents')

    expect(stats.patents.filings).toBe(shown.length)
    await expect(section.locator('[data-count] dd')).toHaveText(/\d+\s+U\.S\. patent filings$/)
    await expect(section).not.toContainText(/(four|4|three|3|two|2) patents/i)
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
        await expect(row.locator('time')).toHaveText(formatPartialDate(patent.filed))
      }
    }
  })

  test('lists every filing in the record the same way, with nothing about what became of it', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'patents')
    const { number, filed, assignee, coInventors } = patentsCopy.plate.fields

    expect(shown.map((patent) => patent.id)).toEqual(content.patents.map((patent) => patent.id))
    expect(new Set(content.patents.map((patent) => patent.status.kind)).size).toBeGreaterThan(1)
    for (const patent of content.patents) {
      const row = section.locator(`li[data-patent="${patent.id}"]`)

      await expect(row.locator('dt')).toHaveText([
        number,
        filed,
        assignee,
        patent.coInventors.length === 1 ? coInventors.one : coInventors.many,
      ])
      // One date to a row: the day it was filed. A grant date would be a second.
      await expect(row.locator('time')).toHaveCount(1)
    }
    await expect(section).not.toContainText(STATUS_WORDS)
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
