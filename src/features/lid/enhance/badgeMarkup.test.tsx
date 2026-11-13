import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { BadgePhotoImage } from '../../badge/photoSources'
import { STRAP_LINES } from '../../stickers/geometry/lanyard'
import { Lid } from '../Lid'
import { findHang } from './badgeMeasure'

/*
 * The script reads the lid the page really renders, not only the small one
 * its other tests build: this keeps the two from drifting apart.
 */

const photo: BadgePhotoImage = {
  sources: [{ type: 'image/webp', srcSet: '/_astro/portrait.webp 424w' }],
  src: '/_astro/portrait.webp',
  width: 424,
  height: 1154,
  sizes: '30vw',
}

describe('the lid as the page renders it', () => {
  it('has a lanyard and a badge the script can find, with both straps and their stars', () => {
    const { container } = render(<Lid content={content} stats={stats} photo={photo} />)
    const lid = container.querySelector<HTMLElement>('[data-lid]')
    const hang = lid && findHang(lid)

    expect(hang).not.toBeNull()
    expect(hang?.straps[0].fixedAtStart).toBe(true)
    expect(hang?.straps[0].restLine).toBe(
      `M${String(STRAP_LINES.left.from.x)} ${String(STRAP_LINES.left.from.y)}L${String(STRAP_LINES.left.to.x)} ${String(STRAP_LINES.left.to.y)}`,
    )
    expect(hang?.straps[1].stars.length).toBeGreaterThan(2)
    expect(hang?.card.querySelector('nav a')).not.toBeNull()
  })
})
