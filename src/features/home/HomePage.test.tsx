import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { SECTION_IDS } from '../sections/sectionIds'
import { HomePage } from './HomePage'

const photo: BadgePhotoImage = {
  sources: [{ type: 'image/avif', srcSet: '/_astro/portrait.avif 424w' }],
  src: '/_astro/portrait.webp',
  width: 424,
  height: 1154,
  sizes: '30vw',
}

function renderHome(): HTMLElement {
  return render(<HomePage content={content} stats={stats} photo={photo} />).container
}

describe('HomePage', () => {
  it('wraps the lid and every section in the one main landmark', () => {
    const container = renderHome()

    const main = screen.getByRole('main')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(main).toContainElement(container.querySelector('[data-lid-stage]'))
    for (const id of SECTION_IDS) {
      expect(main).toContainElement(document.getElementById(id))
    }
  })

  it('puts the lid first, then the sections', () => {
    const container = renderHome()

    const lid = container.querySelector('[data-lid-desk]')
    const first = document.getElementById(SECTION_IDS[0])
    expect(lid).not.toBeNull()
    expect(first).not.toBeNull()
    expect(
      lid && first && lid.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('keeps the name as the page’s only h1', () => {
    renderHome()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(content.profile.name)
  })
})
