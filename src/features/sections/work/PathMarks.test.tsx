import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { careerPath, type PathMark, type PathStop } from './path'
import { PathMarks } from './PathMarks'

const path = careerPath(content)

function stop(key: string): PathStop {
  const found = path.find((candidate) => candidate.key === key)
  if (!found) {
    throw new Error(`The path has no stop "${key}"`)
  }
  return found
}

/** Renders the marks of one year and returns the item of one kind. */
function renderMark(key: string, kind: PathMark['kind']): HTMLElement {
  const { marks, year } = stop(key)
  const { container } = render(<PathMarks marks={marks} year={year ?? 0} />)
  const item = container.querySelector<HTMLElement>(`li[data-mark="${kind}"]`)
  if (!item) {
    throw new Error(`${key} has no ${kind} mark`)
  }
  return item
}

describe('PathMarks', () => {
  it('is a list named for its year, one item to a mark, in the path’s order', () => {
    const { marks } = stop('2026')
    render(<PathMarks marks={marks} year={2026} />)

    const list = screen.getByRole('list', { name: 'Also in 2026' })
    const items = [...list.querySelectorAll(':scope > li')]
    expect(items.map((item) => item.getAttribute('data-mark'))).toEqual(['organized', 'wins'])
    for (const item of items) {
      expect(within(item as HTMLElement).getAllByRole('link')).toHaveLength(1)
    }
  })

  it('is set out abreast unless it is told how else', () => {
    const { marks } = stop('2024')
    const { container, rerender } = render(<PathMarks marks={marks} year={2024} />)

    expect(container.querySelector('[data-marks]')).toHaveAttribute('data-layout', 'abreast')
    rerender(<PathMarks marks={marks} year={2024} layout="down" />)
    expect(container.querySelector('[data-marks]')).toHaveAttribute('data-layout', 'down')
  })

  it('renders nothing for a year with no marks', () => {
    const { container } = render(<PathMarks marks={[]} year={2019} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('counts a year’s wins and names each one, linking to the wins', () => {
    const item = renderMark('2023', 'wins')
    const link = within(item).getByRole('link')

    expect(link).toHaveAttribute('href', '/#wins')
    expect(link).toHaveTextContent(/^3 hackathon wins/)
    expect(link).toHaveTextContent('Auntie LN 1st, SatsxSW hackathon')
    expect(link).toHaveTextContent('Last Pay Wins 2nd, Pleb.fi Miami')
    expect(link).toHaveTextContent('BitDevs Upgrade Prize winner: Bitcoin Education Track, AI4All')
  })

  it('puts the NCR win in 2021, with the field it was chosen from', () => {
    const link = within(renderMark('2021', 'wins')).getByRole('link')

    expect(link).toHaveTextContent(/^1 hackathon win /)
    expect(link).toHaveTextContent('Team Eth Heads 1st of 300+ teams, NCR Global Hackathon')
  })

  it('counts the hackathons he organized that year and says where', () => {
    const link = within(renderMark('2025', 'organized')).getByRole('link')

    expect(link).toHaveAttribute('href', '/#organized')
    expect(link).toHaveTextContent(/^8 hackathons organized/)
    expect(link).toHaveTextContent(
      'Florianópolis · Austin · Riga · Istanbul · Berlin · Taipei + online',
    )
    expect(within(renderMark('2021', 'organized')).getByRole('link')).toHaveTextContent(
      /^1 hackathon organized AuburnHacks 2021 · Executive director$/,
    )
  })

  it('counts a year’s patent filings and gives the day each was filed, and no more', () => {
    const link = within(renderMark('2022', 'filed')).getByRole('link')

    expect(link).toHaveAttribute('href', '/#patents')
    expect(link).toHaveTextContent(/^3 patent filings Apr 29, 2022 Jul 29, 2022 Oct 14, 2022$/)
    expect(within(link).getByText('Apr 29, 2022')).toHaveAttribute('datetime', '2022-04-29')
    expect(within(link).getByText('Jul 29, 2022')).toHaveAttribute('datetime', '2022-07-29')
    expect(link.querySelectorAll('time')).toHaveLength(3)
  })

  it('words a single filing as one', () => {
    const link = within(renderMark('2021', 'filed')).getByRole('link')

    expect(link).toHaveTextContent(/^1 patent filing Jul 2, 2021$/)
  })

  it('says nothing of what became of a filing, and has no sticker for a grant', () => {
    for (const { marks, year } of path) {
      const { container, unmount } = render(<PathMarks marks={marks} year={year ?? 0} />)

      expect(container.querySelector('[data-mark="granted"]')).toBeNull()
      expect(container.textContent).not.toMatch(/grant|pending|abandon|application/i)
      unmount()
    }
  })

  it('names his first talk on record, where it was and when', () => {
    const link = within(renderMark('2023', 'firstTalk')).getByRole('link')

    expect(link).toHaveAttribute('href', '/#talks')
    expect(link).toHaveTextContent(/^First talk on record/)
    expect(link).toHaveTextContent('Extending Bitcoin with Zero-knowledge Proofs')
    expect(link).toHaveTextContent('Atlanta BitDevs')
    expect(within(link).getByText('Dec 13, 2023')).toHaveAttribute('datetime', '2023-12-13')
  })

  it('leaves the venue out of a first talk that has none on record', () => {
    const first = stop('2023').marks.find((mark) => mark.kind === 'firstTalk')
    const bare =
      first?.kind === 'firstTalk' ? [{ ...first, talk: { ...first.talk, venue: null } }] : []
    render(<PathMarks marks={bare} year={2023} />)

    expect(screen.getByRole('link')).not.toHaveTextContent('Atlanta BitDevs')
    expect(screen.getByRole('link')).toHaveTextContent('Dec 13, 2023')
  })

  it('keeps everything inside a link to phrasing content, with no inline style', () => {
    const { marks } = stop('2022')
    const { container } = render(<PathMarks marks={marks} year={2022} />)

    expect(container.querySelector('a div, a p, a ul, a li, [style]')).toBeNull()
  })
})
