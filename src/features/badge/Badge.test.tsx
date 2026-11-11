import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { flattenStickers } from '../lid/stickerSpecs'
import { lidStickers } from '../lid/stickers'
import { Badge, type BadgeProps } from './Badge'
import type { BadgePhotoImage } from './photoSources'

const photo: BadgePhotoImage = {
  sources: [
    { type: 'image/avif', srcSet: '/_astro/portrait.avif 424w' },
    { type: 'image/webp', srcSet: '/_astro/portrait.webp 424w' },
  ],
  src: '/_astro/portrait.webp',
  width: 424,
  height: 1154,
  sizes: '30vw',
}

function badgeProps(): BadgeProps {
  const spec = flattenStickers(lidStickers(content, stats)).find(({ kind }) => kind === 'badge')
  if (spec?.kind !== 'badge') {
    throw new Error('The lid has no badge')
  }
  return { ...spec, photo }
}

function renderBadge() {
  return render(<Badge {...badgeProps()} />)
}

describe('Badge', () => {
  it('Badge shows name, real title and photo alt', () => {
    const { container } = renderBadge()
    const { givenName, familyName, role } = content.profile

    expect(screen.getByText(givenName)).toBeInTheDocument()
    expect(screen.getByText(familyName)).toBeInTheDocument()
    expect(container).toHaveTextContent(role.title)
    expect(role.title).toBe('Minister of Development')
    expect(screen.getByRole('img', { name: 'Alex Lewin, smiling, in a cap' })).toBeInTheDocument()
  })

  it('says where he works and where he is based', () => {
    renderBadge()

    expect(screen.getByText('Finite Computer · Atlanta, GA')).toBeInTheDocument()
  })

  it('tells a reader who cannot see the scrawl that the title is real', () => {
    renderBadge()

    expect(screen.getByText(content.profile.role.title)).toHaveTextContent(
      'Minister of Development (real title)',
    )
    expect(screen.getByText('real title')).toHaveAttribute('aria-hidden', 'true')
  })

  it('lists what he does at these events', () => {
    renderBadge()

    const roles = screen.getByText('Hacker').closest('ul')
    expect(roles?.querySelectorAll('li')).toHaveLength(3)
    expect(roles).toHaveTextContent('HackerOrganizerSpeaker')
  })

  it('does not make the name a heading or a link: the page has one of each elsewhere', () => {
    renderBadge()

    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText(content.profile.givenName).closest('a')).toBeNull()
  })

  it('carries the section ribbons as the page’s navigation', () => {
    renderBadge()

    const nav = screen.getByRole('navigation', { name: 'Sections' })
    expect(within(nav).getAllByRole('link')).toHaveLength(6)
  })

  it('marks the card, sleeve and ribbons together, as what a hand takes hold of', () => {
    const { container } = renderBadge()
    const card = container.querySelector('[data-badge-card]')

    expect(container.querySelectorAll('[data-badge-card]')).toHaveLength(1)
    expect(card?.querySelector('nav')).not.toBeNull()
    expect(card?.querySelector('img')).not.toBeNull()
  })

  it('names its clip’s gradient after the sticker', () => {
    const { container } = renderBadge()

    expect(container.querySelector('linearGradient')).toHaveAttribute('id', 'badge-metal')
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
