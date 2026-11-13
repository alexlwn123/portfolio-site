import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Patent } from '../../../content'
import { patentStats } from '../../../content/derive'
import { PatentsSection } from './PatentsSection'

/** What the page never says of a filing: what became of it, or which kind of filing it is. */
const STATUS_WORDS = /grant|pending|abandon|application/i

function renderSection(patents: readonly Patent[] = content.patents) {
  render(<PatentsSection patents={patents} stats={patentStats(patents)} />)
  return within(screen.getByRole('region', { name: 'Patents' }))
}

describe('PatentsSection', () => {
  it('is the section the lid links to', () => {
    renderSection()

    expect(screen.getByRole('region', { name: 'Patents' })).toHaveAttribute('id', 'patents')
  })

  it('summarizes with the derived number, counted as patent filings', () => {
    const section = renderSection()

    expect(stats.patents.filings).toBe(4)
    expect(section.getByText('Named inventor on 4 patent filings.')).toBeVisible()
  })

  it('is one list of all four filings, in the order of the record, under no sub-heading', () => {
    const section = renderSection()

    expect(section.getAllByRole('list')).toHaveLength(1)
    expect(section.getAllByRole('heading')).toHaveLength(1)
    expect(
      section.getAllByRole('listitem').map((item) => item.querySelector('p')?.textContent),
    ).toEqual(content.patents.map((patent) => patent.title))
  })

  it('prints each filing the same way: filed date, title, number, link', () => {
    const [navigation, identity, consent, tokens] = renderSection().getAllByRole('listitem')

    expect(navigation).toHaveTextContent('Filed Jul 2, 2021')
    expect(navigation?.querySelector('time')).toHaveAttribute('datetime', '2021-07-02')
    expect(navigation).toHaveTextContent('Methods and a system for in-store navigation')
    expect(navigation).toHaveTextContent('US 12,536,579 B2')
    expect(navigation?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US12536579B2/en',
    )
    expect(identity).toHaveTextContent('Filed Apr 29, 2022')
    expect(identity).toHaveTextContent('US 12,354,083 B2')
    expect(identity?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US12354083B2/en',
    )
    expect(consent).toHaveTextContent('Filed Oct 14, 2022')
    expect(consent).toHaveTextContent('US 2023/0032782 A1')
    expect(consent?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US20230032782A1/en',
    )
    expect(tokens).toHaveTextContent('Filed Jul 29, 2022')
    expect(tokens).toHaveTextContent(
      'Methods and a system for managing and integrating non-fungible tokens (NFTs)',
    )
    expect(tokens).toHaveTextContent('US 2024/0037539 A1')
    expect(tokens?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US20240037539A1/en',
    )
  })

  it('names no assignee and no other inventor', () => {
    renderSection()
    const text = screen.getByRole('region', { name: 'Patents' }).textContent

    expect(text).not.toMatch(/NCR|Voyix|Digital First|Nonni|McDaniel|Zucker/i)
    expect(text).not.toMatch(/assign|co-inventor|\bwith\b/i)
  })

  it('names each link for the filing it belongs to', () => {
    renderSection()

    expect(
      screen.getByRole('link', {
        name: 'Google Patents: Methods and a system for in-store navigation',
      }),
    ).toBeInTheDocument()
  })

  it('says nothing of what became of a filing, and gives no grant date', () => {
    const section = renderSection()
    const text = screen.getByRole('region', { name: 'Patents' }).textContent

    expect(text).not.toMatch(STATUS_WORDS)
    for (const item of section.getAllByRole('listitem')) {
      // One date to a filing: the day it was filed.
      expect(item.querySelectorAll('time')).toHaveLength(1)
    }
  })

  it('never calls the filings four patents', () => {
    renderSection()
    const text = screen.getByRole('region', { name: 'Patents' }).textContent

    expect(text).not.toMatch(/\b(four|4|three|3|two|2) patents\b/i)
  })

  it('leaves out a filing he has taken off the site, and counts without it', () => {
    const section = renderSection(
      content.patents.map((patent) =>
        patent.id === 'us-20240037539' ? { ...patent, shown: false } : patent,
      ),
    )

    expect(section.getAllByRole('listitem')).toHaveLength(3)
    expect(section.getByText('Named inventor on 3 patent filings.')).toBeVisible()
    expect(section.queryByText(/non-fungible/i)).toBeNull()
  })

  it('prints no filing date for a filing that records none', () => {
    const undated = content.patents.slice(2, 3).map((patent) => ({ ...patent, filed: null }))
    const section = renderSection(undated)
    const [filing] = section.getAllByRole('listitem')

    expect(filing?.querySelector('time')).toBeNull()
    expect(filing).not.toHaveTextContent(/filed/i)
    expect(filing).toHaveTextContent(/^Self-Sovereign Identity/)
    expect(section.getByText('Named inventor on 1 patent filing.')).toBeVisible()
  })

  it('prints no summary and no list when there is no filing to show', () => {
    const section = renderSection([])

    expect(section.queryByText(/patent filing/i)).toBeNull()
    expect(section.queryByRole('list')).toBeNull()
  })
})
