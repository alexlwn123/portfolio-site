import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { stickerLook } from './stickerLooks'
import { WinEntry } from './WinEntry'
import { type WinFacts, winFacts } from './winFacts'

const facts = winFacts(content)

function fact(id: string): WinFacts {
  const found = facts.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No facts for the win "${id}"`)
  }
  return found
}

function renderEntry(id: string): HTMLElement {
  const win = fact(id)
  render(
    <ul>
      <WinEntry win={win} look={stickerLook(win, facts.indexOf(win))} />
    </ul>,
  )
  // The entry is the outer item: the links inside it are items of their own.
  const [entry] = screen.getAllByRole('listitem')
  if (!entry) {
    throw new Error('Expected the entry to be a list item')
  }
  return entry
}

describe('WinEntry', () => {
  it('is a list item headed by the project', () => {
    const entry = renderEntry('pleb-fm')

    expect(entry).toHaveAttribute('data-win', 'pleb-fm')
    expect(within(entry).getByRole('heading', { level: 3 })).toHaveTextContent('Pleb FM')
  })

  it('says what it was cut from, so the sheet can give a first place more room', () => {
    expect(renderEntry('pleb-fm')).toHaveAttribute('data-finish', 'first')
  })

  it('says so for a second and for the prize too', () => {
    expect(renderEntry('last-pay-wins')).toHaveAttribute('data-finish', 'second')
  })

  it('keeps the finish of the one that was peeled off', () => {
    expect(renderEntry('stringer-safety')).toHaveAttribute('data-finish', 'first')
  })

  it('prints the result, the event and the year on one line', () => {
    const entry = renderEntry('pleb-fm')

    expect(entry).toHaveTextContent('1st · SatsxSW hackathon · 2022')
    expect(entry.querySelector('time')).toHaveAttribute('datetime', '2022')
  })

  it('prints the dates and the place where the record has them', () => {
    const entry = renderEntry('stringer-safety')

    expect(entry).toHaveTextContent(
      '1st · AI Hack for Freedom I · Jan 17–18, 2026 · Bitcoin Park, Austin, TX',
    )
    expect(entry.querySelector('time')).toHaveAttribute('datetime', '2026-01-17')
  })

  it('says what the project is, then prints the record’s notes', () => {
    const entry = renderEntry('pleb-fm')
    const win = fact('pleb-fm')

    expect(entry).toHaveTextContent(win.description ?? '')
    for (const line of win.lines) {
      expect(entry).toHaveTextContent(line)
    }
  })

  it('prints the field and the team for the win whose project is not known, and no description', () => {
    const entry = renderEntry('ncr-global-hackathon-2021')

    expect(within(entry).getByRole('heading', { level: 3 })).toHaveTextContent('Team Eth Heads')
    expect(entry).toHaveTextContent(
      '1st · NCR Global Hackathon, 3rd annual · 2021 · Out of 300+ teams',
    )
    expect(entry).toHaveTextContent('With Bryan W. Nonni')
    expect(entry.querySelector('[data-fact="description"]')).toBeNull()
  })

  it('names every link by what it is and what it belongs to', () => {
    const entry = renderEntry('pleb-fm')
    const links = within(entry).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      fact('pleb-fm').links.map(({ href }) => href),
    )
    expect(links[0]).toHaveAccessibleName('Site: Pleb FM')
    expect(links[1]).toHaveAccessibleName('Code: Pleb FM')
    // A label, not hidden text: a browser puts a space before hidden text it reads out.
    expect(links[1]).toHaveAttribute('aria-label', 'Code: Pleb FM')
    expect(links[2]).toHaveAccessibleName('Demo video: Pleb FM')
  })

  it('links the announcement after the record’s own links, named by the claim', () => {
    const entry = renderEntry('stringer-safety')
    const [press] = fact('stringer-safety').press
    const links = within(entry).getAllByRole('link')

    expect(links.at(-1)).toHaveAttribute('href', press?.href)
    expect(links.at(-1)).toHaveAccessibleName(`${press?.label ?? ''}: ${press?.claim ?? ''}`)
    expect(entry).not.toHaveTextContent(/does not name/i)
  })

  it('writes nothing in the margin: the record’s own lines say what needs saying', () => {
    const entry = renderEntry('lightning-welder')

    expect(entry).toHaveTextContent('took no part in the judging')
    expect(entry).not.toHaveTextContent(/awkward/i)
  })

  it('words a prize as a prize, with no aside about what it was not', () => {
    const entry = renderEntry('bitdevs-upgrade')

    expect(entry).not.toHaveTextContent(/not a place|podium/i)
    expect(entry).toHaveTextContent(
      'Prize winner: Bitcoin Education Track · AI4All · Jul 1–31, 2023',
    )
    expect(entry).toHaveTextContent('Announced as “BitDevs Upgraded”.')
  })

  it.each([
    ['pleb-fm', 'Pleb FM'],
    ['stringer-safety', 'Stringer Safety'],
  ])('shows the sticker on the sheet for %s: no slot is left empty', (id, name) => {
    const entry = renderEntry(id)

    expect(entry.querySelector('[data-prize][aria-hidden="true"]')).not.toBeNull()
    expect(entry.querySelector('[data-peeled]')).toBeNull()
    expect(within(entry).getByRole('heading', { level: 3 })).toHaveTextContent(name)
  })

  it('types no arrow or star', () => {
    expect(renderEntry('stringer-safety').textContent).not.toMatch(/[←-⇿✦★☆]/)
  })

  it('prints no list of links for a win the record gives no address', () => {
    const win = { ...fact('pleb-fm'), links: [], press: [] }
    render(
      <ul>
        <WinEntry win={win} look={stickerLook(win, 0)} />
      </ul>,
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})
