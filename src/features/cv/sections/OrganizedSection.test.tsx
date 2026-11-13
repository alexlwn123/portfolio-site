import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Organized } from '../../../content'
import { heldEvents } from '../../../content/derive'
import { OrganizedSection } from './OrganizedSection'

function renderSection() {
  render(<OrganizedSection organized={content.organized} stats={stats.organized} />)
  return within(screen.getByRole('region', { name: 'Hackathons organized' }))
}

function itemFor(section: ReturnType<typeof renderSection>, text: string): HTMLElement {
  const item = section.getAllByRole('listitem').find((entry) => entry.textContent.includes(text))
  if (!item) {
    throw new Error(`No hackathon mentions "${text}"`)
  }
  return item
}

const bare: Organized = {
  id: 'bare-event',
  status: 'held',
  name: 'A Quiet Hackathon',
  date: { start: { year: 2026, month: 7, day: null }, end: null },
  location: { kind: 'inPerson', city: 'Toronto', region: null, country: 'Canada' },
  participants: null,
  prizes: null,
  projects: null,
  role: null,
  note: null,
  basis: 'stated',
  source: { kind: 'owner', urls: [] },
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

  it('prints each total with its own number of events', () => {
    const section = renderSection()

    expect(section.getByText(/^16 hackathons in 8 countries \(USA, Canada/)).toBeVisible()
    expect(
      section.getByText('The 12 events with a public head count add up to 1,471 participants.'),
    ).toBeVisible()
    expect(
      section.getByText('The 14 events with a public prize figure add up to $263,525 in prizes.'),
    ).toBeVisible()
    expect(screen.getByRole('region')).not.toHaveTextContent(/events with public figures|163,525/)
  })

  it('shows the upcoming hackathon apart from the counted list, flagged as upcoming', () => {
    const section = renderSection()

    const held = section.getByRole('list', { name: 'Hackathons held' })
    const upcoming = section.getByRole('list', { name: 'Upcoming' })
    expect(held).not.toHaveTextContent('AI Hack for Freedom IV')
    expect(within(upcoming).getAllByRole('listitem')).toHaveLength(1)
    expect(upcoming).toHaveTextContent('AI Hack for Freedom IV')
    expect(upcoming).toHaveTextContent('Dec 2–4, 2026')
    expect(upcoming).toHaveTextContent('San Francisco, CA, USA')
    expect(section.getByText(/not counted/i)).toBeVisible()
  })

  it('shows dates, places and public figures', () => {
    const nairobi = itemFor(renderSection(), 'open source edition')

    expect(nairobi).toHaveTextContent('Jun 17–18, 2026')
    expect(nairobi).toHaveTextContent('Nairobi, Kenya')
    expect(nairobi).toHaveTextContent('90 participants')
    expect(nairobi).toHaveTextContent('$6,180 in prizes')
    expect(nairobi.querySelector('time')).toHaveAttribute('datetime', '2026-06-17')
  })

  it('renders nothing where figures are not public', () => {
    render(<OrganizedSection organized={[bare]} stats={stats.organized} />)

    expect(screen.getByRole('listitem')).toHaveTextContent(
      /^Jul 2026\s*A Quiet Hackathon\s*Toronto, Canada$/,
    )
  })

  it('shows Toronto’s projects and its prize in sats, never as dollars', () => {
    const toronto = itemFor(renderSection(), 'consensus edition')

    expect(toronto).toHaveTextContent('16 projects')
    expect(toronto).toHaveTextContent('17.542M sats in prizes')
    expect(toronto).not.toHaveTextContent(/\$|participants/)
  })

  it('shows the Florianópolis 2026 head count as approximate', () => {
    const florianopolis = itemFor(renderSection(), 'exploits edition')

    expect(florianopolis).toHaveTextContent('About 60 participants')
    expect(florianopolis).toHaveTextContent('21 projects')
    expect(florianopolis).not.toHaveTextContent(/\$|sats/)
  })

  it('counts teams as teams and shows the AI Hack for Freedom pools and exact dates', () => {
    const section = renderSection()
    const washington = itemFor(section, 'AI Hack for Freedom III')
    const nashville = itemFor(section, 'Nashville')

    expect(washington).toHaveTextContent('Sep 24–25, 2026')
    expect(washington).toHaveTextContent('10 teams')
    expect(washington).toHaveTextContent('$50,000 in prizes')
    expect(washington).not.toHaveTextContent(/participants/)
    expect(nashville).toHaveTextContent('May 9–10, 2026')
    expect(nashville).toHaveTextContent('8 teams')
    expect(nashville).toHaveTextContent('$50,000 in prizes')
  })

  it('says he was executive director of AuburnHacks 2021', () => {
    const section = renderSection()

    expect(itemFor(section, 'AuburnHacks 2021')).toHaveTextContent('Executive director')
    expect(itemFor(section, 'AuburnHacks 2020')).not.toHaveTextContent('Executive director')
  })

  it('says only "Upcoming" where an upcoming hackathon has no date yet', () => {
    const undated: Organized = { ...bare, status: 'upcoming', date: null, location: null }

    render(<OrganizedSection organized={[undated]} stats={stats.organized} />)
    const item = within(screen.getByRole('list', { name: 'Upcoming' })).getByRole('listitem')

    expect(item).toHaveTextContent(/^Upcoming\s*A Quiet Hackathon$/)
    expect(item.querySelector('time')).toBeNull()
  })

  it('leaves the upcoming section out when nothing is upcoming', () => {
    render(<OrganizedSection organized={heldEvents(content.organized)} stats={stats.organized} />)

    expect(screen.queryByRole('list', { name: 'Upcoming' })).toBeNull()
  })
})
