import { expect, type Locator, test } from '@playwright/test'

import { content } from '../src/content'
import { publishableProjects } from '../src/content/derive'
import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { LEAD_PROJECT } from '../src/features/sections/projects/projectStickers'
import { sectionAnchor } from '../src/features/sections/sectionIds'
import { columnUse, EDGE_TOLERANCE_EM, edgeGaps } from './columnFill'
import {
  drawnText,
  hrefsIn,
  linksNotUnderTheirCentre,
  openSection,
  SECTION_WIDTHS,
  sidewaysScroll,
  unnamedLinks,
} from './sectionChecks'

const SECTION = 'projects'
const shown = publishableProjects(content.projects)
/** The widths at which the mat is set in rows: a laptop and a tablet. */
const ROW_WIDTHS = [1440, 900] as const
/** The mat's own scales run to the edge of the screen: they are the mat, not what is on it. */
const MAT_FURNITURE = '[data-mat-prop="ruler"]'
/** Stickers whose feet are this close, in pixels, stand on one line: a foot is measured in whole pixels. */
const SAME_LINE_PX = 2
/** The fewest rows the stickers make, and the fewest stickers a row holds. */
const FEWEST_ROWS = 3
const FEWEST_IN_A_ROW = 2

interface Standing {
  readonly id: string
  /** Where the sticker's foot is, down the mat, before it is tilted. */
  readonly foot: number
  readonly width: number
  readonly left: number
  readonly right: number
}

/** Every project's sticker: where its foot stands, how wide it is cut, and where its sides are. */
async function standings(section: Locator): Promise<readonly Standing[]> {
  return section.locator('[data-project]').evaluateAll((items) =>
    items.flatMap((item) => {
      const art = item.querySelector('[data-art]')
      if (!(item instanceof HTMLElement) || !(art instanceof HTMLElement)) {
        return []
      }
      const { left, right } = art.getBoundingClientRect()
      return [
        {
          id: item.dataset.project ?? '',
          foot: item.offsetTop + art.offsetTop + art.offsetHeight,
          width: art.offsetWidth,
          left,
          right,
        },
      ]
    }),
  )
}

/** The stickers gathered into the rows they stand in, top row first, each left to right. */
function rowsOf(stickers: readonly Standing[]): readonly (readonly Standing[])[] {
  const down = stickers.toSorted((one, other) => one.foot - other.foot)
  // A new row starts where a foot is lower than the one before it by more than a rounding.
  const rows = down.reduce<readonly (readonly Standing[])[]>((found, sticker) => {
    const row = found.at(-1)
    const last = row?.at(-1)
    return row !== undefined && last !== undefined && sticker.foot - last.foot <= SAME_LINE_PX
      ? [...found.slice(0, -1), [...row, sticker]]
      : [...found, [sticker]]
  }, [])
  return rows.map((row) => row.toSorted((one, other) => one.left - other.left))
}

/** A name as a pattern that matches it literally, at the start of an accessible name. */
function startsWith(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
}

test.describe('Things I built', () => {
  for (const width of SECTION_WIDTHS) {
    test(`is on the page at ${String(width)} wide, every link named and clickable, nothing sideways`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)

      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      await expect(section.locator('[data-project]')).toHaveCount(shown.length)
      expect(await sidewaysScroll(page)).toBe(0)
      expect(await unnamedLinks(section)).toEqual([])
      expect(await linksNotUnderTheirCentre(section)).toEqual([])
    })
  }

  for (const width of ROW_WIDTHS) {
    test(`fills the column from edge to edge, with no hole, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)
      const use = await columnUse(section, { ignore: MAT_FURNITURE })
      const gaps = edgeGaps(use)

      expect(gaps.left).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(gaps.right).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(use.deadBlocks).toEqual([])
    })

    test(`stands the stickers in rows that share a line but not a size at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)
      const rows = rowsOf(await standings(section))

      expect(rows.flat()).toHaveLength(shown.length)
      expect(rows.length).toBeGreaterThanOrEqual(FEWEST_ROWS)
      for (const row of rows) {
        const sizes = new Set(row.map(({ width: size }) => Math.round(size)))

        expect(row.length, row[0]?.id).toBeGreaterThanOrEqual(FEWEST_IN_A_ROW)
        expect(sizes.size, row[0]?.id).toBeGreaterThan(1)
      }
    })

    test(`starts every row on the column's left edge and ends it on the right at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)
      const { em, column } = await columnUse(section, { ignore: MAT_FURNITURE })
      const rows = rowsOf(await standings(section))
      const reach = EDGE_TOLERANCE_EM * em
      // The weeded scraps close the last row, as the last thing swept onto the mat.
      const scraps = await section
        .locator('[data-mat-prop="offcuts"] svg')
        .evaluate((drawing) => drawing.getBoundingClientRect().right)

      for (const [index, row] of rows.entries()) {
        const last = index === rows.length - 1
        const left = Math.min(...row.map((sticker) => sticker.left))
        const right = Math.max(...row.map((sticker) => sticker.right), last ? scraps : 0)

        expect(Math.abs(left - column.left), row[0]?.id).toBeLessThanOrEqual(reach)
        expect(Math.abs(right - column.right), row[0]?.id).toBeLessThanOrEqual(reach)
      }
    })

    test(`leads the first row with Finite Computer, cut the largest, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)
      const stickers = await standings(section)
      const [first] = rowsOf(stickers)
      const lead = stickers.find(({ id }) => id === LEAD_PROJECT)

      expect(first?.[0]?.id).toBe(LEAD_PROJECT)
      expect(lead?.width).toBe(Math.max(...stickers.map(({ width: size }) => size)))
    })
  }

  test(`draws no text under ${String(MIN_TEXT_PX)}px at ${String(NARROW_PHONE_PX)} wide`, async ({
    page,
  }) => {
    const section = await openSection(page, SECTION, NARROW_PHONE_PX)
    const sizes = await drawnText(section)

    expect(sizes.length).toBeGreaterThan(shown.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
    expect(await sidewaysScroll(page)).toBe(0)
  })

  test('prints every publishable project: its name, its description and its links', async ({
    page,
  }) => {
    const section = await openSection(page, SECTION, 1440)
    const hrefs = await hrefsIn(section)

    for (const project of shown) {
      const sticker = section.locator(`[data-project="${project.id}"]`)
      const win = content.wins.find(({ id }) => id === project.winId)
      const description = project.description ?? win?.description ?? null

      await expect(sticker.getByRole('heading', { level: 3 })).toHaveAccessibleName(
        startsWith(project.name),
      )
      if (description !== null) {
        await expect(sticker).toContainText(description)
      }
      expect(project.links.filter(({ url }) => !hrefs.has(url))).toEqual([])
    }
  })

  test('flags every project that won, and each flag leads to the wins', async ({ page }) => {
    const section = await openSection(page, SECTION, 1440)
    const winners = shown.filter(({ winId }) => winId !== null)

    expect(winners.length).toBeGreaterThan(0)
    for (const project of winners) {
      const flag = section
        .locator(`[data-project="${project.id}"]`)
        .locator(`a[href="${sectionAnchor('wins')}"]`)
      await expect(flag).toHaveCount(1)
    }
    await expect(section.locator(`a[href="${sectionAnchor('wins')}"]`)).toHaveCount(winners.length)
  })

  test('leads with Finite Computer, his employer’s platform', async ({ page }) => {
    const section = await openSection(page, SECTION, 390)

    await expect(section.locator('[data-project]').first()).toHaveAttribute(
      'data-project',
      LEAD_PROJECT,
    )
  })
})
