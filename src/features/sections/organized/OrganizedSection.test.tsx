import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { formatNumber, formatUsd } from '../../../lib/formatNumber'
import { organizedCopy } from './copy'
import { OrganizedSection } from './OrganizedSection'

function renderSection(): HTMLElement {
  render(<OrganizedSection content={content} stats={stats} />)
  return screen.getByRole('region')
}

describe('OrganizedSection', () => {
  it('is the "organized" section, on the lid, under the mockup’s title', () => {
    const section = renderSection()

    expect(section.id).toBe('organized')
    expect(section).toHaveAttribute('data-surface', 'lid')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      /^HACKATHONS\s*ORGANIZED\s*$/,
    )
    // No line under the title: the totals say it.
    expect(section.querySelector('h2')?.closest('header')?.querySelector('p') ?? null).toBeNull()
  })

  it('prints every total from the derived numbers', () => {
    renderSection()
    const totals = screen.getByRole('list', { name: organizedCopy.totalsLabel })

    expect(totals).toHaveTextContent(organizedCopy.count(stats.organized.count))
    expect(totals).toHaveTextContent(`${String(stats.organized.countryCount)} countries + online`)
    expect(totals).toHaveTextContent(formatNumber(stats.organized.participants))
    expect(totals).toHaveTextContent(formatUsd(stats.organized.prizeUsd))
    expect(totals).toHaveTextContent(
      organizedCopy.participantsFootnote(stats.organized.headCountEvents),
    )
    expect(totals).toHaveTextContent(organizedCopy.prizesFootnote(stats.organized.prizeEvents))
  })

  it('wears a band for every hackathon in the record', () => {
    const section = renderSection()
    const bands = within(section).getAllByRole('heading', { level: 3 })

    expect(bands.map((band) => band.textContent)).toEqual(content.organized.map(({ name }) => name))
  })

  it('stamps the hand with the year of the first one', () => {
    renderSection()

    expect(screen.getByRole('img')).toHaveAccessibleName(
      new RegExp(`SINCE ${String(stats.organized.sinceYear)}`),
    )
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
