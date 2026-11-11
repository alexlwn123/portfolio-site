import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { heldEvents } from '../../../content/derive'
import { OrganizedSection } from './OrganizedSection'

function renderSection() {
  render(<OrganizedSection organized={content.organized} stats={stats.organized} />)
  return within(screen.getByRole('region', { name: 'Hackathons organized' }))
}

describe('OrganizedSection', () => {
  it('lists the sixteen hackathons held, newest first', () => {
    const section = renderSection()

    const items = within(section.getByRole('list', { name: 'Hackathons held' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(stats.organized.count)
    heldEvents(content.organized).forEach((event, index) => {
      expect(items[index]).toHaveTextContent(event.name)
    })
  })

  it('prints the totals from the derived stats', () => {
    const section = renderSection()

    expect(section.getByText(/^16 hackathons in 8 countries \(USA, Canada/)).toBeVisible()
    expect(
      section.getByText(
        'The 12 events with public figures add up to 1,471 participants and $163,525 in prizes.',
      ),
    ).toBeVisible()
  })

  it('shows the upcoming hackathon apart from the counted list, flagged as upcoming', () => {
    const section = renderSection()

    const held = section.getByRole('list', { name: 'Hackathons held' })
    const upcoming = section.getByRole('list', { name: 'Upcoming' })
    expect(held).not.toHaveTextContent('AI Hack for Freedom IV')
    expect(within(upcoming).getAllByRole('listitem')).toHaveLength(1)
    expect(upcoming).toHaveTextContent('AI Hack for Freedom IV')
    expect(section.getByText(/not counted/i)).toBeVisible()
  })

  it('shows dates, places and public figures', () => {
    const section = renderSection()
    const nairobi = section
      .getAllByRole('listitem')
      .find((item) => item.textContent.includes('open source edition'))

    expect(nairobi).toHaveTextContent('Jun 17–18, 2026')
    expect(nairobi).toHaveTextContent('Nairobi, Kenya')
    expect(nairobi).toHaveTextContent('90 participants')
    expect(nairobi).toHaveTextContent('$6,180 in prizes')
    expect(nairobi?.querySelector('time')).toHaveAttribute('datetime', '2026-06-17')
  })

  it('renders nothing where figures are not public', () => {
    const section = renderSection()
    const toronto = section
      .getAllByRole('listitem')
      .find((item) => item.textContent.includes('consensus edition'))

    expect(toronto).toHaveTextContent(
      /^Jul 2026\s*bitcoin\+\+ consensus edition\s*Toronto, Canada$/,
    )
  })

  it('counts teams as teams and never shows an undisclosed amount', () => {
    const section = renderSection()
    const washington = section
      .getAllByRole('listitem')
      .find((item) => item.textContent.includes('AI Hack for Freedom III'))

    expect(washington).toHaveTextContent('10 teams')
    expect(washington).toHaveTextContent('Prizes paid in bitcoin')
    expect(washington).not.toHaveTextContent(/\$|participants/)
  })

  it('leaves the upcoming section out when nothing is upcoming', () => {
    render(<OrganizedSection organized={heldEvents(content.organized)} stats={stats.organized} />)

    expect(screen.queryByRole('list', { name: 'Upcoming' })).toBeNull()
  })
})
