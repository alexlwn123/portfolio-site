import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { SECTIONS } from '../cv/labels'
import { Lid } from './Lid'
import { flattenStickers, isDecoration, linksOf } from './stickerSpecs'
import { lidStickers, STICKER_IDS } from './stickers'

const photo: BadgePhotoImage = {
  sources: [{ type: 'image/avif', srcSet: '/_astro/portrait.avif 424w' }],
  src: '/_astro/portrait.webp',
  width: 424,
  height: 1154,
  sizes: '30vw',
}

const specs = flattenStickers(lidStickers(content, stats))

function renderLid(): HTMLElement {
  return render(<Lid content={content} stats={stats} photo={photo} />).container
}

function stickerIds(container: HTMLElement): readonly (string | null)[] {
  return [...container.querySelectorAll('[data-sticker]')].map((sticker) =>
    sticker.getAttribute('data-sticker'),
  )
}

describe('Lid', () => {
  it('has exactly one h1, and it is his name', () => {
    renderLid()

    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
    expect(headings[0]?.tagName).toBe('H1')
    expect(headings[0]).toHaveAccessibleName(content.profile.name)
    expect(headings[0]?.textContent).toBe(content.profile.name)
  })

  it('does not make the name a link', () => {
    renderLid()

    const name = screen.getByRole('heading', { level: 1 })
    expect(name.closest('a')).toBeNull()
    expect(name.querySelector('a')).toBeNull()
  })

  it('wraps everything in the main landmark', () => {
    const container = renderLid()

    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toContainElement(container.querySelector('[data-lid-stage]'))
  })

  it('sticks down every sticker once, in reading order', () => {
    expect(stickerIds(renderLid())).toEqual(STICKER_IDS)
  })

  it('emits no inline styles', () => {
    const container = renderLid()

    expect(container.querySelectorAll('[style]')).toHaveLength(0)
    expect(container.querySelectorAll('style')).toHaveLength(0)
    expect(container.querySelectorAll('script')).toHaveLength(0)
  })

  it('has three navigation landmarks: the ribbons and the two rows of contact links', () => {
    renderLid()

    const names = screen.getAllByRole('navigation').map((nav) => nav.getAttribute('aria-label'))
    expect(names).toEqual(['Sections', 'Elsewhere', 'More elsewhere'])
  })

  it('groups the city pills and the project stickers as lists', () => {
    renderLid()

    const cities = screen.getByRole('list', { name: 'Cities I have run hackathons in' })
    const projects = screen.getByRole('list', { name: 'Projects' })
    expect(within(cities).getAllByRole('listitem')).toHaveLength(8)
    expect(within(projects).getAllByRole('listitem')).toHaveLength(4)
    expect(within(projects).getAllByRole('link')).toHaveLength(4)
  })

  it('gives the photo real alt text', () => {
    renderLid()

    expect(screen.getByRole('img', { name: 'Alex Lewin, smiling, in a cap' })).toBeInTheDocument()
  })

  it('has two images to announce: the photo and the lettering of his name', () => {
    renderLid()

    const names = screen.getAllByRole('img').map((image) => image.getAttribute('aria-label'))
    expect(names).toEqual([content.profile.name, null])
    expect(screen.getAllByRole('img')[0]?.closest('h1')).not.toBeNull()
  })

  it('hides every other drawing from assistive technology', () => {
    const container = renderLid()
    const drawings = [...container.querySelectorAll('svg:not([role="img"])')]

    expect(drawings.length).toBeGreaterThan(specs.length / 2)
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(1)
    for (const drawing of drawings) {
      expect(drawing.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('hides the stickers that are only decoration, and no others', () => {
    const container = renderLid()
    const hidden = [...container.querySelectorAll('[data-sticker][aria-hidden="true"]')].map(
      (sticker) => sticker.getAttribute('data-sticker'),
    )

    expect(hidden).toEqual(specs.filter(isDecoration).map(({ id }) => id))
  })

  it('renders every link in reading order, each with a name to read out', () => {
    renderLid()

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(specs.flatMap(linksOf))
    for (const link of links) {
      expect(link).toHaveAccessibleName()
    }
  })

  it('names the count stickers and the project drawings in words', () => {
    renderLid()

    expect(screen.getByRole('link', { name: '8 hackathon wins' })).toHaveAttribute(
      'href',
      '/cv/#wins',
    )
    expect(
      screen.getByRole('link', { name: '16 hackathons organized in 8 countries plus online' }),
    ).toHaveAttribute('href', '/cv/#organized')
    expect(screen.getByRole('link', { name: /^Last Pay Wins: / })).toHaveAttribute(
      'href',
      'https://lastpaywins.com',
    )
  })

  it('project stickers link to their URLs', () => {
    renderLid()

    const projects = within(screen.getByRole('list', { name: 'Projects' }))
    const hrefs = projects.getAllByRole('link').map((link) => link.getAttribute('href'))
    const owned = content.projects.flatMap(({ links }) => links.map(({ url }) => url))

    expect(hrefs).toEqual([
      'https://lastpaywins.com',
      'https://arionparking.tech',
      'https://clawthing.store',
      'https://pleb.fm',
    ])
    for (const href of hrefs) {
      expect(owned).toContain(href)
    }
  })

  it('reaches the plain CV through the asset tag', () => {
    renderLid()

    expect(screen.getByRole('link', { name: /Plain CV/ })).toHaveAttribute('href', '/cv/')
  })

  it('points at no anchor the CV does not have', () => {
    const container = renderLid()
    const anchors = [...container.querySelectorAll('a[href*="#"]')].map(
      (link) => link.getAttribute('href')?.split('#')[1],
    )
    const sections: readonly string[] = SECTIONS.map(({ id }) => id)

    expect(anchors.length).toBeGreaterThan(0)
    for (const anchor of anchors) {
      expect(sections).toContain(anchor)
    }
    expect(container.querySelector('a[href^="#"]')).toBeNull()
  })

  it('opens no link in a new window', () => {
    const container = renderLid()

    expect(container.querySelector('a[target]')).toBeNull()
  })

  it('gives every SVG definition an id of its own', () => {
    const container = renderLid()
    const ids = [...container.querySelectorAll('svg [id]')].map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every reference between drawings', () => {
    const container = renderLid()
    const ids = new Set([...container.querySelectorAll('[id]')].map(({ id }) => id))
    const urls = [
      ...container.querySelectorAll('[fill^="url("], [stroke^="url("], [filter^="url("]'),
    ]
      .flatMap((node) => ['fill', 'stroke', 'filter'].map((name) => node.getAttribute(name)))
      .flatMap((value) => /^url\(#(.+)\)$/.exec(value ?? '')?.[1] ?? [])
    const hrefs = [...container.querySelectorAll('use, textPath')].map(
      (node) => node.getAttribute('href')?.slice(1) ?? '',
    )

    expect([...urls, ...hrefs].length).toBeGreaterThan(0)
    for (const reference of [...urls, ...hrefs]) {
      expect(ids, reference).toContain(reference)
    }
  })

  it('types no arrow or star: each is drawn', () => {
    expect(renderLid().textContent).not.toMatch(/[←-⇿✦★☆]/)
  })

  it('prints the numbers the content module derives', () => {
    const container = renderLid()

    expect(container).toHaveTextContent(`×${String(stats.organized.count)}`)
    expect(container).toHaveTextContent(`${String(stats.wins.total)}×`)
    expect(container).toHaveTextContent(`hackathon #${String(stats.organized.nextNumber)}`)
    expect(container).toHaveTextContent(`${String(stats.bitcoinPlusPlus.editions)} editions`)
    expect(container.querySelectorAll('[data-sticker="tally"] path')).toHaveLength(
      stats.organized.count,
    )
  })
})
