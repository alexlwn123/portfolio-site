import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { workCopy } from './copy'
import { PathTotals } from './PathTotals'
import { pathTotals } from './totals'

const totals = pathTotals(content, stats)

describe('PathTotals', () => {
  it('is a list under its own label, a link to a section for each figure', () => {
    render(<PathTotals totals={totals} />)

    const list = screen.getByRole('list', { name: workCopy.totals.label })
    const links = within(list).getAllByRole('link')

    expect(screen.getByText(workCopy.totals.label)).toBeInTheDocument()
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#wins',
      '/#organized',
      '/#talks',
      '/#projects',
      '/#patents',
    ])
  })

  it('prints each figure with what it counts', () => {
    render(<PathTotals totals={totals} />)

    const names = screen.getAllByRole('link').map((link) => link.textContent.trim())
    expect(names).toEqual([
      `${String(stats.wins.total)} hackathon wins`,
      `${String(stats.organized.count)} hackathons organized`,
      `${String(stats.bitcoinPlusPlus.stageSessions)} bitcoin++ stage sessions`,
      `${String(totals[3]?.count ?? 0)} projects`,
      `${String(stats.patents.filings)} patent filings`,
    ])
  })

  it('uses the word for one when there is one', () => {
    render(<PathTotals totals={[{ kind: 'patents', count: 1, section: 'patents' }]} />)

    expect(screen.getByRole('link')).toHaveTextContent(/^1 patent filing$/)
  })

  it('renders nothing when there is nothing to count', () => {
    const { container } = render(<PathTotals totals={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
