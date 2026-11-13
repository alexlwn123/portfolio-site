import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { talksCopy } from './copy'
import { TalksSection } from './TalksSection'

function renderSection(): HTMLElement {
  render(<TalksSection content={content} stats={stats} />)
  return screen.getByRole('region', { name: /^Talks\s*& press$/ })
}

/** The places beside the shirt, each of which holds one sticker. */
function placesBesideTheShirt(section: HTMLElement): readonly Element[] {
  const shirt = within(section).getByRole('article', { name: /World\s*tour/i })
  return [...(shirt.nextElementSibling?.children ?? [])]
}

describe('TalksSection', () => {
  it('is the "talks" section, on the cutting mat', () => {
    const section = renderSection()

    expect(section.id).toBe('talks')
    expect(section).toHaveAttribute('data-surface', 'mat')
    expect(within(section).getByText(talksCopy.kicker)).toBeVisible()
  })

  it('shows every talk in the record once: on the shirt, or on the "on air" sign', () => {
    const section = renderSection()
    const shown = [...section.querySelectorAll('[data-talk]')].map((item) =>
      item.getAttribute('data-talk'),
    )

    expect(shown).toHaveLength(content.talks.length)
    expect(shown).toHaveLength(16)
    expect(new Set(shown)).toEqual(new Set(content.talks.map(({ id }) => id)))
    for (const { title } of content.talks) {
      expect(section).toHaveTextContent(title)
    }
  })

  it('sticks the smaller stickers round the shirt: on air, the record, the pass, the press', () => {
    const section = renderSection()

    expect(within(section).getByRole('article', { name: 'BitDevs Radio Hour' })).toBeInTheDocument()
    expect(within(section).getByRole('article', { name: 'bitcoin++' })).toBeInTheDocument()
    expect(
      within(section).getByRole('article', { name: /^How to Win\s*Every Hackathon$/ }),
    ).toBeInTheDocument()
    expect(section.querySelectorAll('[data-press]')).toHaveLength(2)
  })

  it('gives every sticker beside the shirt a place of its own, in the order they are read', () => {
    const places = placesBesideTheShirt(renderSection())
    const cuttings = content.press.filter(({ subject }) => subject.kind !== 'reference')

    // The sign, the pass, the stamp card, a cutting for each piece, and the pages of reference.
    expect(places).toHaveLength(cuttings.length + 4)
    for (const place of places) {
      expect(place.childElementCount).toBe(1)
    }
    expect(places[0]).toHaveTextContent(talksCopy.onAir.sign)
    expect(places[1]).toHaveTextContent(talksCopy.pass.band)
    expect(places[2]).toHaveTextContent(talksCopy.record.card)
    expect(places.at(-1)).toHaveTextContent(talksCopy.press.seeAlso)
  })

  it('keeps no place for pages of reference when the press has none', () => {
    const press = content.press.filter(({ subject }) => subject.kind !== 'reference')
    render(<TalksSection content={{ ...content, press }} stats={stats} />)
    const section = screen.getByRole('region')
    const places = placesBesideTheShirt(section)

    expect(within(section).queryByText(talksCopy.press.seeAlso)).toBeNull()
    expect(places).toHaveLength(press.length + 3)
    for (const place of places) {
      expect(place.childElementCount).toBe(1)
    }
  })

  it('prints the bitcoin++ record from the derived stats, with every edition', () => {
    const section = renderSection()
    const editions = within(section).getByRole('list', { name: 'bitcoin++ editions attended' })

    expect(section).toHaveTextContent(`${String(stats.bitcoinPlusPlus.editions)} editions`)
    expect(section).toHaveTextContent(
      `${String(stats.bitcoinPlusPlus.stageSessions)} stage sessions`,
    )
    expect(within(editions).getAllByRole('listitem')).toHaveLength(
      content.bitcoinPlusPlus.editions.length,
    )
  })

  it('words the press only as the record allows', () => {
    const section = renderSection()

    expect(section).toHaveTextContent('a hackathon he helped organize')
    expect(section).not.toHaveTextContent(/names neither|does not name/i)
    expect(section).not.toHaveTextContent(/as heard on npr/i)
    for (const { url } of content.press) {
      expect(section.querySelector(`a[href="${url}"]`)).not.toBeNull()
    }
  })

  it('keeps its headings in order under the section’s one h2', () => {
    const section = renderSection()

    expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(within(section).queryByRole('heading', { level: 1 })).toBeNull()
    expect(within(section).getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(5)
  })

  it('names every link and has no inline styles', () => {
    const section = renderSection()

    for (const link of within(section).getAllByRole('link')) {
      expect(link).toHaveAccessibleName()
      expect(link.getAttribute('href')).toMatch(/^https:\/\//)
    }
    expect(section.querySelector('[style]')).toBeNull()
  })

  it('leaves out the pass and the sign when the records no longer have them', () => {
    render(<TalksSection content={{ ...content, talks: [] }} stats={stats} />)
    const emptied = screen.getByRole('region')

    expect(emptied.querySelectorAll('[data-talk]')).toHaveLength(0)
    expect(within(emptied).queryByText(talksCopy.pass.band)).toBeNull()
    expect(within(emptied).queryByText(talksCopy.onAir.sign)).toBeNull()
  })
})
