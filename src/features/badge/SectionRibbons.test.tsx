import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { SECTION_IDS, sectionAnchor } from '../sections/sectionIds'
import { flattenStickers } from '../lid/stickerSpecs'
import { lidStickers } from '../lid/stickers'
import tones from '../stickers/tones.module.css'
import { type Ribbon, SectionRibbons } from './SectionRibbons'

function lidRibbons(): readonly Ribbon[] {
  const badge = flattenStickers(lidStickers(content, stats)).find(({ kind }) => kind === 'badge')
  return badge?.kind === 'badge' ? badge.ribbons : []
}

function renderRibbons() {
  render(<SectionRibbons label="Sections" ribbons={lidRibbons()} />)
  return within(screen.getByRole('navigation', { name: 'Sections' }))
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

  it('leads each ribbon to a section this page really has, in the order of the page', () => {
    const nav = renderRibbons()
    const sections = SECTION_IDS.map(sectionAnchor)
    const hrefs = nav.getAllByRole('link').map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['/#work', '/#wins', '/#projects', '/#organized', '/#talks', '/#patents'])
    expect(hrefs).toEqual(sections.slice(0, hrefs.length))
  })

  it('names the six ribbons for what he is: engineer first', () => {
    const nav = renderRibbons()

    expect(nav.getAllByRole('link').map((link) => link.textContent.replace(/\s+/g, ' '))).toEqual([
      'ENGINEER',
      `WINNER ×${String(stats.wins.total)}`,
      'BUILDER',
      `ORGANIZER ×${String(stats.organized.count)}`,
      'SPEAKER',
      'INVENTOR',
    ])
  })

  it('is a list of links inside one navigation landmark', () => {
    const nav = renderRibbons()

    expect(within(nav.getByRole('list')).getAllByRole('listitem')).toHaveLength(6)
  })

  it('ends with the inventor ribbon, which leads to the patents and carries no count', () => {
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

  it('prints no count on a ribbon that has none', () => {
    const nav = renderRibbons()

    expect(nav.getByRole('link', { name: 'SPEAKER' })).toHaveTextContent(/^SPEAKER$/)
  })

  it('cuts each ribbon from its own colour', () => {
    const nav = renderRibbons()

    expect(nav.getByRole('link', { name: /ORGANIZER/ })).toHaveClass(tones.tang ?? '')
    expect(nav.getByRole('link', { name: 'BUILDER' })).toHaveClass(tones.gum ?? '')
  })
})
