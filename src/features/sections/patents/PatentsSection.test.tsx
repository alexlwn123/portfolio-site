import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { publishablePatents } from '../../../content/derive'
import { patentsCopy } from './copy'
import { PatentsSection } from './PatentsSection'

function renderSection(): HTMLElement {
  render(<PatentsSection content={content} stats={stats} />)
  return screen.getByRole('region', { name: /^Patents$/ })
}

describe('PatentsSection', () => {
  it('is the patents section, on the lid, with the plate straight under the title', () => {
    const section = renderSection()

    expect(section).toHaveAttribute('id', 'patents')
    expect(section).toHaveAttribute('data-surface', 'lid')
    // No line under the title: the plate says it all.
    expect(section.querySelector('h2')?.closest('header')?.querySelector('p') ?? null).toBeNull()
  })

  it('holds one plate with a row for every filing he shows', () => {
    const section = renderSection()

    expect(section.querySelectorAll('[data-plate]')).toHaveLength(1)
    expect(section.querySelectorAll('li[data-patent]')).toHaveLength(
      publishablePatents(content.patents).length,
    )
  })

  it('says he is a named inventor on four patent filings, never on four patents', () => {
    const section = renderSection()

    expect(section).toHaveTextContent(/Named inventor on\s*4\s*U\.S\. patent filings/)
    expect(section.textContent).not.toMatch(/(four|4) patents/i)
  })

  it('lists all four the same way, with not a word about what became of any', () => {
    const section = renderSection()

    for (const { number, title } of content.patents) {
      expect(section).toHaveTextContent(number.serial)
      expect(section).toHaveTextContent(title)
    }
    expect(section.textContent).not.toMatch(/grant|pending|abandon|application|status/i)
  })

  it('links every row to its public record and nowhere else', () => {
    const hrefs = within(renderSection())
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(publishablePatents(content.patents).map(({ link }) => link.url))
  })

  it('sticks the inspection stickers down after the plate, signed with his initials', () => {
    const section = renderSection()
    const plate = section.querySelector('[data-plate]')
    const stickers = within(section).getByRole('list', { name: patentsCopy.stickers.list })

    expect(
      plate && plate.compareDocumentPosition(stickers) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(stickers).toHaveTextContent('AL')
  })

  it('adds no second h2 and carries no inline style', () => {
    const section = renderSection()

    expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(section.querySelector('[style]')).toBeNull()
  })
})
