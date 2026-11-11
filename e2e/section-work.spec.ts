import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { publishableProjects } from '../src/content/derive'
import { MIN_TEXT_PX } from '../src/features/lid/placement/artboards'
import { workCopy } from '../src/features/sections/work/copy'
import { careerPath, NOW_KEY } from '../src/features/sections/work/path'
import { pathTotals } from '../src/features/sections/work/totals'
import { formatPartialDate } from '../src/lib/formatDate'
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
/** Every tag on the path, top to bottom: the jobs, then the university. */
const TAGS = [
  ...content.experience.map(({ id }) => `article[data-job="${id}"]`),
  ...content.education.map(({ id }) => `article[data-school="${id}"]`),
]

test.describe('the career path', () => {
  for (const { width } of SECTION_VIEWPORTS) {
    test(`is on the page at ${String(width)} wide, from now down to the first year`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.getByText(workCopy.kicker)).toBeVisible()
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

    test(`hangs every job from the year it began at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'work')

      for (const stop of stops) {
        const item = await pageBox(section.locator(`li[data-stop="${stop.key}"]`))
        for (const { role } of stop.jobs) {
          const tag = await pageBox(section.locator(`article[data-job="${role.id}"]`))
          const middle = (tag.top + tag.bottom) / 2
          expect(middle, role.id).toBeGreaterThan(item.top)
          expect(middle, role.id).toBeLessThan(item.bottom)
        }
      }
    })
  }

  for (const width of [1440, 900] as const) {
    test(`keeps the jobs on one side of the rule and the rest on the other at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'work')
      const rule = await pageBox(section.locator('li[data-stop="2024"] [data-year]'))
      const centre = async (selector: string): Promise<number> => {
        const box = await pageBox(section.locator(selector).first())
        return (box.left + box.right) / 2
      }

      for (const tag of TAGS) {
        expect(await centre(tag), tag).toBeLessThan(rule.left)
      }
      for (const stop of stops.filter((candidate) => candidate.marks.length > 0)) {
        expect(await centre(`li[data-stop="${stop.key}"] [data-marks]`), stop.key).toBeGreaterThan(
          rule.right,
        )
      }
    })
  }

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

  test('draws the rule to scale on a laptop: every year the same length', async ({ page }) => {
    const section = await openSection(page, 1440, 'work')
    const heights = await Promise.all(
      years.map(async (year) => {
        const box = await pageBox(section.locator(`li[data-stop="${year}"]`))
        return Math.round(box.bottom - box.top)
      }),
    )

    expect(new Set(heights).size).toBe(1)
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
