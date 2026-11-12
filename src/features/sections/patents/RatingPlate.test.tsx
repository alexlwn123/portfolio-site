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

  it('counts the filings in one box, from the derived number, as patent filings', () => {
    const plate = renderPlate()
    const counted = within(plate).getByText('Named inventor on', { selector: 'dt' })

    expect(counted.nextElementSibling).toHaveTextContent(
      new RegExp(`^${String(stats.patents.filings)} U\\.S\\. patent filings$`),
    )
    expect(plate.querySelectorAll('[data-count]')).toHaveLength(1)
    expect(plate.querySelector('[data-count] [data-figure]')).toHaveTextContent(/^4$/)
    expect(plate.textContent).not.toMatch(/(four|4|three|3|two|2) patents/i)
  })

  it('words a single filing as one, and counts nothing when there is none', () => {
    const [first] = content.patents
    const one = renderPlate(first ? [first] : [])

    expect(one.querySelector('[data-count]')).toHaveTextContent(
      /^Named inventor on1 U\.S\. patent filing$/,
    )
    expect(renderPlate([]).querySelector('[data-count]')).toBeNull()
  })

  it('lists every filing, one row each, in the record’s order', () => {
    const plate = renderPlate()
    const list = within(plate).getByRole('list', { name: patentsCopy.plate.list })

    expect(
      [...list.querySelectorAll(':scope > li')].map((item) => item.getAttribute('data-patent')),
    ).toEqual(['us-12536579', 'us-12354083', 'us-20230032782', 'us-20240037539'])
  })

  it('heads each row with the title of the filing', () => {
    const plate = renderPlate()

    expect(within(row(plate, 'us-12536579')).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Methods and a system for in-store navigation',
    )
    expect(
      within(row(plate, 'us-20240037539')).getByRole('heading', { level: 3 }),
    ).toHaveTextContent(
      'Methods and a system for managing and integrating non-fungible tokens (NFTs)',
    )
    expect(within(plate).getAllByRole('heading')).toHaveLength(content.patents.length)
  })

  it('prints a filing in full: publication number, filing date, assignee, co-inventor', () => {
    const item = row(renderPlate(), 'us-12536579')

    expect(field(item, 'Publication no.')).toHaveTextContent('US 12,536,579 B2')
    expect(field(item, 'Filed')).toHaveTextContent(/^Jul 2, 2021$/)
    expect(field(item, 'Filed')?.querySelector('time')).toHaveAttribute('datetime', '2021-07-02')
    expect(field(item, 'Assignee')).toHaveTextContent(/^NCR Voyix Corp$/)
    expect(field(item, 'Co-inventor')).toHaveTextContent(/^Christian Lee McDaniel$/)
  })

  it('prints each of the other three from its own record', () => {
    const plate = renderPlate()
    const second = row(plate, 'us-12354083')
    const third = row(plate, 'us-20230032782')
    const fourth = row(plate, 'us-20240037539')

    expect(field(second, 'Publication no.')).toHaveTextContent('US 12,354,083 B2')
    expect(field(second, 'Filed')).toHaveTextContent(/^Apr 29, 2022$/)
    expect(field(second, 'Assignee')).toHaveTextContent(/^Digital First Holdings LLC$/)
    expect(field(second, 'Co-inventor')).toHaveTextContent(/^Bryan Walser Nonni$/)
    expect(field(third, 'Publication no.')).toHaveTextContent('US 2023/0032782 A1')
    expect(field(third, 'Filed')).toHaveTextContent(/^Oct 14, 2022$/)
    expect(field(third, 'Assignee')).toHaveTextContent(/^NCR Corp$/)
    expect(field(fourth, 'Publication no.')).toHaveTextContent('US 2024/0037539 A1')
    expect(field(fourth, 'Filed')).toHaveTextContent(/^Jul 29, 2022$/)
    expect(field(fourth, 'Assignee')).toHaveTextContent(/^NCR Voyix Corp$/)
    expect(field(fourth, 'Co-inventors')).toHaveTextContent(
      /^Bryan Walser Nonni, Brent Vance Zucker$/,
    )
  })

  it('gives every row the same fields, and none of them a status', () => {
    const plate = renderPlate()
    const labels = content.patents.map(({ id }) =>
      [...row(plate, id).querySelectorAll('dt')].map((term) =>
        term.textContent.replace(/Co-inventors?/, 'Co-inventor(s)'),
      ),
    )

    expect(new Set(labels.map((row) => row.join(' | ')))).toEqual(
      new Set(['Publication no. | Filed | Assignee | Co-inventor(s)']),
    )
    expect(plate.querySelectorAll('li[data-patent] time')).toHaveLength(content.patents.length)
    expect(plate.textContent).not.toMatch(/grant|pending|abandon|application|status|patent no/i)
  })

  it('makes every number a link to its public record, named for where it leads', () => {
    const plate = renderPlate()
    const links = within(plate).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://patents.google.com/patent/US12536579B2/en',
      'https://patents.google.com/patent/US12354083B2/en',
      'https://patents.google.com/patent/US20230032782A1/en',
      'https://patents.google.com/patent/US20240037539A1/en',
    ])
    expect(links[0]).toHaveAccessibleName('US 12,536,579 B2 on Google Patents')
    expect(links[2]).toHaveAccessibleName('US 2023/0032782 A1 on Google Patents')
    expect(plate).toHaveTextContent('Every number opens its public record on Google Patents.')
  })

  it('leaves a filing off once he takes it off the site', () => {
    const hidden = content.patents.map((filing) =>
      filing.id === 'us-20240037539' ? { ...filing, shown: false } : filing,
    )
    const plate = renderPlate(hidden)

    expect(plate.querySelector('li[data-patent="us-20240037539"]')).toBeNull()
    expect(plate.querySelector('[data-count] [data-figure]')).toHaveTextContent(/^3$/)
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
