import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Patent } from '../../../content'
import { patentStats } from '../../../content/derive'
import { patentsCopy } from './copy'
import { RatingPlate } from './RatingPlate'

const RIVETS = 4

function renderPlate(patents: readonly Patent[] = content.patents): HTMLElement {
  const { container } = render(
    <RatingPlate patents={patents} stats={patentStats(patents)} holder={content.profile.name} />,
  )
  const plate = container.querySelector<HTMLElement>('[data-plate]')
  if (!plate) {
    throw new Error('Expected a plate')
  }
  return plate
}

function row(plate: HTMLElement, id: string): HTMLElement {
  const item = plate.querySelector<HTMLElement>(`li[data-patent="${id}"]`)
  if (!item) {
    throw new Error(`The plate has no row for "${id}"`)
  }
  return item
}

/** What a row prints in the field under a label. */
function field(item: HTMLElement, label: string): HTMLElement | null {
  const term = within(item).queryByText(label, { selector: 'dt' })
  const value = term?.nextElementSibling
  return value instanceof HTMLElement ? value : null
}

describe('RatingPlate', () => {
  it('is headed by what it lists and whose name is on them', () => {
    const plate = renderPlate()

    expect(plate).toHaveTextContent(/^Inventor rating plate/)
    expect(within(plate).getByText(patentsCopy.plate.holder).nextElementSibling).toHaveTextContent(
      content.profile.name,
    )
  })

  it('counts patents and applications apart, from the derived numbers', () => {
    const plate = renderPlate()
    const counted = (label: string): string | undefined =>
      within(plate).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent

    expect(counted('Patents granted')).toBe(String(stats.patents.granted))
    expect(counted('Application pending')).toBe(String(stats.patents.pending))
    expect(plate.textContent).not.toMatch(/(four|4|three|3) patents/i)
  })

  it('lists the filings he shows, one row each, granted first', () => {
    const plate = renderPlate()
    const list = within(plate).getByRole('list', { name: patentsCopy.plate.list })

    expect(
      [...list.querySelectorAll(':scope > li')].map((item) => item.getAttribute('data-patent')),
    ).toEqual(['us-12536579', 'us-12354083', 'us-20230032782'])
    expect(plate).not.toHaveTextContent('non-fungible')
  })

  it('heads each row with the title of the filing', () => {
    const plate = renderPlate()

    expect(within(row(plate, 'us-12536579')).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Methods and a system for in-store navigation',
    )
    expect(within(plate).getAllByRole('heading')).toHaveLength(3)
  })

  it('prints a granted patent in full: number, status, dates, assignee, co-inventor', () => {
    const item = row(renderPlate(), 'us-12536579')

    expect(field(item, 'Patent no.')).toHaveTextContent('US 12,536,579 B2')
    expect(field(item, 'Status')).toHaveTextContent(/^Granted Jan 27, 2026$/)
    expect(field(item, 'Status')?.querySelector('time')).toHaveAttribute('datetime', '2026-01-27')
    expect(field(item, 'Filed')).toHaveTextContent(/^Jul 2, 2021$/)
    expect(field(item, 'Filed')?.querySelector('time')).toHaveAttribute('datetime', '2021-07-02')
    expect(field(item, 'Assignee')).toHaveTextContent(/^NCR Voyix Corp$/)
    expect(field(item, 'Co-inventor')).toHaveTextContent(/^Christian Lee McDaniel$/)
  })

  it('prints the second granted patent from its own record', () => {
    const item = row(renderPlate(), 'us-12354083')

    expect(field(item, 'Patent no.')).toHaveTextContent('US 12,354,083 B2')
    expect(field(item, 'Status')).toHaveTextContent(/^Granted Jul 8, 2025$/)
    expect(field(item, 'Filed')).toHaveTextContent(/^Apr 29, 2022$/)
    expect(field(item, 'Assignee')).toHaveTextContent(/^Digital First Holdings LLC$/)
    expect(field(item, 'Co-inventor')).toHaveTextContent(/^Bryan Walser Nonni$/)
  })

  it('prints the application as an application: pending, with no grant date', () => {
    const item = row(renderPlate(), 'us-20230032782')

    expect(field(item, 'Application no.')).toHaveTextContent('US 2023/0032782 A1')
    expect(field(item, 'Patent no.')).toBeNull()
    expect(field(item, 'Status')).toHaveTextContent(/^Application pending$/)
    expect(field(item, 'Status')?.querySelector('time')).toBeNull()
    expect(field(item, 'Filed')).toHaveTextContent(/^Oct 14, 2022$/)
    expect(field(item, 'Assignee')).toHaveTextContent(/^NCR Corp$/)
  })

  it('makes every number a link to its public record, named for where it leads', () => {
    const plate = renderPlate()
    const links = within(plate).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://patents.google.com/patent/US12536579B2/en',
      'https://patents.google.com/patent/US12354083B2/en',
      'https://patents.google.com/patent/US20230032782A1/en',
    ])
    expect(links[0]).toHaveAccessibleName('US 12,536,579 B2 on Google Patents')
    expect(links[2]).toHaveAccessibleName('US 2023/0032782 A1 on Google Patents')
    expect(plate).toHaveTextContent('Every number opens its public record on Google Patents.')
  })

  it('shows an abandoned application as abandoned, once he chooses to show it', () => {
    const flipped = content.patents.map((filing) => ({ ...filing, shown: true }))
    const item = row(renderPlate(flipped), 'us-20240037539')

    expect(field(item, 'Status')).toHaveTextContent(/^Application abandoned$/)
    expect(field(item, 'Co-inventors')).toHaveTextContent(
      /^Bryan Walser Nonni, Brent Vance Zucker$/,
    )
  })

  it('leaves out the fields a record does not have', () => {
    const [first] = content.patents
    const bare = first ? [{ ...first, filed: null, coInventors: [] }] : []
    const item = row(renderPlate(bare), 'us-12536579')

    expect(field(item, 'Filed')).toBeNull()
    expect(field(item, 'Co-inventor')).toBeNull()
    expect(item.querySelectorAll('dd:empty')).toHaveLength(0)
  })

  it('is riveted at its four corners, for the eye only', () => {
    const rivets = renderPlate().querySelectorAll('[data-rivet]')

    expect(rivets).toHaveLength(RIVETS)
    for (const rivet of rivets) {
      expect(rivet).toHaveAttribute('aria-hidden', 'true')
      expect(rivet).toBeEmptyDOMElement()
    }
  })

  it('is no list at all when there is nothing to show', () => {
    const plate = renderPlate([])

    expect(within(plate).queryByRole('list')).toBeNull()
    expect(within(plate).queryByRole('link')).toBeNull()
  })

  it('carries no inline style and no line break', () => {
    expect(renderPlate().querySelector('[style], br')).toBeNull()
  })
})
