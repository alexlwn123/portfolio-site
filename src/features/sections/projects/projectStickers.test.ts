import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Content, Project } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { sectionAnchor } from '../sectionIds'
import { LEAD_PROJECT, projectStickers, type ProjectSticker } from './projectStickers'

const stickers = projectStickers(content)

function sticker(id: string, from: readonly ProjectSticker[] = stickers): ProjectSticker {
  const found = from.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No sticker for the project "${id}"`)
  }
  return found
}

function withProjects(projects: readonly Project[]): Content {
  return { ...content, projects }
}

const undrawn: Project = {
  id: 'a-new-thing',
  name: 'A New Thing',
  description: 'Built last night.',
  winId: null,
  note: null,
  unverifiedClaim: null,
  confirmed: true,
  links: [{ label: 'Code', url: 'https://example.com/a-new-thing' }],
}

describe('projectStickers', () => {
  it('cuts one sticker for every publishable project, and none for the rest', () => {
    const publishable = publishableProjects(content.projects)

    expect(stickers).toHaveLength(publishable.length)
    expect(new Set(stickers.map(({ id }) => id))).toEqual(new Set(publishable.map(({ id }) => id)))
    expect(stickers.map(({ id }) => id)).not.toContain('agent-camp-hack-and-tell')
  })

  it('leads with his employer’s platform, then follows the order of his profile', () => {
    const rest = publishableProjects(content.projects).filter(({ id }) => id !== LEAD_PROJECT)

    expect(stickers[0]?.id).toBe(LEAD_PROJECT)
    expect(stickers[0]?.name).toBe('Finite Computer')
    expect(stickers.slice(1).map(({ id }) => id)).toEqual(rest.map(({ id }) => id))
  })

  it('keeps the order of the records when the lead is not among them', () => {
    const others = content.projects.filter(({ id }) => id !== LEAD_PROJECT)

    expect(projectStickers(withProjects(others)).map(({ id }) => id)).toEqual(
      publishableProjects(others).map(({ id }) => id),
    )
  })

  it('gives every project a shape of its own', () => {
    const kinds = stickers.map(({ face }) => face.kind)

    expect(new Set(kinds).size).toBe(kinds.length)
    expect(kinds).not.toContain('bumper')
  })

  it('carries the name, his description and every link of the record', () => {
    for (const project of publishableProjects(content.projects)) {
      const cut = sticker(project.id)

      expect(cut.name).toBe(project.name)
      expect(cut.links).toEqual(project.links)
      expect(cut.description).not.toBeNull()
    }
    expect(sticker('btc-plinko').description).toBe('Plinko with sats.')
  })

  it('takes a winner’s description from its win', () => {
    expect(sticker('lightning-welder').description).toBe(
      'Helps legacy Lightning wallets pay BOLT12 offers.',
    )
  })

  it('opens at the project’s own site when it has one, and at its first link otherwise', () => {
    expect(sticker('pleb-fm').home).toBe('https://pleb.fm')
    expect(sticker('auntie-ln').home).toBe('https://bolt.fun/project/auntie-ln')
    expect(sticker('kattis').home).toBe('https://github.com/alexlwn123/kattis')
  })

  it('flags each winner with its result and event, leading to the wins', () => {
    const flagged = stickers.filter(({ flag }) => flag !== null).map(({ id }) => id)

    expect(flagged).toEqual(
      publishableProjects(content.projects)
        .filter(({ winId }) => winId !== null)
        .map(({ id }) => id),
    )
    expect(sticker('pleb-fm').flag).toEqual({
      result: '1st',
      event: 'SatsxSW 2022',
      href: sectionAnchor('wins'),
    })
    expect(sticker('treepay-ux').flag?.result).toBe('2nd (tied)')
    expect(sticker('lightning-welder').flag).toMatchObject({
      result: '1st overall',
      event: 'bitcoin++ Berlin, ecash edition 2024',
    })
    expect(sticker('btc-plinko').flag).toBeNull()
  })

  it('leaves the flag and the description off when the win is not in the record', () => {
    const [welder] = projectStickers({ ...content, wins: [] }).filter(
      ({ id }) => id === 'lightning-welder',
    )

    expect(welder?.flag).toBeNull()
    expect(welder?.description).toBeNull()
    expect(welder?.caption).toBeNull()
    expect(welder?.face.kind).toBe('bumper')
  })

  it('marks only the project that is his employer’s', () => {
    expect(stickers.filter(({ employer }) => employer).map(({ id }) => id)).toEqual([
      'finite-computer',
    ])
  })

  it('writes a short description by hand and puts a long one on tape', () => {
    expect(sticker('btc-plinko').caption).toBe('hand')
    expect(sticker('stringer-safety').caption).toBe('tape')
    expect(sticker('finite-computer').caption).toBe('tape')
  })

  it('letters a drawn sticker with the project’s name, over two lines when it has the words', () => {
    expect(sticker('finite-computer').face).toEqual({
      kind: 'computer',
      lines: ['Finite', 'Computer'],
    })
    expect(sticker('web-to-svg-extension').face).toEqual({
      kind: 'puzzle',
      lines: ['Web to SVG', 'Extension'],
    })
    expect(sticker('kattis').face).toEqual({ kind: 'ticket', lines: ['kattis'] })
  })

  it('reuses the lid’s stickers, filled in from the same records', () => {
    expect(sticker('clawthing-store').face).toEqual({ kind: 'crab', caption: 'Clawthing Store' })
    expect(sticker('pleb-fm').face).toEqual({
      kind: 'jukebox',
      name: 'Pleb FM',
      lines: ['pleb.fm'],
    })
    expect(sticker('arion-parking').face).toEqual({
      kind: 'parking',
      letter: 'P',
      name: 'Arion Parking',
    })
    expect(sticker('last-pay-wins').face).toEqual({
      kind: 'button',
      top: 'Last Pay Wins',
      bottom: '2.5M+ SATS IN WEEK ONE',
    })
    expect(sticker('lightning-welder').face).toEqual({
      kind: 'hex',
      kicker: '1st overall',
      title: ['Lightning', 'Welder'],
      foot: 'BTC++ Berlin ’24',
    })
  })

  it('names a sticker that is a drawing, since a drawing cannot name itself', () => {
    expect(sticker('btc-plinko').label).toBe('BTC Plinko')
    expect(sticker('clawthing-store').label).toBe('Clawthing Store')
    expect(sticker('lightning-welder').label).toBe('Lightning Welder')
    expect(sticker('last-pay-wins').label).toBe(
      'Last Pay Wins: Collected and paid out more than 2.5 million sats in its first week.',
    )
  })

  it('lets a sticker that is printed in words name itself', () => {
    expect(sticker('pleb-fm').label).toBeNull()
    expect(sticker('arion-parking').label).toBeNull()
  })

  it('names the button’s home when its win records no first-week figure', () => {
    const wins = content.wins.map((win) => ({ ...win, firstWeekSats: null }))

    const button = sticker('last-pay-wins', projectStickers({ ...content, wins }))

    expect(button.face).toMatchObject({ bottom: 'lastpaywins.com' })
    expect(button.label).toBe('Last Pay Wins')
  })

  it('cuts a plain bumper for a project nobody has drawn yet', () => {
    const cut = sticker(
      'a-new-thing',
      projectStickers(withProjects([...content.projects, undrawn])),
    )

    expect(cut.face).toEqual({ kind: 'bumper', lines: ['A New', 'Thing'] })
    expect(cut.label).toBeNull()
    expect(cut.caption).toBe('hand')
    expect(cut.flag).toBeNull()
  })

  it('never prints the unverified claim', () => {
    expect(JSON.stringify(stickers)).not.toMatch(/world record/i)
  })
})
