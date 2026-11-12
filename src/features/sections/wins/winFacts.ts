import type { Content, DateSpan, Link, Press, Stats, Win } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { pressClaim } from '../../../content/pressClaim'
import { ordinal } from '../../../lib/formatNumber'
import {
  eventLabel,
  fieldLabel,
  firstWeekNote,
  placeLabel,
  resultLabel,
  teammatesLine,
  winTitle,
} from '../../cv/describe'
import { LABELS } from '../../cv/labels'
import { fieldFigure, shortEventName } from '../../lid/facts'
import { winsCopy } from './copy'

/*
 * What the sheet prints for each win. Nothing here states a fact of its own:
 * every name, year, result and link is read from the win's record, from the
 * project it came from, or from the press record that names it. Where the
 * record is silent the sheet is too: a win whose project is not known has no
 * description to print.
 */

/** What a sticker is cut from follows from the result, and from nothing else. */
export type Finish = 'first' | 'second' | 'third' | 'prize'

export interface WinLink {
  readonly label: string
  readonly href: string
}

/** A piece of press about the win, worded by pressClaim and by nothing else. */
export interface WinPress extends WinLink {
  readonly claim: string
}

/** The few words lettered on the sticker itself. */
export interface StickerText {
  readonly name: string
  /** The event without its edition, short enough for a sticker. */
  readonly event: string
  readonly year: string
  /** "of 300+ teams", for a win chosen from a field. */
  readonly field: string | null
}

export interface WinFacts {
  readonly id: string
  /** The project, or the team when the project's name is not known. */
  readonly title: string
  readonly finish: Finish
  /** Big on the sticker: "1st", "2nd", or the word for a prize. */
  readonly rank: string
  /** The result in full: "1st overall", "Prize winner: Bitcoin Education Track". */
  readonly result: string
  readonly event: string
  readonly year: number
  readonly when: DateSpan | null
  readonly place: string | null
  /** "Out of 300+ teams". */
  readonly field: string | null
  readonly description: string | null
  /** Printed small under the description, one sentence to a line. */
  readonly lines: readonly string[]
  readonly links: readonly WinLink[]
  readonly press: readonly WinPress[]
  readonly sticker: StickerText
}

type Sources = Pick<Content, 'wins' | 'projects' | 'press' | 'organized'>

const FINISH_BY_PLACE = { 1: 'first', 2: 'second', 3: 'third' } as const

function finishOf({ result }: Win): Finish {
  return result.kind === 'prize' ? 'prize' : FINISH_BY_PLACE[result.place]
}

function rankOf({ result }: Win): string {
  return result.kind === 'prize' ? winsCopy.rank.prize : ordinal(result.place)
}

/** The small print: another name it went by, who was on the team, and the record's notes. */
function linesOf(win: Win): readonly string[] {
  const teammates = teammatesLine(win)

  return [
    ...(win.announcedAs === null ? [] : [`${LABELS.announcedAs} “${win.announcedAs}”.`]),
    ...(teammates === null ? [] : [teammates]),
    ...(win.firstWeekSats === null ? [] : [firstWeekNote(win.firstWeekSats)]),
    ...win.notes,
  ]
}

/** The project's links, then the win's own, each address once. */
function linksOf(win: Win, { projects }: Sources): readonly WinLink[] {
  const project = publishableProjects(projects).find(({ winId }) => winId === win.id)
  const recorded: readonly Link[] = [...(project?.links ?? []), ...win.links]

  return recorded
    .filter((link, index) => recorded.findIndex(({ url }) => url === link.url) === index)
    .map(({ label, url }) => ({ label, href: url }))
}

function pressItem(item: Press, sources: Sources): WinPress {
  return { label: item.outlet, href: item.url, ...pressClaim(item, sources) }
}

function pressOf(win: Win, sources: Sources): readonly WinPress[] {
  return sources.press
    .filter(({ subject }) => subject.kind === 'win' && subject.winId === win.id)
    .map((item) => pressItem(item, sources))
}

/** "bitcoin++ Berlin, ecash edition" is "bitcoin++ Berlin" on a sticker. */
function stickerEvent(event: string): string {
  const [name = event] = event.split(',')
  return shortEventName(name)
}

function stickerOf(win: Win): StickerText {
  return {
    name: winTitle(win),
    event: stickerEvent(win.event),
    year: String(win.year),
    field: win.field === null ? null : winsCopy.sticker.field(fieldFigure(win.field)),
  }
}

/** The facts of every win, in the record's order: newest first. */
export function winFacts(sources: Sources): readonly WinFacts[] {
  return sources.wins.map((win) => ({
    id: win.id,
    title: winTitle(win),
    finish: finishOf(win),
    rank: rankOf(win),
    result: resultLabel(win.result),
    event: eventLabel(win),
    year: win.year,
    when: win.eventDate,
    place: win.eventPlace === null ? null : placeLabel(win.eventPlace),
    field: win.field === null ? null : fieldLabel(win.field),
    description: win.description,
    lines: linesOf(win),
    links: linksOf(win, sources),
    press: pressOf(win, sources),
    sticker: stickerOf(win),
  }))
}

export interface TallyEntry {
  readonly finish: Finish
  readonly count: number
  readonly label: string
}

/** How many of each result there are, in podium order, leaving out what there is none of. */
export function winsTally(wins: Stats['wins']): readonly TallyEntry[] {
  const entries: readonly TallyEntry[] = [
    { finish: 'first', count: wins.firsts, label: winsCopy.tally.first(wins.firsts) },
    { finish: 'second', count: wins.seconds, label: winsCopy.tally.second(wins.seconds) },
    { finish: 'third', count: wins.thirds, label: winsCopy.tally.third(wins.thirds) },
    { finish: 'prize', count: wins.prizes, label: winsCopy.tally.prize(wins.prizes) },
  ]
  return entries.filter(({ count }) => count > 0)
}

/** The years the wins run from and to. Null when there are none. */
export function winsSpan(
  wins: readonly Win[],
): { readonly from: number; readonly to: number } | null {
  const years = wins.map(({ year }) => year)
  return years.length === 0 ? null : { from: Math.min(...years), to: Math.max(...years) }
}
