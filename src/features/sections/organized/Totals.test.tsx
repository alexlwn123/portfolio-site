import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { stats } from '../../../content'
import { organizedCopy } from './copy'
import { Totals } from './Totals'
import { organizedTotals } from './organizedTotals'

const totals = organizedTotals(stats.organized)

function renderTotals(): readonly HTMLElement[] {
  render(<Totals totals={totals} />)
  return within(screen.getByRole('list', { name: organizedCopy.totalsLabel })).getAllByRole(
    'listitem',
  )
}

describe('Totals', () => {
  it('is a list of four: the count, the countries, the head count and the prize money', () => {
    expect(renderTotals()).toHaveLength(4)
  })

  it('draws the count big and says it in words', () => {
    const [count] = renderTotals()

    expect(count).toHaveTextContent(totals.count.summary)
    expect(count?.querySelector('svg[aria-hidden="true"] text')).toHaveTextContent(
      String(stats.organized.count),
    )
  })

  it('counts the countries and names each one', () => {
    const [, countries] = renderTotals()

    expect(countries).toHaveTextContent(totals.countries.label)
    for (const country of stats.organized.countries) {
      expect(countries).toHaveTextContent(country)
    }
    expect(countries).toHaveTextContent(`${organizedCopy.countriesList}:`)
  })

  it('prints each total with a footnote of its own, naming the events it covers', () => {
    const [, , participants, prizes] = renderTotals()

    expect(participants).toHaveTextContent(
      /^1,471\s*participants\s*12 events with a public head count$/,
    )
    expect(prizes).toHaveTextContent(
      /^\$263,525\s*in prizes\s*14 events with a public prize figure$/,
    )
  })

  it('marks which total is which, so each can be found and styled apart', () => {
    const [count, countries, participants, prizes] = renderTotals()

    expect(count).toHaveAttribute('data-total', 'count')
    expect(countries).toHaveAttribute('data-total', 'countries')
    expect(participants).toHaveAttribute('data-total', 'participants')
    expect(prizes).toHaveAttribute('data-total', 'prizes')
  })
})
