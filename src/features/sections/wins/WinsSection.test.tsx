import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { winName } from '../../../content/winName'
import { winsCopy } from './copy'
import { WinsSection } from './WinsSection'

function renderSection(): HTMLElement {
  render(<WinsSection content={content} stats={stats} />)
  return screen.getByRole('region')
}

function entries(): readonly HTMLElement[] {
  return within(screen.getByRole('list', { name: winsCopy.sheet.listLabel }))
    .getAllByRole('listitem')
    .filter((item) => item.hasAttribute('data-win'))
}

describe('WinsSection', () => {
  it('is the "wins" section, on the lid', () => {
    const section = renderSection()

    expect(section.id).toBe('wins')
    expect(section).toHaveAttribute('data-surface', 'lid')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Hackathon\s*wins\s*$/)
  })

  it('lays every win on one sheet', () => {
    const section = renderSection()
    const sheets = section.querySelectorAll('[data-sheet]')

    expect(sheets).toHaveLength(1)
    expect(sheets[0]?.querySelectorAll('[data-win]')).toHaveLength(content.wins.length)
  })

  it('lists every win in the record, newest first', () => {
    renderSection()

    expect(entries().map((entry) => entry.getAttribute('data-win'))).toEqual(
      content.wins.map(({ id }) => id),
    )
    expect(entries()).toHaveLength(stats.wins.total)
  })

  it('heads each win by its project, or by its team', () => {
    renderSection()

    const headings = entries().map(
      (entry) => within(entry).getByRole('heading', { level: 3 }).textContent,
    )
    for (const [index, win] of content.wins.entries()) {
      expect(headings[index]).toContain(winName(win))
    }
  })

  it('prints the count and the tally from the derived numbers', () => {
    const section = renderSection()

    expect(section).toHaveTextContent(winsCopy.sheet.pieces(stats.wins.total))
    expect(section).toHaveTextContent(winsCopy.tally.first(stats.wins.firsts))
    expect(section).toHaveTextContent(winsCopy.tally.second(stats.wins.seconds))
    expect(section).toHaveTextContent(winsCopy.tally.prize(stats.wins.prizes))
  })

  it('has a sticker on the sheet for every win, the newest included', () => {
    const section = renderSection()

    expect(section.querySelectorAll('[data-prize][aria-hidden="true"]')).toHaveLength(
      stats.wins.total,
    )
    expect(section.querySelectorAll('[data-peeled]')).toHaveLength(0)
  })

  it('cuts a foil sticker for every first, and a silver one per second', () => {
    const section = renderSection()

    expect(section.querySelectorAll('[data-prize][data-finish="first"]')).toHaveLength(
      stats.wins.firsts,
    )
    expect(section.querySelectorAll('[data-prize][data-finish="second"]')).toHaveLength(
      stats.wins.seconds,
    )
    expect(section.querySelectorAll('[data-prize][data-finish="prize"]')).toHaveLength(
      stats.wins.prizes,
    )
  })

  it('gives every link a name', () => {
    renderSection()

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(stats.wins.total)
    for (const link of links) {
      expect(link).toHaveAccessibleName(/\S: \S/)
    }
  })

  it('adds no region and no second h2 of its own', () => {
    renderSection()

    expect(screen.getAllByRole('region')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('carries nothing the lid’s script or its tests would mistake for the lid’s', () => {
    const section = renderSection()

    expect(section.querySelector('[data-sticker], [data-note], [data-peelable]')).toBeNull()
    expect(section.querySelector('[style]')).toBeNull()
    expect(section.querySelector('a[href^="#"]')).toBeNull()
  })
})
