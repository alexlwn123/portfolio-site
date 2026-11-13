import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { deriveStats } from '../../content/derive'
import { SECTION_IDS } from '../sections/sectionIds'
import { flattenStickers, isControl, isDecoration, linksOf, type StickerSpec } from './stickerSpecs'
import {
  CONTROL_IDS,
  COVER_IDS,
  coverStickers,
  EMPLOYER_IDS,
  lidStickers,
  PILE_IDS,
  pileStickers,
  STICKER_IDS,
  type StickerId,
} from './stickers'

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

  it('reads name, badge and ribbons, then the intro and the two ways on, then the pile under its heading', () => {
    const kinds = stickers.map(({ kind }) => kind)

    expect(kinds.slice(0, 6)).toEqual(['name', 'lanyard', 'badge', 'hello', 'cue', 'cue'])
    expect(kinds.slice(6, 9)).toEqual(['heading', 'scrawl', 'assetTag'])
    expect(kinds.slice(-5)).toEqual(['wristband', 'wristband', 'tilt', 'sound', 'tidy'])
  })

  it('is the cover and then the pile: nothing is on both, and nothing is on neither', () => {
    const idsOf = (list: typeof items): readonly string[] =>
      flattenStickers(list).map(({ id }) => id)

    expect(idsOf(coverStickers(content, stats))).toEqual(COVER_IDS)
    expect(idsOf(pileStickers(content, stats))).toEqual(PILE_IDS)
    expect(STICKER_IDS).toEqual([...COVER_IDS, ...PILE_IDS])
    expect(new Set(STICKER_IDS).size).toBe(STICKER_IDS.length)
  })

  it('puts nothing on the cover but the name, the badge on its lanyard, the hello tag and the two ways on', () => {
    expect(COVER_IDS).toEqual(['name', 'lanyard', 'badge', 'hello', 'contact', 'cue'])
    expect(Object.isFrozen(coverStickers(content, stats))).toBe(true)
    expect(Object.isFrozen(pileStickers(content, stats))).toBe(true)
  })

  it('heads the pile with a title over two lines and a line in his hand under it', () => {
    expect(sticker('pile-title', 'heading').lines).toEqual(['At a', 'glance'])
    expect(sticker('pile-kicker', 'scrawl').text).toMatch(/the full story\.$/)
    expect(PILE_IDS.slice(0, 2)).toEqual(['pile-title', 'pile-kicker'])
  })

  it('writes a cue to scroll that leads to the pile', () => {
    expect(sticker('cue', 'cue')).toEqual({
      id: 'cue',
      kind: 'cue',
      text: 'scroll for the highlights',
      href: '/#pile',
      quiet: false,
    })
  })

  it('writes a quieter line before it that leads straight to the contact section', () => {
    expect(sticker('contact', 'cue')).toEqual({
      id: 'contact',
      kind: 'cue',
      text: 'contact me',
      href: '/#contact',
      quiet: true,
    })
  })

  it('adds the NCR medal after the other wins and the patent label as the last of the small print', () => {
    const ids = stickers.map(({ id }) => id)

    expect(ids.indexOf('ncr-win')).toBe(ids.indexOf('latest-win') + 1)
    expect(ids.indexOf('patents')).toBe(ids.indexOf('elsewhere') - 1)
    expect(STICKER_IDS).toHaveLength(44)
  })

  it('puts the three buttons last, after everything there is to read', () => {
    expect(STICKER_IDS.slice(-CONTROL_IDS.length)).toEqual(CONTROL_IDS)
    expect(stickers.filter(isControl).map(({ id }) => id)).toEqual(['tilt', 'sound', 'tidy'])
    expect(sticker('sound', 'sound')).toEqual({ id: 'sound', kind: 'sound', label: 'Sound' })
    expect(sticker('tidy', 'tidy').lines).toEqual(['Reset', 'stickers'])
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

  it('says hello in two short lines: who he is and where, and what he does today', () => {
    const hello = sticker('hello', 'hello')

    expect(hello.lines).toEqual([
      'software engineer from Atlanta, GA.',
      'I build AI agents at Finite Computer.',
    ])
    expect(hello.lines.filter((line) => line.includes(hello.highlight))).toHaveLength(1)
    expect(hello.highlight).not.toMatch(/hackathon/i)
  })

  it('takes who he is from his own first line and the employer from the job he holds now', () => {
    const moved = {
      ...content,
      profile: {
        ...content.profile,
        selfDescription: ['An engineer from Decatur, GA.', ...content.profile.selfDescription],
      },
      experience: content.experience.map((job) =>
        job.id === 'finite-computer' ? { ...job, organization: 'Somewhere Else' } : job,
      ),
    }
    const hello = flattenStickers(lidStickers(moved, deriveStats(moved))).find(
      ({ id }) => id === 'hello',
    )

    expect(hello).toMatchObject({
      lines: ['engineer from Decatur, GA.', 'I build AI agents at Somewhere Else.'],
    })
  })

  it('sticks an asset tag on the lid for every employer, newest first', () => {
    const tags = EMPLOYER_IDS.map((id) => sticker(id, 'propertyTag'))

    expect(tags.map(({ organization }) => organization)).toEqual(
      content.experience.map(({ organization }) => organization),
    )
    expect(tags.map(({ organization }) => organization)).toEqual([
      'Finite Computer',
      'Fedi',
      'Zion',
      'BlockSpaces',
      'NCR Corporation',
    ])
    expect(tags.map(({ kicker }) => kicker)).toEqual(Array(5).fill('Property of'))
    expect(new Set(tags.map(({ href }) => href))).toEqual(new Set(['/#work']))
  })

  it('prints a start year on a tag only where the record has one, and marks the current job', () => {
    const lines = EMPLOYER_IDS.map((id) => sticker(id, 'propertyTag').issued)

    expect(lines).toEqual([
      'In service',
      'Issued 2024',
      'Issued 2023',
      'Issued 2022',
      'Issued 2020',
    ])
    expect(content.experience[0]).toMatchObject({ start: null, current: true })
  })

  it('follows the employment record when it changes', () => {
    const dated = {
      ...content,
      experience: content.experience.map((job) =>
        job.id === 'finite-computer'
          ? { ...job, start: { year: 2025, month: null, day: null } }
          : job.id === 'ncr'
            ? { ...job, start: null }
            : job,
      ),
    }
    const tag = (id: StickerId) =>
      flattenStickers(lidStickers(dated, stats)).find((candidate) => candidate.id === id)

    expect(tag('job-finite-computer')).toMatchObject({ issued: 'Issued 2025 · In service' })
    expect(tag('job-ncr')).toMatchObject({ issued: null })
  })

  it('groups the employers as one list, after the plain CV and before the counts', () => {
    const ids = stickers.map(({ id }) => id)
    const group = items.find((item) => item.kind === 'group' && item.key === 'employers')

    expect(group).toMatchObject({ label: 'Where I have worked' })
    expect(ids.slice(ids.indexOf('cv') + 1, ids.indexOf('wins-count'))).toEqual(EMPLOYER_IDS)
  })

  it('cuts the tags from silver and from white, so no two neighbours match', () => {
    const cuts = EMPLOYER_IDS.map((id) => sticker(id, 'propertyTag').cut)

    expect(new Set(cuts)).toEqual(new Set(['plate', 'label', 'strip']))
    for (const [index, cut] of cuts.entries()) {
      expect(cut, String(index)).not.toBe(cuts[index + 1])
    }
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

  it('hangs five ribbons, one of them for the hackathons with a pin for each count', () => {
    expect(sticker('badge', 'badge').ribbons).toEqual([
      { label: 'ENGINEER', href: '/#work', tone: 'ink' },
      {
        label: 'HACKATHONS',
        tone: 'hi',
        pins: [
          { label: 'WINNER', count: '×9', href: '/#wins', tone: 'ink' },
          { label: 'ORGANIZER', count: '×16', href: '/#organized', tone: 'tang' },
        ],
      },
      { label: 'BUILDER', href: '/#projects', tone: 'gum' },
      { label: 'SPEAKER', href: '/#talks', tone: 'mint' },
      { label: 'INVENTOR', href: '/#patents', tone: 'white' },
    ])
  })

  it('leads the ribbons and their pins to every section of this page but the contact one', () => {
    const led = linksOf(sticker('badge', 'badge')).map((href) => href.replace('/#', ''))

    expect(led.toSorted()).toEqual(SECTION_IDS.filter((id) => id !== 'contact').toSorted())
    // The two sections about hackathons share a ribbon, so they come together.
    expect(led).toEqual(['work', 'wins', 'organized', 'projects', 'talks', 'patents'])
  })

  it('prints every filing’s publication number on the compliance label, in the record’s order', () => {
    expect(sticker('patents', 'complianceLabel')).toEqual({
      id: 'patents',
      kind: 'complianceLabel',
      heading: 'U.S. PATENT FILINGS',
      numbers: ['12,536,579', '12,354,083', '2023/0032782', '2024/0037539'],
      href: '/#patents',
    })
  })

  it('prints as many numbers as the site counts filings, and not a word on what became of any', () => {
    const label = sticker('patents', 'complianceLabel')

    expect(label.numbers).toHaveLength(stats.patents.filings)
    expect(Object.keys(label)).not.toContain('pending')
    expect(JSON.stringify(label)).not.toMatch(/grant|pending|abandon|application/i)
  })

  it('leaves a filing off the label once he takes it off the site, and words a single one as one', () => {
    const only = {
      ...content,
      patents: content.patents.map((patent) =>
        patent.id === 'us-12354083' ? patent : { ...patent, shown: false },
      ),
    }
    const label = flattenStickers(lidStickers(only, deriveStats(only))).find(
      ({ id }) => id === 'patents',
    )

    expect(label).toMatchObject({ heading: 'U.S. PATENT FILING', numbers: ['12,354,083'] })
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
      href: '/#wins',
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
      href: '/#wins',
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
    expect(bumper.href).toBe('/#talks')
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
      href: '/#wins',
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

  it('links inside the site only to the plain CV and to sections of this page', () => {
    const internal = stickers.flatMap(linksOf).filter((href) => href.startsWith('/'))

    expect(new Set(internal)).toEqual(
      new Set([
        '/cv/',
        '/#pile',
        '/#work',
        '/#wins',
        '/#projects',
        '/#organized',
        '/#talks',
        '/#patents',
        '/#contact',
      ]),
    )
    expect(internal.filter((href) => href.startsWith('/cv/'))).toEqual(['/cv/'])
  })

  it('sends the count stickers to their sections of this page', () => {
    expect(sticker('wins-count', 'starburst').href).toBe('/#wins')
    expect(sticker('organized-count', 'roundBadge').href).toBe('/#organized')
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
