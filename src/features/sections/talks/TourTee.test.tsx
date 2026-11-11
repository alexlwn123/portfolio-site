import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Talk } from '../../../content'
import { tourDates } from './tour'
import { TourTee } from './TourTee'

const dates = tourDates(content.talks)

function renderTee(talks: readonly Talk[] = content.talks): HTMLElement {
  render(<TourTee name={content.profile.name} talks={talks} />)
  return screen.getByRole('article')
}

function line(id: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-talk="${id}"]`)
  if (!found) {
    throw new Error(`No tour line for the talk "${id}"`)
  }
  return found
}

describe('TourTee', () => {
  it('is headed by his name, the tour and the years the records span', () => {
    const tee = renderTee()
    const heading = within(tee).getByRole('heading', { level: 3 })

    expect(heading).toHaveTextContent(/Alex Lewin\s*World\s*tour\s*2023\s*to\s*2026/)
    expect(tee).toHaveAttribute('aria-labelledby', heading.id)
  })

  it('prints a line for every dated appearance, newest first', () => {
    const tee = renderTee()
    const lines = [...tee.querySelectorAll('[data-talk]')]

    expect(lines).toHaveLength(dates.length)
    expect(lines).toHaveLength(15)
    expect(lines.map((item) => item.getAttribute('data-talk'))).toEqual(dates.map(({ id }) => id))
    for (const { id, title } of dates) {
      expect(line(id)).toHaveTextContent(title)
    }
  })

  it('groups the lines under their years, as the legs of the tour', () => {
    const tee = renderTee()
    const legs = within(tee).getAllByRole('heading', { level: 4 })

    expect(legs.map((leg) => leg.textContent)).toEqual(['2026', '2025', '2024', '2023'])
    expect(within(tee).getByRole('list', { name: 'Tour dates' })).toBeInTheDocument()
  })

  it('gives each line its date, its place and his part', () => {
    renderTee()
    const panel = line('elevating-the-ux-of-self-custody')

    expect(panel.querySelector('time')).toHaveAttribute('datetime', '2026-04-29')
    expect(panel.querySelector('time')).toHaveTextContent('Apr 29')
    expect(panel).toHaveTextContent('Bitcoin 2026')
    expect(panel).toHaveTextContent('Panel')
    expect(panel).toHaveTextContent('Moderator')
    expect(line('state-of-bitcoin-67').querySelector('time')).toHaveTextContent(/^Mar$/)
    expect(line('how-ecash-works')).not.toHaveTextContent(/moderator|panelist|guest|host/i)
  })

  it('links a title to its recording or page, and says where the link leads', () => {
    renderTee()

    const link = within(line('scaling-lightning')).getByRole('link')
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=oFDaC_2WjP0')
    expect(link).toHaveAccessibleName(/^Scaling Lightning\s*\(Video on YouTube\)$/)
  })

  it('prints a title plainly when the record has no link for it', () => {
    renderTee()
    const workshop = line('fun-with-lightning')

    expect(within(workshop).queryByRole('link')).toBeNull()
    expect(workshop).toHaveTextContent('Fun with Lightning: How to Win Every Bitcoin Hackathon')
  })

  it('keeps a second address beside the first', () => {
    renderTee()
    const links = within(line('teaching-ai-as-a-tool-for-freedom')).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://x.com/i/broadcasts/1nKOLLlZEprGR',
      'https://luma.com/pubkey-jj3u',
    ])
    expect(links[1]).toHaveAccessibleName(/^Event page\s*: Teaching AI As a Tool for Freedom$/)
  })

  it('names the kinds of appearance on the tour, the most frequent first', () => {
    const tee = renderTee()

    expect(tee).toHaveTextContent(/workshops\s*podcasts\s*panels\s*talks\s*discussions/)
  })

  it('leaves the years off when nothing is dated, and heads an undated leg in words', () => {
    const undated: Talk = {
      id: 'an-undated-talk',
      when: null,
      title: 'A Talk Nobody Can Place',
      format: 'talk',
      role: null,
      detail: null,
      alsoListedAs: null,
      venue: { name: 'Somewhere Hall', confirmed: false },
      links: [],
      source: { kind: 'owner', urls: [] },
    }
    const tee = renderTee([undated])

    expect(within(tee).getByRole('heading', { level: 3 })).toHaveTextContent(
      /^Alex Lewin\s*World\s*tour\s*$/,
    )
    expect(within(tee).getByRole('heading', { level: 4 })).toHaveTextContent('Date not recorded')
    expect(line('an-undated-talk').querySelector('time')).toBeNull()
    expect(line('an-undated-talk')).not.toHaveTextContent('Somewhere Hall')
  })

  it('is a drawing of a shirt with real text printed on it, and no inline styles', () => {
    const tee = renderTee()

    expect(tee.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    expect(tee.querySelector('[style]')).toBeNull()
  })
})
