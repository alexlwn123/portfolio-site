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

    expect(section.getByText('9 wins: 6 first places, 2 second places and 1 prize.')).toBeVisible()
  })

  it('the AI4All row never shows a placement', () => {
    renderSection()
    const row = itemFor('AI4All')

    expect(row).toHaveTextContent('Prize winner: Bitcoin Education Track')
    expect(row).toHaveTextContent('BitDevs Upgrade')
    expect(row).not.toHaveTextContent(/1st|2nd|3rd|first|second|third|place|podium|overall|tied/i)
  })

  it('shows the corrected AI4All row: July 2023, what it was announced as and what it does', () => {
    renderSection()
    const row = itemFor('AI4All')

    expect(row.querySelector('time')).toHaveAttribute('datetime', '2023')
    expect(row).toHaveTextContent('Jul 1–31, 2023')
    expect(row).toHaveTextContent('Announced as “BitDevs Upgraded”')
    expect(row).toHaveTextContent(
      'A project to improve the UX of BitDevs websites and add AI generated summaries to help new attendees.',
    )
    expect(within(row).getByRole('link', { name: 'Code: BitDevs Upgrade' })).toHaveAttribute(
      'href',
      'https://github.com/atlantabitdevs/bitdevs-upgrade',
    )
    expect(row).not.toHaveTextContent('2024')
  })

  it('shows the NCR win by its team: first of 300+ teams, with the teammates the post names', () => {
    renderSection()
    const row = itemFor('NCR Global Hackathon')

    expect(row.querySelector('time')).toHaveAttribute('datetime', '2021')
    expect(row).toHaveTextContent('1st')
    expect(row).toHaveTextContent('Team Eth Heads')
    expect(row).toHaveTextContent('NCR Global Hackathon, 3rd annual')
    expect(row).toHaveTextContent('Out of 300+ teams')
    expect(row).toHaveTextContent(
      'With Bryan W. Nonni, Sam (Abdulwahab) Jarkas, Christian McDaniel, Stefan Bjelcevic and Jay Arcement.',
    )
    expect(within(row).getByRole('link', { name: /Post on LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/posts/alex-lewin1_its-been-a-wild-first-month-in-the-real-share-6829077224755392512-INuT/',
    )
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

  it('links his own post about the Stringer Safety team, and prints no caveat about it', () => {
    renderSection()
    const row = itemFor('Stringer Safety')

    expect(within(row).getByRole('link', { name: /Post on X/ })).toHaveAttribute(
      'href',
      'https://x.com/ALewin/status/2013474336208835045',
    )
    expect(row).not.toHaveTextContent(/on his word/i)
  })

  it('writes the Last Pay Wins first-week figure from the number in the record', () => {
    renderSection()

    expect(itemFor('Last Pay Wins')).toHaveTextContent(
      'Collected and paid out more than 2.5 million sats in its first week.',
    )
  })

  it('renders nothing for what a record does not know', () => {
    renderSection()
    const row = itemFor('NCR Global Hackathon')

    expect(row.querySelectorAll('p:empty, ul:empty, span:empty')).toHaveLength(0)
    expect(row).toHaveTextContent(
      /^2021\s*1st\s+Team Eth Heads\s*NCR Global Hackathon, 3rd annual · Out of 300\+ teams\s*With Bryan/,
    )
    expect(itemFor('Arion Parking')).toHaveTextContent(
      /^2022\s*1st\s+Arion Parking\s*Bolt\.fun Shock the Web\s*Parking app that takes payment over the Lightning Network\.$/,
    )
  })
})
