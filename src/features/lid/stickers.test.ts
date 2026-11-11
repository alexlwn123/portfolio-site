import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { deriveStats } from '../../content/derive'
import { flattenStickers, isControl, isDecoration, linksOf, type StickerSpec } from './stickerSpecs'
import { CONTROL_IDS, lidStickers, STICKER_IDS, type StickerId } from './stickers'

const items = lidStickers(content, stats)
const stickers = flattenStickers(items)

function sticker<Kind extends StickerSpec['kind']>(
  id: StickerId,
  kind: Kind,
): Extract<StickerSpec<StickerId>, { kind: Kind }> {
  const spec = stickers.find((candidate) => candidate.id === id)
  if (spec?.kind !== kind) {
    throw new Error(`Expected "${id}" to be a ${kind} sticker`)
  }
  return spec as Extract<StickerSpec<StickerId>, { kind: Kind }>
}

describe('lidStickers', () => {
  it('lists every sticker once, in reading order', () => {
    expect(stickers.map(({ id }) => id)).toEqual(STICKER_IDS)
  })

  it('reads name, badge and ribbons, then the intro, then content, then contact links', () => {
    const kinds = stickers.map(({ kind }) => kind)

    expect(kinds.slice(0, 4)).toEqual(['name', 'lanyard', 'badge', 'hello'])
    expect(kinds.slice(-5)).toEqual(['wristband', 'wristband', 'tilt', 'sound', 'tidy'])
    expect(kinds.indexOf('assetTag')).toBe(4)
  })

  it('adds the NCR medal after the other wins and the patent label as the last of the small print', () => {
    const ids = stickers.map(({ id }) => id)

    expect(ids.indexOf('ncr-win')).toBe(ids.indexOf('latest-win') + 1)
    expect(ids.indexOf('patents')).toBe(ids.indexOf('elsewhere') - 1)
    expect(STICKER_IDS).toHaveLength(35)
  })

  it('puts the three buttons last, after everything there is to read', () => {
    expect(STICKER_IDS.slice(-CONTROL_IDS.length)).toEqual(CONTROL_IDS)
    expect(stickers.filter(isControl).map(({ id }) => id)).toEqual(['tilt', 'sound', 'tidy'])
    expect(sticker('sound', 'sound')).toEqual({ id: 'sound', kind: 'sound', label: 'Sound' })
    expect(sticker('tidy', 'tidy').lines).toEqual(['Tidy', 'the lid'])
    expect(sticker('tilt', 'tilt').lines).toEqual(['Tilt', 'me'])
    expect(stickers.filter(isControl).flatMap(linksOf)).toEqual([])
  })

  it('is frozen, like the content it is built from', () => {
    expect(Object.isFrozen(items)).toBe(true)
    expect(Object.isFrozen(sticker('badge', 'badge').ribbons)).toBe(true)
  })

  it('prints his name and his real title', () => {
    expect(sticker('name', 'name')).toMatchObject({ name: 'Alex Lewin', lines: ['Alex', 'Lewin'] })
    expect(sticker('badge', 'badge')).toMatchObject({
      givenName: 'Alex',
      familyName: 'Lewin',
      title: content.profile.role.title,
      organization: 'Finite Computer · Atlanta, GA',
      photoAlt: 'Alex Lewin, smiling, in a cap',
    })
  })

  it('prints the site’s own host on the lanyard', () => {
    expect(sticker('lanyard', 'lanyard').left).toEqual(['alex.lwn.lol', 'ATL'])
  })

  it('introduces him in his own words', () => {
    const hello = sticker('hello', 'hello')

    expect(hello.text).toContain('software engineer from Atlanta, GA.')
    expect(hello.text).toContain(hello.highlight)
  })

  it('takes every count from the derived numbers', () => {
    const wins = sticker('wins-count', 'starburst')
    const organized = sticker('organized-count', 'roundBadge')
    const record = sticker('bitcoin-plus-plus', 'record')

    expect(wins.figure).toBe(`${String(stats.wins.total)}×`)
    expect(wins.label).toBe('9 hackathon wins')
    expect(organized.figure).toBe(String(stats.organized.count))
    expect(organized.ring).toEqual(['HACKATHONS ORGANIZED', '8 COUNTRIES + ONLINE'])
    expect(organized.label).toBe('16 hackathons organized in 8 countries plus online')
    expect(record.lines).toEqual(['bitcoin++', '13 editions', '51 stage sessions'])
    expect(sticker('tally', 'tally').count).toBe(stats.organized.count)
    expect(sticker('next-spot', 'ghost')).toEqual({
      id: 'next-spot',
      kind: 'ghost',
      note: `this spot saved for hackathon #${String(stats.organized.nextNumber)}`,
      detail: 'AI Hack for Freedom IV, upcoming',
    })
  })

  it('follows the numbers when the record changes', () => {
    const inPerson = content.organized.filter(
      (event) => event.status === 'held' && event.location?.kind === 'inPerson',
    )
    const fewer = {
      ...content,
      wins: content.wins.filter(({ id }) => id !== 'treepay-ux'),
      organized: inPerson,
    }
    const changed = flattenStickers(lidStickers(fewer, deriveStats(fewer)))
    const find = (id: StickerId) => changed.find((candidate) => candidate.id === id)

    expect(find('wins-count')).toMatchObject({ figure: '8×', label: '8 hackathon wins' })
    expect(find('organized-count')).toMatchObject({
      figure: '14',
      ring: ['HACKATHONS ORGANIZED', '8 COUNTRIES'],
      label: '14 hackathons organized in 8 countries',
    })
    expect(find('next-spot')).toMatchObject({
      note: 'this spot saved for hackathon #15',
      detail: null,
    })
    expect(find('tally')).toMatchObject({ count: 14 })
  })

  it('puts the same counts on the section ribbons', () => {
    expect(sticker('badge', 'badge').ribbons).toEqual([
      { label: 'ORGANIZER', count: '×16', href: '/cv/#organized', tone: 'tang' },
      { label: 'WINNER', count: '×9', href: '/cv/#wins', tone: 'hi' },
      { label: 'SPEAKER', count: null, href: '/cv/#talks', tone: 'mint' },
      { label: 'BUILDER', count: null, href: '/cv/#projects', tone: 'gum' },
      { label: 'INVENTOR', count: null, href: '/cv/#patents', tone: 'white' },
    ])
  })

  it('prints the granted patent numbers on the compliance label, lowest first', () => {
    expect(sticker('patents', 'complianceLabel')).toEqual({
      id: 'patents',
      kind: 'complianceLabel',
      heading: 'U.S. PAT. NOS.',
      numbers: ['12,354,083', '12,536,579'],
      pending: 'OTHER PATENTS PENDING',
      href: '/cv/#patents',
    })
  })

  it('says patents are pending only while a filing is', () => {
    const decided = {
      ...content,
      patents: content.patents.filter((patent) => patent.status.kind !== 'pending'),
    }
    const label = flattenStickers(lidStickers(decided, deriveStats(decided))).find(
      ({ id }) => id === 'patents',
    )

    expect(label).toMatchObject({ numbers: ['12,354,083', '12,536,579'], pending: null })
  })

  it('never prints an application’s number, or a patent he has chosen not to show', () => {
    const numbers = sticker('patents', 'complianceLabel').numbers.join(' ')
    const one = {
      ...content,
      patents: content.patents.map((patent) =>
        patent.id === 'us-12536579' ? { ...patent, shown: false } : patent,
      ),
    }
    const label = flattenStickers(lidStickers(one, deriveStats(one))).find(
      ({ id }) => id === 'patents',
    )

    expect(numbers).not.toMatch(/2023|2024|\//)
    expect(label).toMatchObject({ heading: 'U.S. PAT. NO.', numbers: ['12,354,083'] })
  })

  it('strikes a medal for the NCR win: first of 300+ teams, as team Eth Heads', () => {
    expect(sticker('ncr-win', 'medal')).toEqual({
      id: 'ncr-win',
      kind: 'medal',
      label: '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads',
      rank: '1st',
      lines: ['OF 300+', 'TEAMS'],
      rim: ['NCR Global Hackathon 2021', 'Team Eth Heads'],
      tone: 'hi',
      href: '/cv/#wins',
    })
  })

  it('takes the medal’s figures from the win record', () => {
    const bigger = {
      ...content,
      wins: content.wins.map((win) =>
        win.id === 'ncr-global-hackathon-2021'
          ? { ...win, field: { unit: 'teams' as const, count: 1200, atLeast: false } }
          : win,
      ),
    }
    const medal = flattenStickers(lidStickers(bigger, stats)).find(({ id }) => id === 'ncr-win')

    expect(medal).toMatchObject({
      lines: ['OF 1,200', 'TEAMS'],
      label: '1st of 1,200 teams, NCR Global Hackathon 2021, team Eth Heads',
    })
  })

  it('shows the newest podium win in foil', () => {
    expect(sticker('latest-win', 'foilWin')).toMatchObject({
      rank: '1st',
      title: 'Stringer Safety',
      lines: ['AI Hack for Freedom I', 'Austin, 2026'],
      href: '/cv/#wins',
    })
  })

  it('takes the city from the win’s own field, however its venue is written', () => {
    const [latest, ...older] = content.wins
    if (!latest) {
      throw new Error('Expected at least one win')
    }
    const eventPlace = { venue: 'The Annex, Old Town, ZZ', city: 'Lisbon', region: null }
    const moved = { ...content, wins: [{ ...latest, eventPlace }, ...older] }
    const foil = flattenStickers(lidStickers(moved, stats)).find(({ id }) => id === 'latest-win')

    expect(foil).toMatchObject({ lines: ['AI Hack for Freedom I', 'Lisbon, 2026'] })
  })

  it('prints the year alone when the record does not say which city', () => {
    const [latest, ...older] = content.wins
    if (!latest) {
      throw new Error('Expected at least one win')
    }
    const unplaced = { ...content, wins: [{ ...latest, eventPlace: null }, ...older] }
    const foil = flattenStickers(lidStickers(unplaced, stats)).find(({ id }) => id === 'latest-win')

    expect(foil).toMatchObject({ lines: ['AI Hack for Freedom I', '2026'] })
  })

  it('names the cities from the hackathons he ran there', () => {
    const cities = stickers.filter((spec) => spec.id.startsWith('city-'))

    expect(cities.map((spec) => (spec.kind === 'pill' ? spec.text : null))).toEqual([
      'Nairobi',
      'Taipei',
      'Riga',
      'Istanbul',
      'Florianópolis',
      'Berlin',
      'Toronto',
      'Austin',
    ])
    expect(items.find((item) => item.kind === 'group' && item.key === 'cities')).toMatchObject({
      label: 'Cities I have run hackathons in',
    })
  })

  it('prints a real workshop title on the bumper sticker', () => {
    const titles = content.talks.map(({ title }) => title)
    const bumper = sticker('workshop', 'bumper')

    expect(titles).toContain(bumper.lines.join(' '))
    expect(bumper.href).toBe('/cv/#talks')
  })

  it('project stickers link to their URLs', () => {
    const urlOf = (id: string): string | undefined =>
      content.projects.find((project) => project.id === id)?.links[0]?.url

    expect(sticker('last-pay-wins', 'arcadeButton').href).toBe(urlOf('last-pay-wins'))
    expect(sticker('arion-parking', 'parkingSign').href).toBe(urlOf('arion-parking'))
    expect(sticker('clawthing-store', 'crab').href).toBe(urlOf('clawthing-store'))
    expect(sticker('pleb-fm', 'jukebox').href).toBe(urlOf('pleb-fm'))
    expect(sticker('bitcoin-plus-plus', 'record').href).toBe(content.bitcoinPlusPlus.profileUrl)
  })

  it('prints the Last Pay Wins figure from the number in its record', () => {
    const quieter = {
      ...content,
      wins: content.wins.map((win) =>
        win.id === 'last-pay-wins'
          ? { ...win, firstWeekSats: { sats: 1_200_000, atLeast: false } }
          : win,
      ),
    }
    const button = flattenStickers(lidStickers(quieter, stats)).find(
      ({ id }) => id === 'last-pay-wins',
    )

    expect(button).toMatchObject({
      bottom: '1.2M SATS IN WEEK ONE',
      label: 'Last Pay Wins: Collected and paid out 1.2 million sats in its first week.',
    })
  })

  it('names each project as the record does', () => {
    expect(sticker('last-pay-wins', 'arcadeButton')).toMatchObject({
      top: 'Last Pay Wins',
      bottom: '2.5M+ SATS IN WEEK ONE',
      label: 'Last Pay Wins: Collected and paid out more than 2.5 million sats in its first week.',
    })
    expect(sticker('arion-parking', 'parkingSign').name).toBe('Arion Parking')
    expect(sticker('clawthing-store', 'crab')).toMatchObject({
      caption: 'clawthing.store',
      label: 'Clawthing Store: AI-designed crab merch and apparel. Marketed towards agents.',
    })
    expect(sticker('pleb-fm', 'jukebox')).toMatchObject({
      name: 'Pleb FM',
      lines: ['Lightning jukebox', '1st · SatsxSW 2022'],
    })
    expect(sticker('lightning-welder', 'hexBadge')).toMatchObject({
      kicker: '1st overall',
      title: ['Lightning', 'Welder'],
      foot: 'BTC++ Berlin ’24',
      href: '/cv/#wins',
    })
  })

  it('takes the contact links from the profile', () => {
    const urls = [
      ...linksOf(sticker('elsewhere', 'wristband')),
      ...linksOf(sticker('more-elsewhere', 'wristband')),
    ]
    const known = content.profile.links.map(({ url }) => url)

    expect(sticker('more-elsewhere', 'wristband').links.map(({ label }) => label)).toEqual([
      'Devpost',
      'Book 30 min',
    ])
    expect(urls).toHaveLength(5)
    for (const url of urls) {
      expect(known).toContain(url)
    }
  })

  it('links inside the site only to the CV and its sections', () => {
    const internal = stickers.flatMap(linksOf).filter((href) => href.startsWith('/'))

    expect(new Set(internal)).toEqual(
      new Set([
        '/cv/',
        '/cv/#organized',
        '/cv/#wins',
        '/cv/#talks',
        '/cv/#projects',
        '/cv/#patents',
      ]),
    )
  })

  it('never links the name', () => {
    expect(linksOf(sticker('name', 'name'))).toEqual([])
  })

  it('counts only drawings as decoration', () => {
    expect(stickers.filter(isDecoration).map(({ id }) => id)).toEqual([
      'lanyard',
      'bolt-top',
      'tally',
      'bolt-bottom',
    ])
  })
})
