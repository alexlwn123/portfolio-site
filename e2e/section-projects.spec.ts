import { expect, test } from '@playwright/test'

import { content } from '../src/content'
import { publishableProjects } from '../src/content/derive'
import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { LEAD_PROJECT } from '../src/features/sections/projects/projectStickers'
import { sectionAnchor } from '../src/features/sections/sectionIds'
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
