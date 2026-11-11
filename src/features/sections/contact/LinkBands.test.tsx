import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { contactCopy } from './copy'
import { LinkBands } from './LinkBands'
import { contactBands } from './links'

const bands = contactBands(content.profile.links)

describe('LinkBands', () => {
  it('is a list of wristband strips, one link to a strip', () => {
    render(<LinkBands bands={bands} />)

    const list = screen.getByRole('list', { name: contactCopy.bands.list })
    const items = within(list).getAllByRole('listitem')

    expect(items).toHaveLength(content.profile.links.length)
    for (const item of items) {
      expect(within(item).getAllByRole('link')).toHaveLength(1)
    }
  })

  it('prints each link’s label and leads to its address', () => {
    render(<LinkBands bands={bands} />)
    const links = screen.getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      content.profile.links.map(({ url }) => url),
    )
    expect(links.map((link) => link.textContent.trim())).toEqual(
      content.profile.links.map(({ label, shortLabel }) => shortLabel ?? label),
    )
  })

  it('marks each strip with the link it carries', () => {
    const { container } = render(<LinkBands bands={bands} />)

    expect(
      [...container.querySelectorAll('li[data-band]')].map((item) =>
        item.getAttribute('data-band'),
      ),
    ).toEqual(content.profile.links.map(({ id }) => id))
  })

  it('draws the snaps and the tear-off tab for the eye only', () => {
    const { container } = render(<LinkBands bands={bands.slice(0, 1)} />)
    const drawn = container.querySelectorAll('[aria-hidden="true"]')

    expect(drawn.length).toBeGreaterThan(0)
    expect(screen.getByRole('link').textContent.trim()).toBe('GitHub')
  })

  it('renders nothing when there are no links', () => {
    const { container } = render(<LinkBands bands={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('carries no inline style', () => {
    const { container } = render(<LinkBands bands={bands} />)

    expect(container.querySelector('[style]')).toBeNull()
  })
})
