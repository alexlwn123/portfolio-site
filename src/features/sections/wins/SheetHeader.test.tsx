import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { winsCopy } from './copy'
import { SheetHeader } from './SheetHeader'
import { winsSpan, winsTally } from './winFacts'

const tally = winsTally(stats.wins)
const span = winsSpan(content.wins)

function renderHeader(): HTMLElement {
  return render(<SheetHeader total={stats.wins.total} tally={tally} span={span} />).container
}

describe('SheetHeader', () => {
  it('prints the name of the set, and that the newest comes first', () => {
    const header = renderHeader()

    expect(header).toHaveTextContent(winsCopy.sheet.name)
    expect(header).toHaveTextContent(winsCopy.sheet.edition)
  })

  it('counts the pieces from the derived number, and the years from the record', () => {
    const header = renderHeader()

    expect(header).toHaveTextContent(winsCopy.sheet.pieces(stats.wins.total))
    expect(header).toHaveTextContent('9 pcs')
    expect(header).toHaveTextContent('2021–2026')
  })

  it('tallies the firsts, the seconds and the prize as a list', () => {
    renderHeader()

    const items = within(
      screen.getByRole('list', { name: winsCopy.sheet.tallyLabel }),
    ).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['6 firsts', '2 seconds', '1 prize'])
    expect(items.map((item) => item.getAttribute('data-finish'))).toEqual([
      'first',
      'second',
      'prize',
    ])
  })

  it('shows a swatch of each finish, for the eye only', () => {
    renderHeader()

    for (const item of screen.getAllByRole('listitem')) {
      expect(item.querySelector('[aria-hidden="true"]')).toBeEmptyDOMElement()
    }
  })

  it('draws the barcode and the hang hole for the eye only', () => {
    const header = renderHeader()

    expect(header.querySelector('[data-barcode]')).toHaveAttribute('aria-hidden', 'true')
    expect(header.querySelector('[data-hang-hole]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('leaves the years out when there are no wins to span', () => {
    const { container } = render(<SheetHeader total={0} tally={[]} span={null} />)

    expect(container).toHaveTextContent(winsCopy.sheet.pieces(0))
    expect(container.textContent).not.toMatch(/\d{4}/)
    expect(screen.queryByRole('listitem')).toBeNull()
  })
})
