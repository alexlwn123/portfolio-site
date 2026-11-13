import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { navCopy } from '../nav/copy'
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

    const lid = container.querySelector('[data-lid]')
    const first = document.getElementById(SECTION_IDS[0])
    expect(lid).not.toBeNull()
    expect(first).not.toBeNull()
    expect(
      lid && first && lid.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('lays the strap between the lid and the first section, as a child of main', () => {
    const container = renderHome()

    const main = screen.getByRole('main')
    const strap = screen.getByRole('navigation', { name: navCopy.label })
    expect(strap.parentElement).toBe(main)
    expect(strap.previousElementSibling).toBe(container.querySelector('[data-lid]'))
    expect(strap.nextElementSibling).toBe(document.getElementById(SECTION_IDS[0]))
  })

  it('gives every navigation landmark a name of its own', () => {
    renderHome()

    const names = screen.getAllByRole('navigation').map((nav) => nav.getAttribute('aria-label'))
    expect(names).toEqual(['Sections', 'Elsewhere', 'More elsewhere', navCopy.label])
    expect(new Set(names).size).toBe(names.length)
  })

  it('gives the lid the id the strap’s way back points at', () => {
    const container = renderHome()

    expect(container.querySelector('[data-lid]')).toHaveAttribute('id', 'top')
    expect(
      screen.getByRole('navigation', { name: navCopy.label }).querySelector('a'),
    ).toHaveAttribute('href', '/#top')
  })

  it('leads from the lid to every section that the ribbons and the strap name', () => {
    const container = renderHome()
    const targets = [...container.querySelectorAll('a[href^="/#"]')].map((link) =>
      (link.getAttribute('href') ?? '').slice(2),
    )

    expect(targets.length).toBeGreaterThan(SECTION_IDS.length)
    for (const target of targets) {
      expect(document.getElementById(target), target).not.toBeNull()
    }
    for (const id of SECTION_IDS) {
      expect(targets).toContain(id)
    }
  })

  it('keeps the name as the page’s only h1', () => {
    renderHome()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(content.profile.name)
  })
})
