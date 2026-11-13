import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Wristband } from './Wristband'
import styles from './Wristband.module.css'

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/alexlwn123' },
  { label: 'X', href: 'https://x.com/ALewin' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/alex-lewin-058265174/' },
]

describe('Wristband', () => {
  it('lists its links in order, each to its own address', () => {
    render(<Wristband tone="gum" links={LINKS} />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    const links = items.map((item) => within(item).getByRole('link'))

    expect(links.map((link) => link.textContent)).toEqual(LINKS.map(({ label }) => label))
    expect(links.map((link) => link.getAttribute('href'))).toEqual(LINKS.map(({ href }) => href))
  })

  it('opens each link that leaves the site in a new tab', () => {
    render(<Wristband tone="gum" links={[...LINKS, { label: 'Plain CV', href: '/cv/' }]} />)

    for (const { label } of LINKS) {
      const link = screen.getByRole('link', { name: label })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener')
    }
    expect(screen.getByRole('link', { name: 'Plain CV' })).not.toHaveAttribute('target')
  })

  it('draws a star between neighbours, never before the first', () => {
    const { container } = render(<Wristband tone="gum" links={LINKS} />)

    expect(container.querySelectorAll('svg')).toHaveLength(2)
    expect(container.querySelector('li')?.querySelector('svg')).toBeNull()
    expect(container.textContent).toBe('GitHubXLinkedIn')
  })

  it('hides the tear-off tab from readers', () => {
    const { container } = render(<Wristband tone="gum" links={LINKS} />)

    expect(container.querySelector('span[aria-hidden="true"]')).toBeEmptyDOMElement()
  })

  it.each([
    ['gum', false],
    ['hi', true],
  ] as const)('on a %s band, inks the stars: %s', (tone, inked) => {
    const { container } = render(<Wristband tone={tone} links={LINKS} />)

    expect(container.firstElementChild?.classList.contains(styles.inkStars ?? '')).toBe(inked)
  })
})
