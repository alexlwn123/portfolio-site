import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { TalksSection } from './TalksSection'

function renderSection() {
  render(
    <TalksSection
      talks={content.talks}
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

describe('TalksSection', () => {
  it('lists every talk', () => {
    const section = renderSection()

    const items = within(section.getByRole('list', { name: 'Talks' })).getAllByRole('listitem')
    expect(items).toHaveLength(content.talks.length)
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

  it('does not print a venue that is unconfirmed, or a date that is not recorded', () => {
    renderSection()
    const talk = talkItem('Building Sovereign Banks with Fedimint')

    expect(talk).not.toHaveTextContent('Bitcoin Park')
    expect(talk.querySelector('time')).toBeNull()
    expect(within(talk).getAllByRole('link')).toHaveLength(2)
  })

  it('marks the podcast as ongoing and states no role on it', () => {
    renderSection()
    const podcast = talkItem('BitDevs Radio Hour')

    expect(podcast).toHaveTextContent('Ongoing')
    expect(podcast).toHaveTextContent('A weekly podcast on technical bitcoin news')
    expect(podcast).not.toHaveTextContent(/host|co-host|producer|guest/i)
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
