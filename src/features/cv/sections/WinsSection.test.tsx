import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { WinsSection } from './WinsSection'

function renderSection() {
  render(<WinsSection wins={content.wins} stats={stats.wins} />)
  return within(screen.getByRole('region', { name: 'Hackathon wins' }))
}

function itemFor(text: string): HTMLElement {
  const item = screen
    .getAllByRole('listitem')
    .find((candidate) => candidate.textContent.includes(text))
  if (!item) {
    throw new Error(`No list item mentions "${text}"`)
  }
  return item
}

describe('WinsSection', () => {
  it('lists every win with its year, project, event and result', () => {
    const section = renderSection()

    const items = section.getAllByRole('listitem')
    expect(items).toHaveLength(stats.wins.total)
    content.wins.forEach((win, index) => {
      expect(items[index]).toHaveTextContent(String(win.year))
      expect(items[index]).toHaveTextContent(win.project)
      expect(items[index]).toHaveTextContent(win.event)
    })
  })

  it('summarizes the wins with derived numbers', () => {
    const section = renderSection()

    expect(section.getByText('8 wins: 5 first places, 2 second places and 1 prize.')).toBeVisible()
  })

  it('the AI4All row never shows a placement', () => {
    renderSection()
    const row = itemFor('AI4All')

    expect(row).toHaveTextContent('Prize winner')
    expect(row).toHaveTextContent('BitDevs Upgrade')
    expect(row).not.toHaveTextContent(/1st|2nd|3rd|first|second|third|place|podium|overall|tied/i)
  })

  it('shows placements with the qualifiers the file gives', () => {
    renderSection()

    expect(itemFor('Lightning Welder')).toHaveTextContent('1st overall')
    expect(itemFor('TreePay UX')).toHaveTextContent('2nd (tied)')
    expect(itemFor('Last Pay Wins')).toHaveTextContent('2nd')
  })

  it('shows the event date and place when they are recorded', () => {
    renderSection()
    const row = itemFor('Stringer Safety')

    expect(row).toHaveTextContent('Jan 17–18, 2026')
    expect(row).toHaveTextContent('Bitcoin Park, Austin, TX')
    expect(row).toHaveTextContent('Team captain: journalist Anjan Sundaram.')
  })

  it('renders nothing for a missing description', () => {
    renderSection()
    const row = itemFor('AI4All')

    expect(row.querySelectorAll('p:empty, ul:empty, span:empty')).toHaveLength(0)
    expect(row).toHaveTextContent(/^2024\s*Prize winner\s+BitDevs Upgrade\s*AI4All$/)
  })
})
