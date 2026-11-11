import type { Content, Stats } from '../../content'
import { copy } from '../../content/copy'
import { upcomingEvents } from '../../content/derive'
import { deepFreeze } from '../../lib/deepFreeze'
import { ordinal } from '../../lib/formatNumber'
import { PATHS } from '../../lib/paths'
import { resultLabel } from '../cv/describe'
import {
  balanceLines,
  cityFromPlace,
  cvSection,
  findById,
  firstWeekMillions,
  inPersonCity,
  introText,
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
  GroupSpec,
  LidItem,
  PillSpec,
  StickerSpec,
  TextLink,
  Tone,
  WristbandSpec,
} from './stickerSpecs'

/*
 * The lid's stickers in reading order. The DOM follows this order, so a
 * screen reader and the Tab key meet the name first, then the badge and its
 * ribbons, the introduction, the content and last the contact links. Where
 * each sticker lands is decided by placement/ alone.
 *
 * Which stickers exist is a design decision and is written here. What they
 * say is not: every name, count, city and address is read from the content.
 */

export const STICKER_IDS = [
  'name',
  'lanyard',
  'badge',
  'hello',
  'cv',
  'wins-count',
  'organized-count',
  'latest-win',
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
  'elsewhere',
  'more-elsewhere',
] as const

export type StickerId = (typeof STICKER_IDS)[number]

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
const ELSEWHERE: readonly ProfileLinkId[] = ['github', 'x', 'linkedin']
const MORE_ELSEWHERE: readonly ProfileLinkId[] = ['devpost', 'booking']

function badge({ profile }: Content, stats: Stats): BadgeSpec<StickerId> {
  const { role, location } = profile
  const { ribbons, badge: words, nav } = copy.lid

  return {
    id: 'badge',
    kind: 'badge',
    roles: words.roles,
    photoAlt: words.photoAlt(profile.name),
    givenName: profile.givenName,
    familyName: profile.familyName,
    title: role.title,
    titleNote: words.titleNote,
    organization: `${role.organization} · ${location.city}, ${location.regionCode}`,
    ribbonsLabel: nav.sections,
    ribbons: [
      {
        label: ribbons.organizer,
        count: ribbons.times(stats.organized.count),
        href: cvSection('organized'),
        tone: 'tang',
      },
      {
        label: ribbons.winner,
        count: ribbons.times(stats.wins.total),
        href: cvSection('wins'),
        tone: 'hi',
      },
      { label: ribbons.speaker, count: null, href: cvSection('talks'), tone: 'mint' },
      { label: ribbons.builder, count: null, href: cvSection('projects'), tone: 'gum' },
    ],
  }
}

function opening(content: Content, stats: Stats): readonly Spec[] {
  const { profile } = content
  const { hello, lanyard } = copy.lid

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
    { id: 'hello', kind: 'hello', ...hello, text: introText(profile) },
  ]
}

function counts({ wins }: Content, stats: Stats): readonly Spec[] {
  const { cvSticker, winsSeal, organizedSeal } = copy.lid
  const { count, countryCount, includesOnline } = stats.organized
  const latest = latestPodiumWin(wins)
  const city = cityFromPlace(latest.eventPlace)
  const year = String(latest.year)

  return [
    { id: 'cv', kind: 'assetTag', ...cvSticker, href: PATHS.cv },
    {
      id: 'wins-count',
      kind: 'starburst',
      label: winsSeal.summary(stats.wins.total),
      top: winsSeal.top,
      figure: winsSeal.times(stats.wins.total),
      bottom: winsSeal.bottom,
      href: cvSection('wins'),
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
      href: cvSection('organized'),
    },
    {
      id: 'latest-win',
      kind: 'foilWin',
      rank: ordinal(latest.result.place),
      title: latest.project,
      lines: [latest.event, city === null ? year : `${city}, ${year}`],
      href: cvSection('wins'),
    },
    { id: 'bolt-top', kind: 'bolt' },
  ]
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

  return [
    {
      id: 'last-pay-wins',
      kind: 'arcadeButton',
      label: `${button.name}: ${buttonWin.notes.join(' ')}`,
      top: button.name,
      bottom: copy.lid.button.firstWeek(firstWeekMillions(buttonWin)),
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
      title: welder.project.split(' '),
      foot: `${hexWin.series} ${inPersonCity(ownHackathon(welder, content.organized))} ${shortYear(welder.year)}`,
      href: cvSection('wins'),
    },
    { id: 'phrase', kind: 'pill', text: copy.lid.phrase, tone: 'mint', big: true },
    nextSpot(content, stats),
    { id: 'tally', kind: 'tally', count: stats.organized.count },
    { id: 'bolt-bottom', kind: 'bolt' },
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
    href: cvSection('talks'),
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

/** Every sticker on the lid, filled in from the content and its derived numbers. */
export function lidStickers(content: Content, stats: Stats): readonly Item[] {
  const { nav } = copy.lid
  const items: readonly Item[] = [
    ...opening(content, stats),
    ...counts(content, stats),
    cities(content),
    workshop(content),
    projects(content),
    ...records(content, stats),
    wristband('elsewhere', nav.elsewhere, 'gum', ELSEWHERE, content.profile),
    wristband('more-elsewhere', nav.moreElsewhere, 'hi', MORE_ELSEWHERE, content.profile),
  ]
  return deepFreeze(items) as readonly Item[]
}
