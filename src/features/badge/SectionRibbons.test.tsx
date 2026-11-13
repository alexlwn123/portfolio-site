import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { flattenStickers } from '../lid/stickerSpecs'
import { lidStickers } from '../lid/stickers'
import { SECTION_IDS, sectionAnchor } from '../sections/sectionIds'
import tones from '../stickers/tones.module.css'
import type { Ribbon } from './ribbons'
import { SectionRibbons } from './SectionRibbons'

function lidRibbons(): readonly Ribbon[] {
  const badge = flattenStickers(lidStickers(content, stats)).find(({ kind }) => kind === 'badge')
  return badge?.kind === 'badge' ? badge.ribbons : []
}

function renderRibbons() {
  render(<SectionRibbons label="Sections" ribbons={lidRibbons()} />)
  return within(screen.getByRole('navigation', { name: 'Sections' }))
}

/** The ribbons themselves: the items of the landmark's own list, not of a list on one of them. */
function ribbonItems(): readonly HTMLElement[] {
  const nav = screen.getByRole('navigation', { name: 'Sections' })
  return [...nav.querySelectorAll<HTMLElement>(':scope > ul > li')]
}

function hackathons(): HTMLElement {
  const item = ribbonItems().find((ribbon) => ribbon.querySelector('[data-pin]') !== null)
  if (!item) {
    throw new Error('Expected a ribbon with pins on it')
  }
  return item
}

describe('SectionRibbons', () => {
  it('SectionRibbons counts come from derive', () => {
    const nav = renderRibbons()

    expect(
      nav.getByRole('link', { name: `ORGANIZER ×${String(stats.organized.count)}` }),
    ).toBeVisible()
    expect(nav.getByRole('link', { name: `WINNER ×${String(stats.wins.total)}` })).toBeVisible()
    expect(stats.organized.count).toBe(16)
    expect(stats.wins.total).toBe(content.wins.length)
  })

  it('leads to every section this page has but the contact one', () => {
    const nav = renderRibbons()
    const hrefs = nav.getAllByRole('link').map((link) => link.getAttribute('href'))

    // The two sections about hackathons share a ribbon, so they come together.
    expect(hrefs).toEqual(['/#work', '/#wins', '/#organized', '/#projects', '/#talks', '/#patents'])
    expect(hrefs.toSorted()).toEqual(
      SECTION_IDS.filter((id) => id !== 'contact')
        .map(sectionAnchor)
        .toSorted(),
    )
  })

  it('hangs five ribbons for what he is: engineer first, inventor last', () => {
    renderRibbons()

    expect(ribbonItems()).toHaveLength(5)
    expect(ribbonItems().map((item) => item.querySelector('[data-ribbon]')?.textContent)).toEqual([
      'ENGINEER',
      'HACKATHONS',
      'BUILDER',
      'SPEAKER',
      'INVENTOR',
    ])
  })

  it('makes one ribbon of the hackathons, with a pin for each thing he does at them', () => {
    renderRibbons()
    const ribbon = hackathons()
    const pins = within(ribbon).getAllByRole('link')

    expect(pins.map((pin) => pin.getAttribute('aria-label'))).toEqual([
      `WINNER ×${String(stats.wins.total)}`,
      `ORGANIZER ×${String(stats.organized.count)}`,
    ])
    expect(pins.map((pin) => pin.getAttribute('href'))).toEqual(['/#wins', '/#organized'])
    expect(pins.every((pin) => pin.hasAttribute('data-pin'))).toBe(true)
  })

  it('does not make the hackathons ribbon a link: its pins are the ways in', () => {
    renderRibbons()
    const ribbon = hackathons()
    const word = within(ribbon).getByText('HACKATHONS')

    expect(word.closest('a')).toBeNull()
    expect(ribbon.querySelectorAll('a')).toHaveLength(2)
    // The pins are a list of their own, on the ribbon, read after its word.
    const pins = within(ribbon).getByRole('list')
    expect(within(pins).getAllByRole('listitem')).toHaveLength(2)
    expect(word.compareDocumentPosition(pins) & Node.DOCUMENT_POSITION_FOLLOWING).toBeGreaterThan(0)
  })

  it('makes every other ribbon one link, with nothing pinned to it', () => {
    renderRibbons()
    const plain = ribbonItems().filter((item) => item.querySelector('[data-pin]') === null)

    expect(plain).toHaveLength(4)
    for (const item of plain) {
      expect(item.querySelectorAll('a')).toHaveLength(1)
      expect(item.querySelector('a')).toHaveAttribute('data-ribbon')
      expect(item.querySelector('ul')).toBeNull()
    }
  })

  it('is a list of ribbons inside one navigation landmark', () => {
    const nav = renderRibbons()

    expect(nav.getAllByRole('list')).toHaveLength(2)
    expect(nav.getAllByRole('link')).toHaveLength(6)
  })

  it('ends with the inventor ribbon, which leads to the patents', () => {
    const nav = renderRibbons()
    const inventor = nav.getAllByRole('link').at(-1)

    expect(inventor).toHaveTextContent(/^INVENTOR$/)
    expect(inventor).toHaveAttribute('href', '/#patents')
    expect(inventor).toHaveClass(tones.white ?? '')
  })

  it('cuts the engineer ribbon from ink, the one colour that takes white lettering', () => {
    const nav = renderRibbons()

    expect(nav.getByRole('link', { name: 'ENGINEER' })).toHaveClass(tones.ink ?? '')
  })

  it('cuts each ribbon and each pin from its own colour', () => {
    const nav = renderRibbons()

    // The ribbon itself is what is cut from a colour, not the word printed on it.
    expect(hackathons().firstElementChild).toHaveClass(tones.hi ?? '')
    expect(nav.getByRole('link', { name: /WINNER/ })).toHaveClass(tones.ink ?? '')
    expect(nav.getByRole('link', { name: /ORGANIZER/ })).toHaveClass(tones.tang ?? '')
    expect(nav.getByRole('link', { name: 'BUILDER' })).toHaveClass(tones.gum ?? '')
    expect(nav.getByRole('link', { name: 'SPEAKER' })).toHaveClass(tones.mint ?? '')
  })

  it('keeps every link in its own tab and carries no inline style', () => {
    const nav = renderRibbons()

    expect(nav.getAllByRole('link').filter((link) => link.hasAttribute('target'))).toEqual([])
    expect(screen.getByRole('navigation').querySelectorAll('[style]')).toHaveLength(0)
  })

  it('pins each as a round button, a drawing of its own', () => {
    renderRibbons()
    const drawings = [...hackathons().querySelectorAll('[data-pin] > svg')]
    const ids = drawings.flatMap((drawing) =>
      [...drawing.querySelectorAll('[id]')].map(({ id }) => id),
    )

    expect(drawings).toHaveLength(2)
    expect(drawings.every((drawing) => drawing.hasAttribute('data-pin-button'))).toBe(true)
    expect(drawings.map((drawing) => drawing.querySelector('textPath')?.textContent)).toEqual([
      'WINNER',
      'ORGANIZER',
    ])
    expect(new Set(ids).size).toBe(ids.length)
  })
})
