import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SHARED_IDS } from '../stickers/svgIds'
import { BadgePhoto } from './BadgePhoto'
import type { BadgePhotoImage } from './photoSources'

const photo: BadgePhotoImage = {
  sources: [
    { type: 'image/avif', srcSet: '/_astro/a.avif 212w, /_astro/b.avif 424w' },
    { type: 'image/webp', srcSet: '/_astro/a.webp 212w, /_astro/b.webp 424w' },
  ],
  src: '/_astro/b.webp',
  width: 424,
  height: 1154,
  sizes: '(max-width: 560px) 56vw, min(30vw, 296px)',
}

const css = readFileSync(resolve(import.meta.dirname, 'BadgePhoto.module.css'), 'utf8')

describe('BadgePhoto', () => {
  it('describes the photo in its alt text', () => {
    render(<BadgePhoto photo={photo} alt="Alex Lewin, smiling, in a cap" />)

    expect(screen.getByRole('img', { name: 'Alex Lewin, smiling, in a cap' })).toHaveAttribute(
      'src',
      '/_astro/b.webp',
    )
  })

  it('offers AVIF before WebP, each with its sizes', () => {
    const { container } = render(<BadgePhoto photo={photo} alt="alt" />)
    const sources = [...container.querySelectorAll('source')]

    expect(sources.map((source) => source.type)).toEqual(['image/avif', 'image/webp'])
    for (const source of sources) {
      expect(source).toHaveAttribute('sizes', photo.sizes)
      expect(source.getAttribute('srcset')).toContain('424w')
    }
  })

  it('states the image’s own size, and embeds no image data', () => {
    const { container } = render(<BadgePhoto photo={photo} alt="alt" />)

    expect(screen.getByRole('img')).toHaveAttribute('width', '424')
    expect(screen.getByRole('img')).toHaveAttribute('height', '1154')
    expect(container.innerHTML).not.toContain('data:')
  })

  it('is tinted by the shared gradient map, by its id', () => {
    expect(css).toContain(`url('#${SHARED_IDS.tritone}')`)
  })
})
