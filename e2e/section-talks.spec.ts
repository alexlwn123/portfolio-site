import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { LABELS } from '../src/features/cv/labels'
import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { isoDate } from '../src/lib/formatDate'
import {
  drawnText,
  hrefsIn,
  linksNotUnderTheirCentre,
  openSection,
  SECTION_WIDTHS,
  sidewaysScroll,
  unnamedLinks,
} from './sectionChecks'

const SECTION = 'talks'
/** The press items that are cuttings. The rest are pages of reference. */
const cuttings = content.press.filter(({ subject }) => subject.kind !== 'reference')

test.describe('Talks and press', () => {
  for (const width of SECTION_WIDTHS) {
    test(`is on the page at ${String(width)} wide, every link named and clickable, nothing sideways`, async ({
      page,
    }) => {
      const section = await openSection(page, SECTION, width)

      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
      await expect(section.locator('[data-talk]')).toHaveCount(content.talks.length)
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

    expect(sizes.length).toBeGreaterThan(content.talks.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
    expect(await sidewaysScroll(page)).toBe(0)
  })

  test('on a phone, the tour list runs the full width and its lines wrap inside it', async ({
    page,
  }) => {
    const section = await openSection(page, SECTION, 390)
    const tee = section.getByRole('article').first()
    const teeBox = await tee.boundingBox()
    const sectionBox = await section.boundingBox()
    const lines = await section.locator('[data-talk]').evaluateAll((items) =>
      items.map((item) => {
        const { left, right } = item.getBoundingClientRect()
        return { left, right, scroll: item.scrollWidth - item.clientWidth }
      }),
    )

    expect((teeBox?.width ?? 0) / (sectionBox?.width ?? 1)).toBeGreaterThan(0.9)
    expect(lines.filter(({ left, right }) => left < 0 || right > 390)).toEqual([])
    expect(lines.filter(({ scroll }) => scroll > 0)).toEqual([])
  })

  test('prints every talk: its title, its date, its place and its links', async ({ page }) => {
    const section = await openSection(page, SECTION, 1440)
    const hrefs = await hrefsIn(section)

    for (const talk of content.talks) {
      const line = section.locator(`[data-talk="${talk.id}"]`)

      await expect(line).toContainText(talk.title)
      if (talk.when?.kind === 'date') {
        await expect(line.locator(`time[datetime="${isoDate(talk.when.date)}"]`)).toHaveCount(1)
      }
      if (talk.venue?.confirmed === true) {
        await expect(line).toContainText(talk.venue.name)
      }
      expect(talk.links.filter(({ url }) => !hrefs.has(url))).toEqual([])
    }
  })

  test('prints the bitcoin++ record from the derived numbers, with every edition', async ({
    page,
  }) => {
    const section = await openSection(page, SECTION, 1440)
    const editions = section.getByRole('list', { name: LABELS.editionsList })
    const { bitcoinPlusPlus } = content

    await expect(section).toContainText(`${String(stats.bitcoinPlusPlus.editions)} editions`)
    await expect(section).toContainText(
      `${String(stats.bitcoinPlusPlus.stageSessions)} stage sessions`,
    )
    await expect(section).toContainText(`since ${String(stats.bitcoinPlusPlus.memberSince)}`)
    await expect(editions.getByRole('listitem')).toHaveCount(bitcoinPlusPlus.editions.length)
    for (const [index, { city, year }] of bitcoinPlusPlus.editions.entries()) {
      await expect(editions.getByRole('listitem').nth(index)).toHaveText(`${city} ${String(year)}`)
    }
    await expect(section.locator(`a[href="${bitcoinPlusPlus.profileUrl}"]`)).toHaveCount(1)
  })

  test('cuts out both press items, each leading to the piece', async ({ page }) => {
    const section = await openSection(page, SECTION, 1440)

    expect(cuttings).toHaveLength(2)
    await expect(section.locator('[data-press]')).toHaveCount(cuttings.length)
    for (const item of cuttings) {
      const cutting = section.locator(`[data-press="${item.id}"]`)
      await expect(cutting).toContainText(item.outlet)
      await expect(cutting.locator(`a[href="${item.url}"]`)).toHaveCount(1)
      if (item.title !== null) {
        await expect(cutting).toContainText(item.title)
      }
    }
    await expect(section).not.toContainText(/as heard on npr/i)
  })
})
