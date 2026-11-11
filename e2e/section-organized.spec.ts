import { expect, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { pressClaim } from '../src/content/pressClaim'
import { MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { organizedCopy } from '../src/features/sections/organized/copy'
import { formatDateSpan } from '../src/lib/formatDate'
import { formatMillions, formatNumber, formatUsd } from '../src/lib/formatNumber'
import { COLUMN_WIDTHS, columnFaults, columnUse, drawnEach, drawnOne, isNear } from './columnUse'
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
/** The arm is drawn to run off the foot of the page, so it is not held to the column. */
const RUNS_OFF = ['[data-forearm]']
/** How far, in em, the first line of a label may sit above or below the middle of its band. */
const LEVEL_EM = 1
const LABELS = {
  left: 'li[data-side="left"] > :last-child',
  right: 'li[data-side="right"] > :last-child',
}
/** The first line of every label: the city, in his hand. */
const FIRST_LINES = 'li[data-side] > :last-child > * > :first-child'
const { organized, press } = content
const totals = stats.organized

/** The figures an event's label must print, straight from its record. */
function figuresOf(event: (typeof organized)[number]): readonly string[] {
  const { participants, prizes, projects } = event
  return [
    ...(participants === null ? [] : [formatNumber(participants.count)]),
    ...(projects === null ? [] : [formatNumber(projects)]),
    ...(prizes?.kind === 'usd' ? [formatUsd(prizes.amount)] : []),
    ...(prizes?.kind === 'sats' ? [`${formatMillions(prizes.amount)}M sats`] : []),
  ]
}

test.describe('the "organized" section', () => {
  for (const width of SECTION_WIDTHS) {
    test(`is on the page at ${String(width)} wide, with a band for every hackathon`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')

      await expect(section.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(section.locator('[data-band]')).toHaveCount(organized.length)
      for (const band of await section.locator('[data-band]').all()) {
        await expect(band).toBeVisible()
      }
      await expect(section.getByRole('img', { name: /SINCE/ })).toBeVisible()
    })

    test(`nothing spills out sideways at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'organized')

      expect(await sidewaysOverflow(page)).toBeLessThanOrEqual(0)
      expect(await textCutOffAtTheSides(section)).toEqual([])
    })

    test(`every link has a name and can be clicked at its centre at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')
      const names = await linkNames(section)

      expect(names.length).toBeGreaterThan(0)
      for (const name of names) {
        expect(name.trim()).not.toBe('')
      }
      expect(await linksUnderSomethingElse(section)).toEqual([])
    })

    test(`no label runs into the one below it at ${String(width)} wide`, async ({ page }) => {
      const section = await openSection(page, width, 'organized')

      const overlaps = await section.locator('[data-side]').evaluateAll((rows) => {
        const label = (row: Element): DOMRect | undefined =>
          row.lastElementChild?.firstElementChild?.getBoundingClientRect()
        return rows.flatMap((row, index) => {
          const mine = label(row)
          // The next label on the same side of the arm is two rows down. On a phone it is the next row.
          const below = [rows[index + 1], rows[index + 2]].flatMap((other) => {
            const box = other ? label(other) : undefined
            return box && mine && box.left < mine.right && mine.left < box.right ? [box] : []
          })
          return below.some((box) => mine !== undefined && box.top < mine.bottom - 1)
            ? [row.querySelector('h3')?.textContent ?? '']
            : []
        })
      })
      expect(overlaps).toEqual([])
    })
  }

  for (const width of COLUMN_WIDTHS) {
    test(`uses the column at ${String(width)} wide: edge to edge or centred, with no dead block`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')

      expect(columnFaults(await columnUse(section, RUNS_OFF))).toEqual([])
    })

    test(`letters the labels out to the column's edges at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')
      const left = await drawnEach(section, LABELS.left)
      const right = await drawnEach(section, LABELS.right)

      expect(left.length + right.length).toBe(organized.length)
      expect(left.filter(({ fromLeft }) => !isNear(fromLeft))).toEqual([])
      expect(right.filter(({ fromRight }) => !isNear(fromRight))).toEqual([])
    })

    test(`sets the first line of each label level with its band at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')
      const bands = await drawnEach(section, '[data-band]')
      const lines = await drawnEach(section, FIRST_LINES)

      expect(lines).toHaveLength(organized.length)
      const adrift = lines.flatMap((line, index) => {
        const band = bands[index]
        return band && isNear(line.middle - band.middle, LEVEL_EM)
          ? []
          : [`${organized[index]?.name ?? ''}: ${String(line.middle - (band?.middle ?? 0))}em`]
      })
      expect(adrift).toEqual([])
    })

    test(`sets the totals against the column's edges and the arm on its middle at ${String(width)} wide`, async ({
      page,
    }) => {
      const section = await openSection(page, width, 'organized')
      const total = (name: string) => drawnOne(section, `[data-total="${name}"]`)
      const [count, participants, prizes] = await Promise.all(
        ['count', 'participants', 'prizes'].map(total),
      )
      const bands = await drawnEach(section, '[data-band]')

      expect(isNear(count?.fromRight ?? NaN), 'the count ends at the right edge').toBe(true)
      expect(isNear(participants?.fromLeft ?? NaN), 'the head count starts at the left edge').toBe(
        true,
      )
      expect(isNear(prizes?.fromRight ?? NaN), 'the prize money ends at the right edge').toBe(true)
      expect(
        isNear((participants?.top ?? NaN) - (prizes?.top ?? NaN)),
        'the two tiles are level',
      ).toBe(true)
      expect(bands.filter(({ offCentre }) => !isNear(offCentre))).toEqual([])
    })
  }

  test(`no text is under ${String(MIN_TEXT_PX)}px at ${String(NARROW_PHONE_PX)} wide`, async ({
    page,
  }) => {
    const section = await openSection(page, NARROW_PHONE_PX, 'organized')
    const sizes = await textSizes(section)

    expect(sizes.length).toBeGreaterThan(organized.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test(`every link is a target of ${String(MIN_TARGET_PX)}px or more on a phone`, async ({
    page,
  }) => {
    const section = await openSection(page, NARROW_PHONE_PX, 'organized')

    expect(await linksSmallerThan(section, MIN_TARGET_PX)).toEqual([])
  })

  test('prints each total from the derived numbers, with the events it covers', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'organized')
    const total = (name: string) => section.locator(`[data-total="${name}"]`)

    await expect(total('count')).toContainText(`${String(totals.count)} hackathons organized`)
    await expect(total('count').locator('svg text')).toHaveText(String(totals.count))
    await expect(total('countries')).toContainText(`${String(totals.countryCount)} countries`)
    for (const country of totals.countries) {
      await expect(total('countries')).toContainText(country)
    }
    await expect(total('participants')).toContainText(formatNumber(totals.participants))
    await expect(total('participants')).toContainText(
      `${String(totals.headCountEvents)} events with a public head count`,
    )
    await expect(total('prizes')).toContainText(formatUsd(totals.prizeUsd))
    await expect(total('prizes')).toContainText(
      `${String(totals.prizeEvents)} events with a public prize figure`,
    )
    // The two sums are over different sets of events, and each says its own.
    expect(totals.headCountEvents).not.toBe(totals.prizeEvents)
    await expect(total('participants')).not.toContainText('prize figure')
    await expect(total('prizes')).not.toContainText('head count')
  })

  test('stamps the hand with the year of the first hackathon', async ({ page }) => {
    const section = await openSection(page, 1440, 'organized')

    await expect(section.getByRole('img')).toHaveAccessibleName(
      new RegExp(`ORGANIZER SINCE ${String(totals.sinceYear)}`),
    )
  })

  test('letters every hackathon beside its band, as the record has it', async ({ page }) => {
    const section = await openSection(page, 1440, 'organized')
    const rows = section.getByRole('list', { name: organizedCopy.listLabel }).locator('> li')

    await expect(rows).toHaveCount(organized.length)
    for (const [index, event] of organized.entries()) {
      const row = rows.nth(index)

      await expect(row.getByRole('heading', { level: 3 }), event.id).toHaveText(event.name)
      if (event.date !== null) {
        await expect(row.locator('time'), event.id).toHaveText(formatDateSpan(event.date))
      }
      if (event.location?.kind === 'inPerson') {
        await expect(row, event.id).toContainText(event.location.city)
        await expect(row, event.id).toContainText(event.location.country)
      } else {
        await expect(row, event.id).toContainText(organizedCopy.online)
      }
      for (const figure of figuresOf(event)) {
        await expect(row, `${event.id}: ${figure}`).toContainText(figure)
      }
      for (const line of [event.role, event.note]) {
        if (line !== null) {
          await expect(row, event.id).toContainText(line)
        }
      }
    }
  })

  test('numbers the bands down from the next hackathon to the first', async ({ page }) => {
    const section = await openSection(page, 1440, 'organized')

    const numbers = await section
      .locator('[data-band] > [aria-hidden="true"]:first-child')
      .allTextContents()
    expect(numbers.map(Number)).toEqual(
      Array.from({ length: organized.length }, (_, index) => organized.length - index),
    )
    expect(Number(numbers[0])).toBe(totals.nextNumber)
    expect(Number(numbers[1])).toBe(totals.count)
  })

  test('keeps the upcoming hackathon out of the count, on a blank band', async ({ page }) => {
    const section = await openSection(page, 1440, 'organized')
    const upcoming = organized.filter(({ status }) => status === 'upcoming')

    await expect(section.locator('[data-band="blank"]')).toHaveCount(upcoming.length)
    for (const event of upcoming) {
      const row = section.locator('li[data-side]').filter({ hasText: event.name })
      await expect(row).toContainText(organizedCopy.upcoming)
      await expect(row).toContainText(organizedCopy.blank)
    }
    expect(organized.length - upcoming.length).toBe(totals.count)
  })

  test('says a hackathon he helped organize was covered, and no more than that', async ({
    page,
  }) => {
    const section = await openSection(page, 1440, 'organized')
    const [piece] = press.filter(({ subject }) => subject.kind === 'organizedEvent')
    if (!piece) {
      throw new Error('Expected a press item about a hackathon')
    }
    const claim = pressClaim(piece, content)
    const link = section.getByRole('link', { name: organizedCopy.coveredBy(piece.outlet) })

    await expect(link).toHaveAttribute('href', piece.url)
    await expect(link).toHaveAccessibleName(
      `${organizedCopy.coveredBy(piece.outlet)}: ${claim.claim}`,
    )
    await expect(section).toContainText(claim.naming ?? '')
    await expect(section).not.toContainText(/as heard on|featured on|interviewed/i)
  })

  test('is all there with JavaScript turned off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 900, height: 1100 })
    await plain.goto('/')
    const section = plain.locator('section#organized')

    await expect(section.locator('[data-band]')).toHaveCount(organized.length)
    await expect(section.getByRole('heading', { level: 3 })).toHaveText(
      organized.map(({ name }) => name),
    )
    await expect(section).toContainText(formatUsd(totals.prizeUsd))
    await context.close()
  })
})
