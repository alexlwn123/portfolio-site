import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Talk } from '../../../content'
import { TalksSection } from './TalksSection'

function renderSection(talks: readonly Talk[] = content.talks) {
  render(
    <TalksSection
      talks={talks}
      bitcoinPlusPlus={content.bitcoinPlusPlus}
      stats={stats.bitcoinPlusPlus}
    />,
  )
  return within(screen.getByRole('region', { name: 'Talks, workshops and panels' }))
}

function talkItem(title: string): HTMLElement {
  const item = screen
    .getAllByRole('listitem')
    .find((candidate) => candidate.textContent.includes(title))
  if (!item) {
    throw new Error(`No list item mentions "${title}"`)
  }
  return item
}

const unplaced: Talk = {
  id: 'an-unplaced-talk',
  when: null,
  title: 'A Talk Nobody Can Place',
  format: 'talk',
  role: null,
  detail: null,
  alsoListedAs: null,
  venue: { name: 'Somewhere Hall', confirmed: false },
  links: [{ label: 'Video on YouTube', url: 'https://example.com/video' }],
  source: { kind: 'owner', urls: [] },
}

describe('TalksSection', () => {
  it('lists every talk', () => {
    const section = renderSection()

    const items = within(section.getByRole('list', { name: 'Talks' })).getAllByRole('listitem')
    expect(items).toHaveLength(content.talks.length)
    expect(items).toHaveLength(16)
    content.talks.forEach((talk, index) => {
      expect(items[index]).toHaveTextContent(talk.title)
    })
  })

  it('shows the date, format, venue and recording link', () => {
    renderSection()
    const panel = talkItem('Scaling Lightning')

    expect(panel).toHaveTextContent('Oct 3, 2025')
    expect(panel).toHaveTextContent('Panel')
    expect(panel).toHaveTextContent('Lightning++ Berlin')
    expect(panel).toHaveTextContent('With Calle, Evan Kaloudis, Shinobi and Walton')
    expect(within(panel).getByRole('link', { name: /Video on YouTube/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=oFDaC_2WjP0',
    )
  })

  it('shows the Sovereign Banks workshop once: in Taipei, dated, with its video', () => {
    const section = renderSection()
    const matches = section
      .getAllByRole('listitem')
      .filter((item) => item.textContent.includes('Sovereign Banks'))
    const [talk] = matches

    expect(matches).toHaveLength(1)
    expect(talk).toHaveTextContent('Dec 15, 2025')
    expect(talk).toHaveTextContent('Building Sovereign Banks with Fedi')
    expect(talk).toHaveTextContent('Workshop')
    expect(talk).toHaveTextContent('bitcoin++ Taipei')
    expect(talk).toHaveTextContent('Also listed as “Building Sovereign Banks with Fedimint”')
    expect(talk).not.toHaveTextContent('Bitcoin Park')
    expect(talk?.querySelector('a')).toHaveAttribute('href', 'https://youtu.be/-anhf5szB2I')
  })

  it('does not print a venue that is unconfirmed, or a date that is not recorded', () => {
    renderSection([unplaced])
    const talk = talkItem('A Talk Nobody Can Place')

    expect(talk).not.toHaveTextContent('Somewhere Hall')
    expect(talk.querySelector('time')).toBeNull()
    expect(within(talk).getAllByRole('link')).toHaveLength(1)
  })

  it('marks the podcast as ongoing and says he co-hosts it', () => {
    renderSection()
    const podcast = talkItem('BitDevs Radio Hour')

    expect(podcast).toHaveTextContent('Ongoing')
    expect(podcast).toHaveTextContent('Co-host')
    expect(podcast).toHaveTextContent('Stephen DeLorme')
    expect(podcast).toHaveTextContent('A weekly podcast on technical bitcoin news')
    expect(within(podcast).getByRole('link', { name: /Apple Podcasts/ })).toHaveAttribute(
      'href',
      'https://podcasts.apple.com/podcast/id1791756302',
    )
  })

  it('says what part he played: moderator, panelist or guest', () => {
    renderSection()

    expect(talkItem('Elevating the User Experience of Self-Custody')).toHaveTextContent(
      'Apr 29, 2026Elevating the User Experience of Self-CustodyPanel · Moderator · Bitcoin 2026',
    )
    expect(talkItem('Lightning + Ecash: An Atomic Match Made in Heaven?')).toHaveTextContent(
      'Panel · Panelist · Bitcoin 2026',
    )
    expect(talkItem('The Dark Side of Ai with Alex Lewin')).toHaveTextContent(
      'Jun 10, 2023The Dark Side of Ai with Alex LewinPodcast · Guest · AI Unchained, Ai_003',
    )
    expect(talkItem('Livestream')).toHaveTextContent('Podcast · Guest · Bitcoin Takeover, S17 E46')
  })

  it('states no part for a talk that he simply gave', () => {
    renderSection()

    expect(talkItem('How eCash Works with Alex Lewin')).not.toHaveTextContent(
      /moderator|panelist|guest|host/i,
    )
  })

  it('shows the new talks with their dates and venues', () => {
    renderSection()

    expect(talkItem('The Alex Lewin Experience')).toHaveTextContent('Oct 14, 2026')
    expect(talkItem('The Alex Lewin Experience')).toHaveTextContent('TABConf 8')
    expect(talkItem('How eCash Works with Alex Lewin')).toHaveTextContent('Aug 7, 2024')
    expect(talkItem('How eCash Works with Alex Lewin')).toHaveTextContent('ATL BitLab')
    expect(talkItem('Extending Bitcoin with Zero-knowledge Proofs')).toHaveTextContent(
      'Dec 13, 2023',
    )
    expect(talkItem('Extending Bitcoin with Zero-knowledge Proofs')).toHaveTextContent(
      'Atlanta BitDevs',
    )
    expect(talkItem('Teaching AI As a Tool for Freedom')).toHaveTextContent('Aug 5, 2026')
    expect(talkItem('Fedimint SDK workshop')).toHaveTextContent('Dec 8, 2024')
  })

  it('prints a date known only to the month as a month', () => {
    renderSection()
    const episode = talkItem('Big Dev Energy with Alex Lewin')

    expect(episode).toHaveTextContent('Mar 2023')
    expect(episode.querySelector('time')).toHaveAttribute('datetime', '2023-03')
    expect(episode).toHaveTextContent('State of Bitcoin, Ep. 67')
  })

  it('shows the other name a talk was listed under', () => {
    renderSection()

    expect(talkItem('Fedimint wallet in 20 minutes')).toHaveTextContent(
      'Also listed as “Fedimint SDK Deep Dive”',
    )
  })

  it('gives each link a name that says which talk it belongs to', () => {
    renderSection()

    expect(
      screen.getByRole('link', { name: 'Video on YouTube: How to Win Every Hackathon' }),
    ).toBeInTheDocument()
  })

  it('prints the bitcoin++ record from the derived stats, with every edition', () => {
    const section = renderSection()

    expect(
      section.getByText(
        'bitcoin++ community member since 2023: 13 editions attended and 51 stage sessions.',
      ),
    ).toBeVisible()
    const editions = within(section.getByRole('list', { name: 'bitcoin++ editions attended' }))
    expect(editions.getAllByRole('listitem')).toHaveLength(stats.bitcoinPlusPlus.editions)
    expect(editions.getByText('Las Vegas 2026')).toBeVisible()
  })
})
