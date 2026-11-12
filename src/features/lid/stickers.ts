import type { Content, Stats } from '../../content'
import { copy } from '../../content/copy'
import { upcomingEvents } from '../../content/derive'
import { winName } from '../../content/winName'
import { deepFreeze } from '../../lib/deepFreeze'
import { ordinal } from '../../lib/formatNumber'
import { PATHS } from '../../lib/paths'
import { firstWeekNote, resultLabel } from '../cv/describe'
import { sectionAnchor } from '../sections/sectionIds'
import { pileAnchor } from './anchor'
import { employers, introduction } from './career'
import {
  balanceLines,
  compactSats,
  fieldFigure,
  fieldWin,
  findById,
  firstWeekSats,
  grantedPatentNumbers,
  inPersonCity,
  latestPodiumWin,
  ownHackathon,
  projectHome,
  projectSummary,
  shortEventName,
  shortYear,
  siteHost,
  winSummary,
} from './facts'
import type {
  BadgeSpec,
  ComplianceLabelSpec,
  GroupSpec,
  LidItem,
  MedalSpec,
  PillSpec,
  RibbonSpec,
  StickerSpec,
  TextLink,
  Tone,
  WristbandSpec,
} from './stickerSpecs'

/*
 * The lid's stickers in reading order. The DOM follows this order, so a
 * screen reader and the Tab key meet the name first, then the badge and its
 * ribbons, the introduction and the way down; and then the pile under its
 * own heading: where he has worked, the counts, the content and last the
 * contact links. Where each sticker lands is decided by placement/ alone.
 *
 * Which stickers exist is a design decision and is written here. What they
 * say is not: every name, count, city and address is read from the content.
 */

/** The cover: the first screen, and nothing but. */
export const COVER_IDS = ['name', 'lanyard', 'badge', 'hello', 'cue'] as const

/** The pile: everything else that has been stuck on, one scroll down. */
export const PILE_IDS = [
  'pile-title',
  'pile-kicker',
  'cv',
  'job-finite-computer',
  'job-fedi',
  'job-zion',
  'job-blockspaces',
  'job-ncr',
  'wins-count',
  'organized-count',
  'latest-win',
  'ncr-win',
  'bolt-top',
  'city-nairobi',
  'city-taipei',
  'city-riga',
  'city-istanbul',
  'city-florianopolis',
  'city-berlin',
  'city-toronto',
  'city-austin',
  'workshop',
  'last-pay-wins',
  'arion-parking',
  'clawthing-store',
  'pleb-fm',
  'bitcoin-plus-plus',
  'lightning-welder',
  'phrase',
  'next-spot',
  'tally',
  'bolt-bottom',
  'patents',
  'elsewhere',
  'more-elsewhere',
  'tilt',
  'sound',
  'tidy',
] as const

export const STICKER_IDS = [...COVER_IDS, ...PILE_IDS] as const

export type CoverId = (typeof COVER_IDS)[number]
export type PileId = (typeof PILE_IDS)[number]
export type StickerId = (typeof STICKER_IDS)[number]

export { EMPLOYER_IDS } from './career'

/**
 * The stickers that are buttons. They stay hidden until the page's script
 * shows them, so they are stuck down after everything else.
 */
export const CONTROL_IDS = ['tilt', 'sound', 'tidy'] as const satisfies readonly StickerId[]

type Spec = StickerSpec<StickerId>
type Item = LidItem<StickerId>
type ProfileLinkId = Content['profile']['links'][number]['id']

/** A city pill: the hackathon that puts the city on the lid, and its colour. */
const CITY_PILLS: readonly (readonly [StickerId, string, Tone])[] = [
  ['city-nairobi', 'btcpp-nairobi-2026', 'gum'],
  ['city-taipei', 'btcpp-taipei-2025', 'hi'],
  ['city-riga', 'btcpp-riga-2025', 'white'],
  ['city-istanbul', 'btcpp-istanbul-2025', 'tang'],
  ['city-florianopolis', 'btcpp-florianopolis-2025', 'ink'],
  ['city-berlin', 'lightning-pp-berlin-2025', 'mint'],
  ['city-toronto', 'btcpp-toronto-2026', 'hi'],
  ['city-austin', 'btcpp-austin-2025', 'gum'],
]

const WORKSHOP_TALK = 'how-to-win-every-hackathon'
/** The win that was chosen from a field of teams, and so gets a medal. */
export const FIELD_WIN = 'ncr-global-hackathon-2021'
const ELSEWHERE: readonly ProfileLinkId[] = ['github', 'x', 'linkedin']
const MORE_ELSEWHERE: readonly ProfileLinkId[] = ['devpost', 'booking']

function badge({ profile }: Content, stats: Stats): BadgeSpec<StickerId> {
  const { role, location } = profile
  const { badge: words, nav } = copy.lid

  return {
    id: 'badge',
    kind: 'badge',
    roles: words.roles,
    photoAlt: words.photoAlt(profile.name),
    givenName: profile.givenName,
    familyName: profile.familyName,
    title: role.title,
    organization: `${role.organization} · ${location.city}, ${location.regionCode}`,
    ribbonsLabel: nav.sections,
    ribbons: sectionRibbons(stats),
  }
}

/** The badge's ribbons: what he is, one to a section, in the order the page has them. */
function sectionRibbons(stats: Stats): readonly RibbonSpec[] {
  const { ribbons } = copy.lid
  const won = ribbons.times(stats.wins.total)
  const ran = ribbons.times(stats.organized.count)

  return [
    { label: ribbons.engineer, count: null, href: sectionAnchor('work'), tone: 'ink' },
    { label: ribbons.winner, count: won, href: sectionAnchor('wins'), tone: 'hi' },
    { label: ribbons.builder, count: null, href: sectionAnchor('projects'), tone: 'gum' },
    { label: ribbons.organizer, count: ran, href: sectionAnchor('organized'), tone: 'tang' },
    { label: ribbons.speaker, count: null, href: sectionAnchor('talks'), tone: 'mint' },
    { label: ribbons.inventor, count: null, href: sectionAnchor('patents'), tone: 'white' },
  ]
}

/** The first screen: who he is, his badge, two lines of introduction and the way down. */
function cover(content: Content, stats: Stats): readonly Spec[] {
  const { profile } = content
  const { hello, lanyard, cue } = copy.lid

  return [
    {
      id: 'name',
      kind: 'name',
      name: profile.name,
      lines: [profile.givenName, profile.familyName],
    },
    {
      id: 'lanyard',
      kind: 'lanyard',
      left: [siteHost(profile.site), lanyard.city],
      right: lanyard.loop,
    },
    badge(content, stats),
    {
      id: 'hello',
      kind: 'hello',
      greeting: hello.greeting,
      lead: hello.lead,
      highlight: hello.highlight,
      lines: introduction(content),
    },
    { id: 'cue', kind: 'cue', text: cue.text, href: pileAnchor() },
  ]
}

/** What the pile opens with: its heading, a line under it, and the way to the plain CV. */
function pileOpening(): readonly Spec[] {
  const { pile, cvSticker } = copy.lid
  const [first = '', second = ''] = pile.title

  return [
    { id: 'pile-title', kind: 'heading', lines: [first, second] },
    { id: 'pile-kicker', kind: 'scrawl', text: pile.kicker },
    { id: 'cv', kind: 'assetTag', ...cvSticker, href: PATHS.cv },
  ]
}

function counts({ wins }: Content, stats: Stats): readonly Spec[] {
  const { winsSeal, organizedSeal } = copy.lid
  const { count, countryCount, includesOnline } = stats.organized
  const latest = latestPodiumWin(wins)
  const city = latest.eventPlace?.city ?? null
  const year = String(latest.year)

  return [
    {
      id: 'wins-count',
      kind: 'starburst',
      label: winsSeal.summary(stats.wins.total),
      top: winsSeal.top,
      figure: winsSeal.times(stats.wins.total),
      bottom: winsSeal.bottom,
      href: sectionAnchor('wins'),
    },
    {
      id: 'organized-count',
      kind: 'roundBadge',
      label: includesOnline
        ? organizedSeal.summary(count, countryCount)
        : organizedSeal.summaryInPerson(count, countryCount),
      ring: [
        organizedSeal.label,
        includesOnline
          ? organizedSeal.countries(countryCount)
          : organizedSeal.countriesInPerson(countryCount),
      ],
      figure: String(count),
      href: sectionAnchor('organized'),
    },
    {
      id: 'latest-win',
      kind: 'foilWin',
      rank: ordinal(latest.result.place),
      title: winName(latest),
      lines: [latest.event, city === null ? year : `${city}, ${year}`],
      href: sectionAnchor('wins'),
    },
    medal(wins),
    { id: 'bolt-top', kind: 'bolt' },
  ]
}

/** The medal for the win that was chosen from a field: its rank, the field and who took it. */
function medal(wins: Content['wins']): MedalSpec<StickerId> {
  const words = copy.lid.medal
  const win = fieldWin(findById(wins, FIELD_WIN, 'win'))
  const rank = ordinal(win.result.place)
  const field = fieldFigure(win.field)
  const event = `${win.event} ${String(win.year)}`

  return {
    id: 'ncr-win',
    kind: 'medal',
    label: words.summary(rank, field, event, win.team.name),
    rank,
    lines: [words.outOf(field), words.teams],
    rim: [event, words.team(win.team.name)],
    tone: 'hi',
    href: sectionAnchor('wins'),
  }
}

/** The label's closing line: how many applications are pending, or null when none is. */
function pendingLine({ anyPending, pending }: Stats['patents']): string | null {
  const words = copy.lid.patentLabel.pending
  if (!anyPending) {
    return null
  }
  return pending === 1 ? words.one : words.many
}

/** The compliance label: the granted patents by number, and whether more are pending. */
function patentLabel({ patents }: Content, stats: Stats): ComplianceLabelSpec<StickerId> {
  const words = copy.lid.patentLabel
  const numbers = grantedPatentNumbers(patents)

  return {
    id: 'patents',
    kind: 'complianceLabel',
    heading: numbers.length === 1 ? words.one : words.many,
    numbers,
    pending: pendingLine(stats.patents),
    href: sectionAnchor('patents'),
  }
}

function cities({ organized }: Content): GroupSpec<StickerId> {
  return {
    kind: 'group',
    key: 'cities',
    label: copy.lid.cities.label,
    stickers: CITY_PILLS.map(([id, eventId, tone]): PillSpec<StickerId> => ({
      id,
      kind: 'pill',
      text: inPersonCity(findById(organized, eventId, 'hackathon')),
      tone,
      big: false,
    })),
  }
}

/** The two project stickers that also say what the project won. */
function winners({ projects: records, wins }: Content): readonly [Spec, Spec] {
  const button = findById(records, 'last-pay-wins', 'project')
  const buttonWin = findById(wins, 'last-pay-wins', 'win')
  const jukebox = findById(records, 'pleb-fm', 'project')
  const jukeboxWin = findById(wins, 'pleb-fm', 'win')
  const result = `${resultLabel(jukeboxWin.result)} · ${shortEventName(jukeboxWin.event)}`
  const firstWeek = firstWeekSats(buttonWin)

  return [
    {
      id: 'last-pay-wins',
      kind: 'arcadeButton',
      label: `${button.name}: ${firstWeekNote(firstWeek)}`,
      top: button.name,
      bottom: copy.lid.button.firstWeek(compactSats(firstWeek)),
      href: projectHome(button),
    },
    {
      id: 'pleb-fm',
      kind: 'jukebox',
      name: jukebox.name,
      lines: [copy.lid.jukebox.tagline, `${result} ${String(jukeboxWin.year)}`],
      href: projectHome(jukebox),
    },
  ]
}

function projects(content: Content): GroupSpec<StickerId> {
  const parking = findById(content.projects, 'arion-parking', 'project')
  const crab = findById(content.projects, 'clawthing-store', 'project')
  const [button, jukebox] = winners(content)

  return {
    kind: 'group',
    key: 'projects',
    label: copy.lid.projects.label,
    stickers: [
      button,
      {
        id: 'arion-parking',
        kind: 'parkingSign',
        letter: copy.lid.parkingSign.letter,
        name: parking.name,
        href: projectHome(parking),
      },
      {
        id: 'clawthing-store',
        kind: 'crab',
        label: projectSummary(crab),
        caption: siteHost(projectHome(crab)),
        href: projectHome(crab),
      },
      jukebox,
    ],
  }
}

function records(content: Content, stats: Stats): readonly Spec[] {
  const { record, hexWin } = copy.lid
  const { editions, stageSessions } = stats.bitcoinPlusPlus
  const welder = findById(content.wins, 'lightning-welder', 'win')

  return [
    {
      id: 'bitcoin-plus-plus',
      kind: 'record',
      mark: record.mark,
      lines: [record.name, record.editions(editions), record.sessions(stageSessions)],
      href: content.bitcoinPlusPlus.profileUrl,
    },
    {
      id: 'lightning-welder',
      kind: 'hexBadge',
      label: winSummary(welder),
      kicker: resultLabel(welder.result),
      title: winName(welder).split(' '),
      foot: `${hexWin.series} ${inPersonCity(ownHackathon(welder, content.organized))} ${shortYear(welder.year)}`,
      href: sectionAnchor('wins'),
    },
    { id: 'phrase', kind: 'pill', text: copy.lid.phrase, tone: 'mint', big: true },
    nextSpot(content, stats),
    { id: 'tally', kind: 'tally', count: stats.organized.count },
    { id: 'bolt-bottom', kind: 'bolt' },
    patentLabel(content, stats),
  ]
}

function nextSpot({ organized }: Content, stats: Stats): Spec {
  const { ghost } = copy.lid
  const [upcoming] = upcomingEvents(organized)

  return {
    id: 'next-spot',
    kind: 'ghost',
    note: ghost.saved(stats.organized.nextNumber),
    detail: upcoming ? `${upcoming.name}, ${ghost.status}` : null,
  }
}

function workshop({ talks }: Content): Spec {
  const talk = findById(talks, WORKSHOP_TALK, 'talk')

  return {
    id: 'workshop',
    kind: 'bumper',
    lines: balanceLines(talk.title),
    note: copy.lid.bumper.note,
    href: sectionAnchor('talks'),
  }
}

function wristband(
  id: StickerId,
  label: string,
  tone: Tone,
  linkIds: readonly ProfileLinkId[],
  { links }: Content['profile'],
): WristbandSpec<StickerId> {
  return {
    id,
    kind: 'wristband',
    label,
    tone,
    links: linkIds.map((linkId): TextLink => {
      const link = findById(links, linkId, 'profile link')
      return { label: link.shortLabel ?? link.label, href: link.url }
    }),
  }
}

/** The buttons, last in the markup: they are the lid's furniture, not its content. */
function controls(): readonly Spec[] {
  const words = copy.lid.controls

  return [
    { id: 'tilt', kind: 'tilt', lines: words.tilt },
    { id: 'sound', kind: 'sound', label: words.sound },
    { id: 'tidy', kind: 'tidy', lines: words.tidy },
  ]
}

/** The cover's stickers, in reading order. */
export function coverStickers(content: Content, stats: Stats): readonly Item[] {
  return deepFreeze([...cover(content, stats)]) as readonly Item[]
}

/** The pile's stickers, in reading order: its heading first, the buttons last. */
export function pileStickers(content: Content, stats: Stats): readonly Item[] {
  const { nav } = copy.lid
  const items: readonly Item[] = [
    ...pileOpening(),
    employers(content),
    ...counts(content, stats),
    cities(content),
    workshop(content),
    projects(content),
    ...records(content, stats),
    wristband('elsewhere', nav.elsewhere, 'gum', ELSEWHERE, content.profile),
    wristband('more-elsewhere', nav.moreElsewhere, 'hi', MORE_ELSEWHERE, content.profile),
    ...controls(),
  ]
  return deepFreeze(items) as readonly Item[]
}

/** Every sticker on the lid, the cover's and then the pile's, filled in from the content. */
export function lidStickers(content: Content, stats: Stats): readonly Item[] {
  return deepFreeze([
    ...coverStickers(content, stats),
    ...pileStickers(content, stats),
  ]) as readonly Item[]
}
