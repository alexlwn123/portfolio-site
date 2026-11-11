import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { publishableProjects } from '../src/content/derive'
import { winName } from '../src/content/winName'
import { resultLabel } from '../src/features/cv/describe'
import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { winsCopy } from '../src/features/sections/wins/copy'
import { columnUse, EDGE_TOLERANCE_EM, edgeGaps } from './columnUse'
import {
  linkNames,
  linksSmallerThan,
  linksUnderSomethingElse,
  openSection,
  SECTION_WIDTHS,
  sidewaysOverflow,
  textCutOffAtTheSides,
  textSizes,
} from './winsAndOrganizedSupport'

const MIN_TARGET_PX = 24
/** The widths at which the body is held to the column: a laptop and a tablet. */
const COLUMN_WIDTHS = [1440, 900] as const
/** A sheet's edge may round to a pixel either side of the column's. */
const SHEET_EDGE_PX = 1
/** How far a sticker on the sheet may be turned, in degrees: a few, and never none. */
const MOST_TILT_DEG = 6
/** How many stickers ride over the rule printed under the sheet's strip. */
const OVER_THE_RULE = 2
const { wins } = content
const projects = publishableProjects(content.projects)

/** Every address the record gives a win: its project's links, then its own. */
function recordedLinks(win: (typeof wins)[number]): readonly string[] {
  const project = projects.find(({ winId }) => winId === win.id)
  return [...new Set([...(project?.links ?? []), ...win.links].map(({ url }) => url))]
}

test.describe('the "wins" section', () => {
  for (const width of SECTION_WIDTHS) {
    test(`is on the page at ${String(width)} wide, with every win on the sheet`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.locator('[data-win]')).toHaveCount(wins.length)
      for (const slot of await section.locator('[data-prize]').all()) {
        await expect(slot).toBeVisible()
      }
      await expect(section.locator('[data-prize]')).toHaveCount(wins.length)
    })

    test(`nothing spills out sideways at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'wins')

      expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0)
      expect(await textCutOffAtTheSides(section)).toEqual([])
    })

    test(`every link has a name and can be clicked at its centre at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')
      const names = await linkNames(section)

      expect(names.length).toBeGreaterThan(wins.length)
      for (const name of names) {
        // What it is, then what it belongs to: "Code: Pleb FM".
        expect(name).toMatch(/\S: \S/)
      }
      expect(await linksUnderSomethingElse(section)).toEqual([])
    })

    test(`the heading is stuck over the sheet, and covers none of its print, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')

      const covered = await section.evaluate((root) => {
        const heading = root.querySelector('h2')?.getBoundingClientRect()
        const print = [...root.querySelectorAll('[data-section-body] p, [data-section-body] li')]
        return print.flatMap((element) => {
          const box = element.getBoundingClientRect()
          const under =
            heading !== undefined &&
            box.width > 0 &&
            box.left < heading.right &&
            heading.left < box.right &&
            box.top < heading.bottom &&
            heading.top < box.bottom
          return under ? [element.textContent] : []
        })
      })
      expect(covered).toEqual([])
    })
  }

  for (const width of COLUMN_WIDTHS) {
    test(`runs from the column's left edge to its right, with no dead block, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')
      const use = await columnUse(section)
      const gaps = edgeGaps(use)

      expect(gaps.left).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(gaps.right).toBeLessThanOrEqual(EDGE_TOLERANCE_EM)
      expect(use.deadBlocks).toEqual([])
    })

    test(`gives the newest win more room than any other at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')
      const widths = await section
        .locator('[data-win]')
        .evaluateAll((entries) => entries.map((entry) => entry.getBoundingClientRect().width))
      const [newest = 0, ...others] = widths

      expect(others.length).toBe(wins.length - 1)
      expect(newest).toBeGreaterThan(Math.max(...others))
    })
  }

  for (const width of SECTION_WIDTHS) {
    test(`lays the sheet's edges on the column's at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'wins')
      const { column } = await columnUse(section)
      const sheet = await section.locator('[data-sheet]').evaluate((element) => {
        const { left, right } = element.getBoundingClientRect()
        return { left, right }
      })

      expect(Math.abs(sheet.left - column.left)).toBeLessThanOrEqual(SHEET_EDGE_PX)
      expect(Math.abs(sheet.right - column.right)).toBeLessThanOrEqual(SHEET_EDGE_PX)
    })

    test(`cuts a first place bigger than a second or a prize at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')
      const areas = (finish: string): Promise<readonly number[]> =>
        section
          .locator(`[data-prize][data-finish="${finish}"]`)
          .evaluateAll((stickers) =>
            stickers.map((sticker) =>
              sticker instanceof HTMLElement ? sticker.offsetWidth * sticker.offsetHeight : 0,
            ),
          )
      const firsts = await areas('first')
      const rest = [
        ...(await areas('second')),
        ...(await areas('third')),
        ...(await areas('prize')),
      ]

      expect(firsts.length).toBeGreaterThan(0)
      expect(rest.length).toBeGreaterThan(0)
      expect(Math.min(...firsts)).toBeGreaterThan(Math.max(...rest))
    })

    test(`turns every sticker a few degrees, and no two neighbours alike, at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'wins')
      const tilts = await section
        .locator('[data-prize]')
        .evaluateAll((stickers) =>
          stickers.map((sticker) => Number.parseFloat(getComputedStyle(sticker).rotate)),
        )

      expect(tilts).toHaveLength(wins.length)
      for (const [index, tilt] of tilts.entries()) {
        expect(Math.abs(tilt), String(index)).toBeGreaterThan(0)
        expect(Math.abs(tilt), String(index)).toBeLessThanOrEqual(MOST_TILT_DEG)
        expect(tilt, String(index)).not.toBe(tilts[index + 1])
      }
    })
  }

  test('lets two stickers ride over the rule printed under the strip', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const rule = await section
      .locator('[data-strip]')
      .evaluate((strip) => strip.getBoundingClientRect().bottom)
    const over = await section.locator('[data-prize]').evaluateAll(
      (stickers, line) =>
        stickers.filter((sticker) => {
          const { top, bottom } = sticker.getBoundingClientRect()
          return top < line && bottom > line
        }).length,
      rule,
    )

    expect(over).toBe(OVER_THE_RULE)
  })

  test(`no text is under ${String(MIN_TEXT_PX)}px at ${String(NARROW_PHONE_PX)} wide`, async ({
    page,
  }) => {
    const section = await openSection(page, NARROW_PHONE_PX, 'wins')
    const sizes = await textSizes(section)

    expect(sizes.length).toBeGreaterThan(wins.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test(`every link is a target of ${String(MIN_TARGET_PX)}px or more on a phone`, async ({
    page,
  }) => {
    const section = await openSection(page, NARROW_PHONE_PX, 'wins')

    expect(await linksSmallerThan(section, MIN_TARGET_PX)).toEqual([])
  })

  test('counts the pieces and tallies the results from the derived numbers', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const tally = section.getByRole('list', { name: winsCopy.sheet.tallyLabel })

    await expect(section).toContainText(`${String(stats.wins.total)} pcs`)
    await expect(tally.getByRole('listitem')).toHaveText([
      `${String(stats.wins.firsts)} firsts`,
      `${String(stats.wins.seconds)} seconds`,
      `${String(stats.wins.prizes)} prize`,
    ])
    expect(stats.wins.firsts + stats.wins.seconds + stats.wins.thirds + stats.wins.prizes).toBe(
      wins.length,
    )
  })

  test('prints every win as the record has it, newest first', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const entries = section.locator('[data-win]')

    await expect(entries).toHaveCount(wins.length)
    expect(
      await entries.evaluateAll((all) => all.map((entry) => entry.getAttribute('data-win'))),
    ).toEqual(wins.map(({ id }) => id))
    for (const win of wins) {
      const entry = section.locator(`[data-win="${win.id}"]`)

      await expect(entry.getByRole('heading', { level: 3 }), win.id).toContainText(winName(win))
      await expect(entry, win.id).toContainText(resultLabel(win.result))
      await expect(entry, win.id).toContainText(win.event)
      await expect(entry.locator('time'), win.id).toContainText(String(win.year))
      if (win.description !== null) {
        await expect(entry, win.id).toContainText(win.description)
      }
      for (const note of win.notes) {
        await expect(entry, win.id).toContainText(note)
      }
    }
  })

  test('links every address the record gives a win, and no other', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')

    for (const win of wins) {
      const entry = section.locator(`[data-win="${win.id}"]`)
      const hrefs = await entry
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
      const press = content.press
        .filter(({ subject }) => subject.kind === 'win' && subject.winId === win.id)
        .map(({ url }) => url)

      expect(hrefs, win.id).toEqual([...recordedLinks(win), ...press])
    }
  })

  test('prints only the team and the field for the win whose project is not known', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'wins')
    const unknown = wins.filter(({ project }) => project === null)

    expect(unknown.map(({ id }) => id)).toEqual(['ncr-global-hackathon-2021'])
    for (const win of unknown) {
      const entry = section.locator(`[data-win="${win.id}"]`)

      await expect(entry).toContainText(win.team?.name ?? '')
      await expect(entry).toContainText(`${String(win.field?.count ?? '')}+ teams`)
      await expect(entry.locator('[data-fact="description"]')).toHaveCount(0)
    }
  })

  test('never gives the prize a place', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const prizes = wins.filter(({ result }) => result.kind === 'prize')

    expect(prizes).toHaveLength(stats.wins.prizes)
    for (const win of prizes) {
      const entry = section.locator(`[data-win="${win.id}"]`)

      await expect(entry).not.toContainText(/1st|2nd|3rd/)
      await expect(entry.locator('[data-prize]')).toHaveAttribute('data-finish', 'prize')
      await expect(entry).toContainText(winsCopy.hand.trackPrize)
    }
  })

  test('cuts each sticker from the finish its result earns', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const finishes = { 1: 'first', 2: 'second', 3: 'third' } as const

    for (const win of wins) {
      const slot = section.locator(`[data-win="${win.id}"] [data-prize]`)
      const peeled = (await slot.getAttribute('data-peeled')) !== null
      if (!peeled && win.result.kind === 'place') {
        await expect(slot, win.id).toHaveAttribute('data-finish', finishes[win.result.place])
      }
    }
    await expect(section.locator('[data-peeled]')).toHaveCount(1)
  })

  test('leaves an empty outline for the sticker that is on the lid', async ({ page }) => {
    const section = await openSection(page, 1440, 'wins')
    const peeled = section.locator('[data-win]').filter({ has: page.locator('[data-peeled]') })
    const onTheLid = page.locator('[data-sticker="latest-win"]')

    await expect(peeled).toHaveCount(1)
    await expect(peeled.locator('[data-peeled]')).toContainText(winsCopy.hand.peeled)
    const name = (await peeled.getByRole('heading', { level: 3 }).textContent()) ?? ''
    await expect(onTheLid).toContainText(name)
  })

  test('is all there with JavaScript turned off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 900, height: 1100 })
    await plain.goto('/')
    const section = plain.locator('section#wins')

    await expect(section.locator('[data-win]')).toHaveCount(wins.length)
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(wins.length)
    await expect(section.locator('[data-prize]').first()).toBeVisible()
    await context.close()
  })
})
