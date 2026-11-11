import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LinkChips } from './LinkChips'

const links = [
  { label: 'Site', url: 'https://pleb.fm' },
  { label: 'Code', url: 'https://github.com/PlebFM/PlebFM' },
]

describe('LinkChips', () => {
  it('is a list with a link for every address, in the order given', () => {
    render(<LinkChips links={links} context="Pleb FM" />)

    expect(screen.getAllByRole('listitem')).toHaveLength(links.length)
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      'https://pleb.fm',
      'https://github.com/PlebFM/PlebFM',
    ])
  })

  it('names each link with what it belongs to, so "Code" is never ambiguous', () => {
    render(<LinkChips links={links} context="Pleb FM" />)

    expect(screen.getByRole('link', { name: 'Code: Pleb FM' })).toHaveAttribute(
      'href',
      'https://github.com/PlebFM/PlebFM',
    )
    expect(screen.getByRole('link', { name: 'Site: Pleb FM' })).toBeInTheDocument()
  })

  it('draws its arrow, and hides it from a screen reader', () => {
    const { container } = render(<LinkChips links={links} context="Pleb FM" />)

    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(links.length)
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('renders nothing when there is nowhere to go', () => {
    const { container } = render(<LinkChips links={[]} context="Pleb FM" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('takes a class for where it sits', () => {
    render(<LinkChips links={links} context="Pleb FM" className="under" />)

    expect(screen.getByRole('list')).toHaveClass('under')
  })
})
