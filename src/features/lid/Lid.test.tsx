import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { SECTIONS } from '../cv/labels'
import { SECTION_IDS } from '../sections/sectionIds'
import { Lid } from './Lid'
import { isNoted, lidNotes, NOTED_IDS } from './notes'
import { flattenStickers, isControl, isDecoration, linksOf } from './stickerSpecs'
import {
  CONTROL_IDS,
  COVER_IDS,
  EMPLOYER_IDS,
  lidStickers,
  PILE_IDS,
  STICKER_IDS,
} from './stickers'

const photo: BadgePhotoImage = {
  sources: [{ type: 'image/avif', srcSet: '/_astro/portrait.avif 424w' }],
  src: '/_astro/portrait.webp',
  width: 424,
  height: 1154,
  sizes: '30vw',
}

const specs = flattenStickers(lidStickers(content, stats))
const notes = lidNotes(content)

/** The links printed on the stickers themselves, without the ones in the notes under them. */
function onTheFace(links: readonly HTMLElement[]): readonly HTMLElement[] {
  return links.filter((link) => link.closest('[data-note]') === null)
}

/** Every address a sticker presents: its own, then those of the note under it. */
function everyLinkOf(spec: (typeof specs)[number]): readonly string[] {
  const under = isNoted(spec.id) ? notes[spec.id].links.map(({ href }) => href) : []
  return [...linksOf(spec), ...under]
}

function renderLid(): HTMLElement {
  return render(<Lid content={content} stats={stats} photo={photo} />).container
}

function stickerIds(container: HTMLElement): readonly (string | null)[] {
  return [...container.querySelectorAll('[data-sticker]')].map((sticker) =>
    sticker.getAttribute('data-sticker'),
  )
}

describe('Lid', () => {
  it('has exactly one h1, his name, and under it one h2: the pile’s title', () => {
    renderLid()

    const headings = screen.getAllByRole('heading')
    expect(headings.map(({ tagName }) => tagName)).toEqual(['H1', 'H2'])
    expect(headings[0]).toHaveAccessibleName(content.profile.name)
    expect(headings[0]?.textContent).toBe(content.profile.name)
    expect(headings[1]?.textContent).toBe('At a glance ')
    expect(headings[1]?.querySelector('br')).toBeNull()
  })

  it('is two blocks on one stage: the cover, and the pile under it', () => {
    const container = renderLid()
    const stage = container.querySelector('[data-lid] > [data-lid-stage]')
    const blocks = [...(stage?.children ?? [])].filter((block) => block.tagName !== 'svg')
    const idsIn = (selector: string): readonly (string | null)[] =>
      [...container.querySelectorAll(`${selector} [data-sticker]`)].map((sticker) =>
        sticker.getAttribute('data-sticker'),
      )

    expect(blocks.map((block) => block.hasAttribute('data-lid-cover'))).toEqual([true, false])
    expect(blocks[1]).toHaveAttribute('data-lid-pile')
    expect(idsIn('[data-lid-cover] > [data-lid-board]')).toEqual(COVER_IDS)
    expect(idsIn('[data-lid-pile]')).toEqual(PILE_IDS)
    expect(container.querySelectorAll('[data-lid]')).toHaveLength(1)
  })

  it('makes the pile a region of its own, named by its heading, where the cue leads', () => {
    renderLid()

    // jsdom's name computation drops the space that ends each line of the title.
    const pile = screen.getByRole('region', { name: /^At a\s*glance$/ })
    expect(pile.tagName).toBe('SECTION')
    expect(pile.id).toBe('pile')
    expect(pile).toHaveAttribute('data-lid-pile')
    expect(screen.getByRole('heading', { level: 2 }).id).toBe(pile.getAttribute('aria-labelledby'))
    expect(screen.getByRole('link', { name: 'scroll for the highlights' })).toHaveAttribute(
      'href',
      '/#pile',
    )
  })

  it('leads from the cover straight to the contact section, in a quieter line', () => {
    renderLid()

    const contact = screen.getByRole('link', { name: 'contact me' })
    expect(contact).toHaveAttribute('href', '/#contact')
    expect(contact).toHaveAttribute('data-sticker', 'contact')
    expect(contact.closest('[data-lid-cover]')).not.toBeNull()
    expect(contact).not.toHaveAttribute('target')
  })

  it('keeps the cover to the name, the badge, the hello tag and the two ways on', () => {
    const container = renderLid()
    const cover = container.querySelector<HTMLElement>('[data-lid-cover]')

    expect(cover?.querySelectorAll('button')).toHaveLength(0)
    expect(cover?.querySelector('[data-sticker="cv"]')).toBeNull()
    expect(cover?.querySelectorAll('ul[aria-label]')).toHaveLength(0)
    // Its only links are the six ribbons, the way to the contact section and the cue.
    expect(within(cover ?? container).getAllByRole('link')).toHaveLength(8)
  })

  it('does not make the name a link', () => {
    renderLid()

    const name = screen.getByRole('heading', { level: 1 })
    expect(name.closest('a')).toBeNull()
    expect(name.querySelector('a')).toBeNull()
  })

  it('leaves the main landmark to the page, which puts the sections under it', () => {
    const container = renderLid()

    expect(screen.queryByRole('main')).toBeNull()
    expect(container.querySelector('[data-lid] > [data-lid-stage]')).not.toBeNull()
  })

  it('is the surface itself: nothing wraps the lid, so nothing can frame it', () => {
    const container = renderLid()

    expect(container.firstElementChild).toHaveAttribute('data-lid')
    expect(container.children).toHaveLength(1)
    expect(container.querySelector('[data-lid-desk]')).toBeNull()
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

  it('groups the employers, the city pills and the project stickers as lists', () => {
    renderLid()

    const employers = screen.getByRole('list', { name: 'Where I have worked' })
    const cities = screen.getByRole('list', { name: 'Cities I have run hackathons in' })
    const projects = screen.getByRole('list', { name: 'Projects' })
    expect(within(employers).getAllByRole('listitem')).toHaveLength(content.experience.length)
    expect(within(cities).getAllByRole('listitem')).toHaveLength(8)
    expect(projects.querySelectorAll(':scope > li')).toHaveLength(4)
    expect(onTheFace(within(projects).getAllByRole('link'))).toHaveLength(4)
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

    // Not a share of the stickers: the employers' tags are drawn in CSS and the
    // lanyard's stars are markers of one drawing, so the count moves either way.
    expect(drawings.length).toBeGreaterThan(0)
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
    expect(links.map((link) => link.getAttribute('href'))).toEqual(specs.flatMap(everyLinkOf))
    expect(onTheFace(links).map((link) => link.getAttribute('href'))).toEqual(
      specs.flatMap(linksOf),
    )
    for (const link of links) {
      expect(link).toHaveAccessibleName()
    }
  })

  it('names the count stickers and the project drawings in words', () => {
    renderLid()

    expect(screen.getByRole('link', { name: '9 hackathon wins' })).toHaveAttribute('href', '/#wins')
    expect(
      screen.getByRole('link', { name: '16 hackathons organized in 8 countries plus online' }),
    ).toHaveAttribute('href', '/#organized')
    expect(screen.getByRole('link', { name: /^Last Pay Wins: / })).toHaveAttribute(
      'href',
      'https://lastpaywins.com',
    )
  })

  it('project stickers link to their URLs', () => {
    renderLid()

    const projects = within(screen.getByRole('list', { name: 'Projects' }))
    const hrefs = onTheFace(projects.getAllByRole('link')).map((link) => link.getAttribute('href'))
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

  it('reaches the patents two ways: the inventor ribbon and the compliance label', () => {
    renderLid()

    const toPatents = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/#patents')
    expect(toPatents.map((link) => link.textContent.trim())).toEqual([
      'INVENTOR',
      'U.S. PATENT FILINGS 12,536,579 · 12,354,083 2023/0032782 · 2024/0037539',
    ])
    expect(toPatents[1]).toHaveAttribute('data-sticker', 'patents')
  })

  it('names the NCR medal in words and sends it to the wins', () => {
    renderLid()

    const medal = screen.getByRole('link', {
      name: '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads',
    })
    expect(medal).toHaveAttribute('href', '/#wins')
    expect(medal.closest('[data-sticker]')).toHaveAttribute('data-sticker', 'ncr-win')
    expect(medal.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('prints all four filings by number, and never calls them four patents', () => {
    const text = renderLid().textContent

    for (const { number } of content.patents) {
      expect(text).toContain(number.serial)
    }
    expect(text).toContain('PATENT FILINGS')
    expect(text).not.toMatch(/four patents|4 patents/i)
  })

  it('says nothing of what became of a filing: nothing is granted, pending or abandoned', () => {
    expect(renderLid().textContent).not.toMatch(/granted|pending|abandoned/i)
  })

  it('reaches the plain CV through the asset tag', () => {
    renderLid()

    expect(screen.getByRole('link', { name: /Plain CV/ })).toHaveAttribute('href', '/cv/')
  })

  it('points at no anchor that this page or the CV does not have', () => {
    const container = renderLid()
    const hrefs = [...container.querySelectorAll('a[href*="#"]')].map(
      (link) => link.getAttribute('href') ?? '',
    )
    const onThisPage: readonly string[] = ['pile', ...SECTION_IDS].map((id) => `/#${id}`)
    const onTheCv: readonly string[] = SECTIONS.map(({ id }) => `/cv/#${id}`)

    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect([...onThisPage, ...onTheCv]).toContain(href)
    }
    expect(container.querySelector('a[href^="#"]')).toBeNull()
  })

  it('sends every sticker’s own link to this page, and only a note’s "more" to the CV', () => {
    renderLid()

    const toTheCv = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/cv/#'))
    expect(toTheCv.length).toBe(NOTED_IDS.length)
    for (const link of toTheCv) {
      expect(link.closest('[data-note]')).not.toBeNull()
    }
  })

  it('sticks an asset tag down for every employer, each a link to the career section', () => {
    const container = renderLid()
    const employers = within(screen.getByRole('list', { name: 'Where I have worked' }))
    const tags = employers.getAllByRole('link')

    expect(tags.map((tag) => tag.getAttribute('href'))).toEqual(
      content.experience.map(() => '/#work'),
    )
    expect(tags.map((tag) => tag.getAttribute('data-sticker'))).toEqual(EMPLOYER_IDS)
    for (const [index, job] of content.experience.entries()) {
      expect(tags[index]).toHaveTextContent(job.organization)
      expect(tags[index]).toHaveAccessibleName(new RegExp(job.organization))
    }
    expect(employers.getByRole('link', { name: /Fedi/ })).toHaveTextContent('2024')
    expect(container.querySelector('[data-sticker="job-finite-computer"]')).not.toHaveTextContent(
      /\d{4}/,
    )
  })

  it('says hello in two short lines, with one phrase highlighted', () => {
    const container = renderLid()
    const hello = container.querySelector('[data-sticker="hello"]')

    expect(hello).toHaveTextContent(
      `HELLO I’m a software engineer from ${content.profile.location.city}, ` +
        `${content.profile.location.regionCode}. I build AI agents at ` +
        `${content.profile.role.organization}.`,
    )
    expect(hello?.querySelectorAll('mark')).toHaveLength(1)
  })

  it('opens every link that leaves the site in a new tab, and no other', () => {
    const container = renderLid()
    const links = [...container.querySelectorAll('a[href]')]
    const out = links.filter((link) => /^https?:/.test(link.getAttribute('href') ?? ''))
    const within = links.filter((link) => !out.includes(link))

    expect(out.length).toBeGreaterThan(0)
    expect(within.length).toBeGreaterThan(0)
    expect(out.filter((link) => link.getAttribute('target') !== '_blank')).toEqual([])
    expect(out.filter((link) => link.getAttribute('rel') !== 'noopener')).toEqual([])
    expect(within.filter((link) => link.hasAttribute('target'))).toEqual([])
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

  it('tucks a note under every project and win sticker, after the face and its peeling corner', () => {
    const container = renderLid()
    const noted = [...container.querySelectorAll('[data-peelable]')]

    expect(noted.map((sticker) => sticker.getAttribute('data-sticker'))).toEqual(
      STICKER_IDS.filter(isNoted),
    )
    expect(container.querySelectorAll('[data-note]')).toHaveLength(NOTED_IDS.length)
    for (const sticker of noted) {
      const id = sticker.getAttribute('data-sticker') ?? ''
      const [face, corner, ...inTheNote] = sticker.querySelectorAll('a, button')
      const note = sticker.querySelector('[data-note]')

      expect(isNoted(id)).toBe(true)
      expect(face?.tagName, id).toBe('A')
      expect(corner, id).toHaveAttribute('data-peel-tab')
      expect(corner, id).toHaveAttribute('aria-controls', note?.id)
      expect(note, id).toHaveTextContent(isNoted(id) ? notes[id].title : '')
      expect(
        inTheNote.every((link) => note?.contains(link)),
        id,
      ).toBe(true)
    }
  })

  it('writes each note from the record: what it is, the result and the year, and its links', () => {
    const container = renderLid()
    const note = container.querySelector<HTMLElement>('[data-sticker="pleb-fm"] [data-note]')
    const inTheNote = [...(note?.querySelectorAll('a') ?? [])]

    expect(note).toHaveTextContent(
      'Lightning-powered jukebox and radio station: a running auction for the next song.',
    )
    expect(note).toHaveTextContent('1st at SatsxSW hackathon, 2022.')
    expect(inTheNote.map((link) => link.getAttribute('href'))).toEqual(
      notes['pleb-fm'].links.map(({ href }) => href),
    )
    expect(screen.getByRole('link', { name: 'Code: Pleb FM' })).toHaveAttribute(
      'href',
      'https://github.com/PlebFM/PlebFM',
    )
  })

  it('keeps every button hidden until the page’s script shows it', () => {
    const container = renderLid()
    const buttons = [...container.querySelectorAll('button')]

    expect(buttons).toHaveLength(CONTROL_IDS.length + NOTED_IDS.length)
    expect(screen.queryAllByRole('button')).toEqual([])
    for (const button of buttons) {
      expect(button).toHaveAttribute('hidden')
      expect(button).toHaveAttribute('type', 'button')
    }
  })

  it('ends with the three buttons that work the lid: tilt, sound and tidy', () => {
    const container = renderLid()
    const controls = [...container.querySelectorAll('[data-control]')]

    expect(controls.map((control) => control.getAttribute('data-control'))).toEqual([
      'tilt',
      'sound',
      'tidy',
    ])
    expect(controls.map((control) => control.getAttribute('data-sticker'))).toEqual(CONTROL_IDS)
    expect(specs.filter(isControl).map(({ id }) => id)).toEqual(CONTROL_IDS)
    expect(container.querySelector('[data-control="sound"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(container.querySelector('[data-control="sound"]')).toHaveAttribute('aria-label', 'Sound')
    expect(container.querySelector('[data-control="tidy"]')).toHaveTextContent('Reset stickers')
    expect(container.querySelector('[data-control="tidy"]')).not.toHaveAttribute('aria-pressed')
    expect(container.querySelector('[data-control="tilt"]')).toHaveTextContent('Tilt me')
  })

  it('marks what can be picked up: every sticker, and nothing drawn on the lid itself', () => {
    const container = renderLid()
    const fixed = [...container.querySelectorAll('[data-sticker]:not([data-grab])')].map(
      (sticker) => sticker.getAttribute('data-sticker'),
    )

    expect(fixed).toEqual([
      'lanyard',
      'badge',
      'contact',
      'cue',
      'pile-kicker',
      'next-spot',
      'tally',
    ])
  })

  it('types no arrow or star: each is drawn', () => {
    expect(renderLid().textContent).not.toMatch(/[←-⇿✦★☆]/)
  })

  it('prints the numbers the content module derives', () => {
    const container = renderLid()

    expect(container).toHaveTextContent(`×${String(stats.organized.count)}`)
    expect(container).toHaveTextContent(`${String(stats.wins.total)}×`)
    expect(container).toHaveTextContent('9×')
    expect(container).toHaveTextContent('×9')
    expect(container).toHaveTextContent(`hackathon #${String(stats.organized.nextNumber)}`)
    expect(container).toHaveTextContent(`${String(stats.bitcoinPlusPlus.editions)} editions`)
    expect(container.querySelectorAll('[data-sticker="tally"] path')).toHaveLength(
      stats.organized.count,
    )
  })
})
