import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { copy } from '../../content/copy'
import { SECTION_IDS, sectionAnchor } from '../sections/sectionIds'
import { navCopy } from './copy'
import { PinnedStrap } from './PinnedStrap'

function renderStrap() {
  const { container } = render(<PinnedStrap />)
  return { container, nav: screen.getByRole('navigation') }
}

describe('PinnedStrap', () => {
  it('is a navigation landmark with a name of its own, not the ribbons’ name', () => {
    const { nav } = renderStrap()

    expect(nav).toHaveAccessibleName(navCopy.label)
    expect(navCopy.label).not.toBe(copy.lid.nav.sections)
    expect([copy.lid.nav.elsewhere, copy.lid.nav.moreElsewhere]).not.toContain(navCopy.label)
  })

  it('starts with the way back to the top of the page', () => {
    const { nav } = renderStrap()
    const [first] = within(nav).getAllByRole('link')

    expect(first).toHaveAttribute('href', '/#top')
    expect(first).toHaveAccessibleName(navCopy.top)
  })

  it('then links to every section, in the order of the page', () => {
    const { nav } = renderStrap()
    const [, ...links] = within(nav).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual(SECTION_IDS.map(sectionAnchor))
    expect(links.map((link) => link.textContent)).toEqual(
      SECTION_IDS.map((id) => navCopy.sections[id]),
    )
  })

  it('says which section each link leads to, so the page’s script-free CSS can find it', () => {
    const { nav } = renderStrap()
    const [, ...links] = within(nav).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('data-to'))).toEqual(SECTION_IDS)
  })

  it('lists the sections as one list, so a screen reader can say how many there are', () => {
    const { nav } = renderStrap()

    expect(within(nav).getAllByRole('list')).toHaveLength(1)
    expect(within(nav).getAllByRole('listitem')).toHaveLength(SECTION_IDS.length)
  })

  it('keeps the way back out of the list that scrolls, so no link can slide under it', () => {
    const { nav } = renderStrap()
    const back = within(nav).getByRole('link', { name: navCopy.top })
    const list = within(nav).getByRole('list')

    expect(list).not.toContainElement(back)
    expect(back.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps every label short enough for a phone', () => {
    const labels = [navCopy.top, ...SECTION_IDS.map((id) => navCopy.sections[id])]

    for (const label of labels) {
      expect(label.length, label).toBeLessThanOrEqual(9)
    }
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('draws its stars and its arrow for the eye only, and types neither', () => {
    const { container, nav } = renderStrap()
    const drawings = [...container.querySelectorAll('svg')]

    expect(drawings.length).toBeGreaterThanOrEqual(SECTION_IDS.length)
    for (const drawing of drawings) {
      expect(drawing).toHaveAttribute('aria-hidden', 'true')
    }
    expect(nav.textContent).not.toMatch(/[←-⇿✦★☆]/)
  })

  it('prints its links and nothing else: the rest of the strap is bare', () => {
    const { container, nav } = renderStrap()
    const labels = [navCopy.top, ...SECTION_IDS.map((id) => navCopy.sections[id])]

    expect(nav.textContent).toBe(labels.join(''))
    expect(container.querySelector('[aria-hidden="true"]:not(svg)')).toBeNull()
    expect(nav.children).toHaveLength(2)
    expect(within(nav).getAllByRole('link')).toHaveLength(SECTION_IDS.length + 1)
    expect(nav).toHaveAccessibleName(navCopy.label)
  })

  it('points at no bare fragment, so the links work from any page', () => {
    const { container } = renderStrap()

    expect(container.querySelector('a[href^="#"]')).toBeNull()
    expect(container.querySelectorAll('[style]')).toHaveLength(0)
  })
})
