import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { publishableProjects } from '../src/content/derive'
import { MIN_TEXT_PX } from '../src/features/lid/placement/artboards'
import { workKicker } from '../src/features/sections/work/WorkSection'
import { careerPath, NOW_KEY } from '../src/features/sections/work/path'
import { pathTotals } from '../src/features/sections/work/totals'
import { formatPartialDate } from '../src/lib/formatDate'
import { columnUse, EDGE_TOLERANCE_EM, edgeGaps } from './columnFill'
import {
  cutOffSideways,
  drawnText,
  expectNamedLinks,
  linksCoveredAtCentre,
  openSection,
  openSectionOnNarrowPhone,
  pageBox,
  PHONE_WIDTH,
  SECTION_VIEWPORTS,
  sidewaysScroll,
} from './sectionsA'

const stops = careerPath(content)
const years = stops.filter((stop) => stop.year !== null).map((stop) => stop.key)
/** One link for every mark on the path, and one for each running total. */
const LINKS =
  stops.reduce((count, stop) => count + stop.marks.length, 0) + pathTotals(content, stats).length
/** The asset tag of every job, top to bottom. */
const JOBS = content.experience.map(({ id }) => `article[data-job="${id}"]`)
/** The university's permit, which is not a job and so is stuck down with the rest. */
const SCHOOLS = content.education.map(({ id }) => `article[data-school="${id}"]`)
/** Every tag on the path, top to bottom: the jobs, then the university. */
const TAGS = [...JOBS, ...SCHOOLS]
/** The years in which nothing is on record: no job, no school, nothing else. */
const QUIET_YEARS = stops
  .filter(
    (stop) =>
      stop.year !== null && stop.jobs.length + stop.schools.length + stop.marks.length === 0,
  )
  .map((stop) => stop.key)

/** The widths at which the body is held to the column: a laptop and a tablet. */
const COLUMN_WIDTHS = [1440, 900] as const
/** How tall the section may be on a laptop, so that the next one is never far off. */
const MAX_LAPTOP_HEIGHT_PX = 2600
/** What a year with nothing in it may cost, in ems: a break in the rule and its numeral. */
const QUIET_YEAR_EM = 8
/** How far below its year's line a tag may begin, in ems: the current one hangs under a seal. */
const HANG_EM = 7

test.describe('the career path', () => {
  for (const { width } of SECTION_VIEWPORTS) {
    test(`is on the page at ${String(width)} wide, from now down to the first year`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.getByText(workKicker(content) ?? '')).toBeVisible()
      await expect(section.locator('li[data-stop]')).toHaveCount(stops.length)
      await expect(section.locator(`li[data-stop="${NOW_KEY}"] [data-year]`)).toBeVisible()
      for (const year of years) {
        await expect(section.locator(`li[data-stop="${year}"] [data-year]`)).toBeVisible()
      }
      for (const tag of TAGS) {
        await expect(section.locator(tag)).toBeVisible()
      }
    })

    test(`spills nothing sideways at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'work')

      expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0)
      expect(await cutOffSideways(section)).toEqual([])
    })

    test(`names every link and leaves its centre clear at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')

      await expectNamedLinks(section, LINKS)
      expect(await linksCoveredAtCentre(section)).toEqual([])
    })

    test(`runs newest to oldest down the page at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'work')
      const tops = async (selectors: readonly string[]): Promise<readonly number[]> =>
        Promise.all(
          selectors.map(async (selector) => (await pageBox(section.locator(selector))).top),
        )

      const marks = await tops(
        [NOW_KEY, ...years].map((key) => `li[data-stop="${key}"] [data-year]`),
      )
      const tags = await tops(TAGS)

      expect(marks).toEqual(marks.toSorted((one, other) => one - other))
      expect(tags).toEqual(tags.toSorted((one, other) => one - other))
    })

    test(`hangs every tag from the year it began at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'work')
      const { em } = await columnUse(section)

      for (const stop of stops) {
        const line = await pageBox(section.locator(`li[data-stop="${stop.key}"] [data-year]`))
        const hung = [
          ...stop.jobs.map(({ role }) => `article[data-job="${role.id}"]`),
          ...stop.schools.map(({ id }) => `article[data-school="${id}"]`),
        ]
        for (const selector of hung) {
          const tag = await pageBox(section.locator(selector))
          expect(tag.top, selector).toBeGreaterThan(line.top - em)
          expect(tag.top, selector).toBeLessThan(line.top + HANG_EM * em)
        }
      }
    })

    test(`lets no tag cover the one after it at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'work')
      const { em } = await columnUse(section)
      const boxes = await Promise.all(JOBS.map((tag) => pageBox(section.locator(tag))))

      for (const [index, box] of boxes.entries()) {
        const next = boxes[index + 1]
        if (next !== undefined) {
          // A tag is tilted, so a corner may dip a little way past the next one's top.
          expect(next.top, JOBS[index]).toBeGreaterThan(box.bottom - em)
        }
      }
    })

    test(`spends almost nothing on a year with nothing in it at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')
      const { em } = await columnUse(section)
      const lines = [NOW_KEY, ...years]

      expect(QUIET_YEARS.length).toBeGreaterThan(0)
      for (const year of QUIET_YEARS) {
        const after = lines[lines.indexOf(year) + 1]
        const line = await pageBox(section.locator(`li[data-stop="${year}"] [data-year]`))
        const next =
          after === undefined
            ? null
            : await pageBox(section.locator(`li[data-stop="${after}"] [data-year]`))

        await expect(section.locator(`li[data-stop="${year}"]`)).toHaveAttribute('data-quiet', '')
        expect((next?.top ?? line.bottom) - line.top, year).toBeLessThan(QUIET_YEAR_EM * em)
      }
    })
  }

  for (const width of COLUMN_WIDTHS) {
    test(`runs from the column's left edge to its right, with no dead block, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')
      const use = await columnUse(section)
      const gaps = edgeGaps(use)

      expect(gaps.left).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(gaps.right).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(use.deadBlocks).toEqual([])
    })
  }

  test('stands the rule on the middle of the column on a laptop, and uses both sides of it', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'work')
    const { em, column } = await columnUse(section)
    const middle = (column.left + column.right) / 2
    const reach = EDGE_TOLERANCE_EM * em

    for (const key of [NOW_KEY, ...years]) {
      const line = await pageBox(section.locator(`li[data-stop="${key}"] [data-year]`))
      expect(Math.abs((line.left + line.right) / 2 - middle), key).toBeLessThanOrEqual(1)
    }
    for (const tag of JOBS) {
      const box = await pageBox(section.locator(tag))
      expect(Math.abs(box.left - column.left), tag).toBeLessThanOrEqual(reach)
    }
    for (const stop of stops.filter((candidate) => candidate.marks.length > 0)) {
      const marks = await pageBox(section.locator(`li[data-stop="${stop.key}"] [data-marks]`))
      expect(Math.abs(marks.right - column.right), stop.key).toBeLessThanOrEqual(reach)
    }
  })

  test(`is no taller than ${String(MAX_LAPTOP_HEIGHT_PX)}px on a laptop`, async ({ page }) => {
    const section = await openSection(page, 1440, 'work')
    const box = await pageBox(section)

    expect(box.bottom - box.top).toBeLessThan(MAX_LAPTOP_HEIGHT_PX)
  })

  test('keeps the jobs on one side of the rule and everything else on the other on a laptop', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'work')
    const rule = await pageBox(section.locator('li[data-stop="2024"] [data-year]'))
    const centre = async (selector: string): Promise<number> => {
      const box = await pageBox(section.locator(selector).first())
      return (box.left + box.right) / 2
    }

    for (const tag of JOBS) {
      expect(await centre(tag), tag).toBeLessThan(rule.left)
    }
    for (const tag of SCHOOLS) {
      expect(await centre(tag), tag).toBeGreaterThan(rule.right)
    }
    expect(await centre('[data-totals]')).toBeGreaterThan(rule.right)
    for (const stop of stops.filter((candidate) => candidate.marks.length > 0)) {
      expect(await centre(`li[data-stop="${stop.key}"] [data-marks]`), stop.key).toBeGreaterThan(
        rule.right,
      )
    }
  })

  test('lays the rule down the left edge on a tablet, a job beside it and the rest beside the job', async ({
    page,
  }) => {
    const section = await openSection(page, 900, 'work')
    const { em, column } = await columnUse(section)

    for (const stop of stops) {
      const line = await pageBox(section.locator(`li[data-stop="${stop.key}"] [data-year]`))
      expect(Math.abs(line.left - column.left), stop.key).toBeLessThanOrEqual(
        EDGE_TOLERANCE_EM * em,
      )
      for (const { role } of stop.jobs) {
        const tag = await pageBox(section.locator(`article[data-job="${role.id}"]`))
        const beside = await pageBox(section.locator(`li[data-stop="${stop.key}"] [data-aside]`))

        expect((tag.left + tag.right) / 2, role.id).toBeGreaterThan(line.right)
        expect(beside.left, role.id).toBeGreaterThan(tag.right - em)
      }
    }
  })

  test('is one column in time order on a phone, beside the rule', async ({ page }) => {
    const section = await openSection(page, PHONE_WIDTH, 'work')
    const rule = await pageBox(section.locator('li[data-stop="2023"] [data-year]'))
    const tag = await pageBox(section.locator('article[data-job="zion"]'))
    const marks = await pageBox(section.locator('li[data-stop="2023"] [data-marks]'))

    expect(tag.left).toBeGreaterThan(rule.left)
    expect(marks.left).toBeGreaterThan(rule.left)
    expect(marks.top).toBeGreaterThanOrEqual(tag.bottom - 1)
    expect(rule.right - rule.left).toBeLessThan(PHONE_WIDTH / 4)
  })

  test(`draws no text under ${String(MIN_TEXT_PX)}px on a narrow phone`, async ({ page }) => {
    const section = await openSectionOnNarrowPhone(page, 'work')
    const sizes = await drawnText(section)

    expect(sizes.length).toBeGreaterThan(TAGS.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test('prints the jobs as the record has them', async ({ page }) => {
    const section = await openSection(page, 1440, 'work')

    for (const [index, role] of content.experience.entries()) {
      const tag = section.locator(`article[data-job="${role.id}"]`)
      const assetNumber = String(content.experience.length - index).padStart(4, '0')

      await expect(tag.getByRole('heading', { level: 3 })).toContainText(role.organization)
      await expect(tag.getByRole('heading', { level: 3 })).toContainText(role.title)
      await expect(tag.locator('[data-asset]')).toHaveText(assetNumber)
      if (role.start !== null) {
        await expect(tag.locator('time')).toHaveText(formatPartialDate(role.start, 'long'))
      } else {
        await expect(tag.locator('time')).toHaveCount(0)
      }
      if (role.description !== null) {
        await expect(tag.locator('[data-words]')).toHaveText(role.description)
      } else {
        await expect(tag.locator('[data-words]')).toHaveCount(0)
      }
      if (role.team !== null) {
        await expect(tag.locator('[data-team]')).toHaveText(role.team)
      }
      // No job has an end date, so no tag prints a range.
      await expect(tag).not.toContainText('–')
    }
    await expect(section.locator('article[data-current]')).toHaveCount(1)
    await expect(section.locator('article[data-current]')).toHaveAttribute(
      'data-job',
      'finite-computer',
    )
  })

  test('prints the university as the record has it, and claims no degree', async ({ page }) => {
    const section = await openSection(page, 1440, 'work')
    const [school] = content.education
    const permit = section.locator('article[data-school]')

    await expect(permit).toContainText(school?.institution ?? '')
    await expect(permit).toContainText(school?.subject ?? '')
    await expect(permit).toContainText(school?.level ?? '')
    await expect(permit.locator('time')).toHaveText('2018 – 2021')
    await expect(permit).not.toContainText(/degree|\bgraduat/i)
  })

  test('prints the running totals from the derived numbers', async ({ page }) => {
    const section = await openSection(page, 1440, 'work')
    const total = (kind: string) => section.locator(`li[data-total="${kind}"] [data-figure]`)

    await expect(total('wins')).toHaveText(String(stats.wins.total))
    await expect(total('organized')).toHaveText(String(stats.organized.count))
    await expect(total('stage')).toHaveText(String(stats.bitcoinPlusPlus.stageSessions))
    await expect(total('projects')).toHaveText(String(publishableProjects(content.projects).length))
    await expect(total('patents')).toHaveText(String(stats.patents.granted))
  })

  test('puts what else happened at its year', async ({ page }) => {
    const section = await openSection(page, 1440, 'work')
    const mark = (year: string, kind: string) =>
      section.locator(`li[data-stop="${year}"] li[data-mark="${kind}"]`)

    await expect(mark('2021', 'wins')).toContainText('NCR Global Hackathon')
    await expect(mark('2021', 'wins')).toContainText('1st of 300+ teams')
    await expect(mark('2025', 'organized').locator('[data-figure]')).toHaveText('8')
    await expect(mark('2026', 'granted')).toContainText('US 12,536,579 B2')
    await expect(mark('2022', 'filed').locator('[data-figure]')).toHaveText('2')
    await expect(mark('2023', 'firstTalk')).toContainText(
      'Extending Bitcoin with Zero-knowledge Proofs',
    )
    await expect(section.locator('li[data-stop="2019"] li[data-mark]')).toHaveCount(0)
  })

  for (const [kind, target] of [
    ['wins', 'wins'],
    ['organized', 'organized'],
    ['granted', 'patents'],
    ['firstTalk', 'talks'],
  ] as const) {
    test(`a ${kind} sticker leads to the ${target} section`, async ({ page }) => {
      const section = await openSection(page, PHONE_WIDTH, 'work')

      await section.locator(`li[data-mark="${kind}"] a`).first().click()

      await expect(page).toHaveURL(new RegExp(`/#${target}$`))
      await expect(page.locator(`section#${target}`)).toBeInViewport()
    })
  }

  test('the projects total leads to the projects section', async ({ page }) => {
    const section = await openSection(page, 900, 'work')

    await section.locator('li[data-total="projects"] a').click()

    await expect(page).toHaveURL(/\/#projects$/)
    await expect(page.locator('section#projects')).toBeInViewport()
  })

  test('is whole with JavaScript turned off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 900, height: 1100 })
    await plain.goto('/')
    const section = plain.locator('section#work')

    await expect(section.locator('article[data-job]')).toHaveCount(content.experience.length)
    await expect(section.getByRole('link')).toHaveCount(LINKS)
    await expect(section.locator('article[data-job="fedi"]')).toBeVisible()
    await context.close()
  })
})
