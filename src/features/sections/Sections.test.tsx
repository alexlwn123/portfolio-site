import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { SECTION_IDS, sectionAnchor, titleId } from './sectionIds'
import { Sections } from './Sections'

function renderSections(): HTMLElement {
  return render(<Sections content={content} stats={stats} />).container
}

describe('Sections', () => {
  it('lays the sections out in the order the page promises', () => {
    const container = renderSections()

    const ids = [...container.querySelectorAll('section')].map((section) => section.id)
    expect(ids).toEqual([...SECTION_IDS])
  })

  it('gives every section a heading of its own, and names the section by it', () => {
    renderSections()

    for (const id of SECTION_IDS) {
      const section = document.getElementById(id)
      const heading = document.getElementById(titleId(id))

      expect(section?.getAttribute('aria-labelledby')).toBe(titleId(id))
      expect(heading?.tagName).toBe('H2')
      expect(heading?.textContent.trim()).not.toBe('')
      expect(section).toContainElement(heading)
    }
  })

  it('has no h1: the name on the lid is the page’s only one', () => {
    renderSections()

    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(SECTION_IDS.length)
  })

  it('makes every section a region a reader can jump to', () => {
    renderSections()

    const regions = screen.getAllByRole('region')
    expect(regions).toHaveLength(SECTION_IDS.length)
    for (const region of regions) {
      expect(within(region).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    }
  })
})

describe('sectionAnchor', () => {
  it('is the address of a section on the home page', () => {
    expect(sectionAnchor('work')).toBe('/#work')
    expect(sectionAnchor('contact')).toBe('/#contact')
  })
})
