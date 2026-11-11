import type { Organized, Profile, Project, SatsFigure, Win, WinResult } from '../../content'
import { winName } from '../../content/winName'
import { formatMillions } from '../../lib/formatNumber'
import { PATHS } from '../../lib/paths'
import { resultLabel } from '../cv/describe'
import type { SectionId } from '../cv/labels'

/*
 * Looks up what the lid prints. Nothing here states a fact of its own: each
 * function reads the records, and stops the build when the record it needs is
 * missing or no longer says what a sticker shows.
 */

export type PodiumWin = Win & { readonly result: Extract<WinResult, { kind: 'place' }> }

const SITE_LINK_LABEL = 'Site'
const YEAR_DIGITS = 2

export function findById<T extends { readonly id: string }>(
  records: readonly T[],
  id: string,
  what: string,
): T {
  const record = records.find((candidate) => candidate.id === id)
  if (!record) {
    throw new Error(`No ${what} has the id "${id}"`)
  }
  return record
}

/** The city a hackathon was held in. Online and unplaced events have none. */
export function inPersonCity(event: Organized): string {
  if (event.location?.kind !== 'inPerson') {
    throw new Error(`The hackathon "${event.id}" has no city to print`)
  }
  return event.location.city
}

/** The hackathon of his own that a win was won at. Only some wins have one. */
export function ownHackathon(win: Win, organized: readonly Organized[]): Organized {
  if (win.alsoOrganizedId === null) {
    throw new Error(`The win "${win.id}" was not at a hackathon he ran`)
  }
  return findById(organized, win.alsoOrganizedId, 'hackathon')
}

/** "Clawthing Store: AI-designed crab merch…", or the name alone when nothing more is said. */
export function projectSummary({ name, description }: Project): string {
  return description === null ? name : `${name}: ${description}`
}

/** A project's own address: its site when it has one, otherwise its first link. */
export function projectHome(project: Project): string {
  const [first] = project.links
  const link = project.links.find(({ label }) => label === SITE_LINK_LABEL) ?? first
  if (!link) {
    throw new Error(`The project "${project.id}" has no link`)
  }
  return link.url
}

function isPodium(win: Win): win is PodiumWin {
  return win.result.kind === 'place'
}

/** The newest win with a place. Among wins of one year, the first listed. */
export function latestPodiumWin(wins: readonly Win[]): PodiumWin {
  const [first, ...rest] = wins.filter(isPodium)
  if (!first) {
    throw new Error('No win has a podium place to print on the foil sticker')
  }
  return rest.reduce((latest, win) => (win.year > latest.year ? win : latest), first)
}

/**
 * His own introduction, ready to follow "I'm a": the first two lines of his
 * self-description, without the article the hello tag already supplies.
 */
export function introText({ selfDescription }: Pick<Profile, 'selfDescription'>): string {
  const [first, second] = selfDescription
  if (first === undefined || second === undefined) {
    throw new Error('The hello tag needs two lines of self-description')
  }
  return `${first.replace(/^an?\s+/i, '')} ${second}`
}

/** "SatsxSW hackathon" is "SatsxSW" on a sticker: every event here is one. */
export function shortEventName(event: string): string {
  return event.replace(/\s+hackathon$/i, '')
}

/** 2024 becomes "’24". */
export function shortYear(year: number): string {
  return `’${String(year).slice(-YEAR_DIGITS)}`
}

export function siteHost(url: string): string {
  return new URL(url).host
}

/** Splits a title where its two lines come out closest in length. */
export function balanceLines(text: string): readonly [string, string] {
  const words = text.split(' ')
  const splits = words.slice(1).map((_, index): readonly [string, string] => {
    const cut = index + 1
    return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')]
  })
  const longest = ([first, second]: readonly [string, string]): number =>
    Math.max(first.length, second.length)

  return splits.reduce<readonly [string, string]>(
    (best, split) => (longest(split) < longest(best) ? split : best),
    [text, ''],
  )
}

/** "2.5M+": sats in millions, with a plus when the record says "more than". */
export function compactSats({ sats, atLeast }: SatsFigure): string {
  return `${formatMillions(sats)}M${atLeast ? '+' : ''}`
}

/** What a project took in over its first week: the number in its win record, never its prose. */
export function firstWeekSats(win: Win): SatsFigure {
  if (win.firstWeekSats === null) {
    throw new Error(`The win "${win.id}" records no first-week sats`)
  }
  return win.firstWeekSats
}

/** The address of a section of the CV page. A dead anchor does not type-check. */
export function cvSection(id: SectionId): string {
  return `${PATHS.cv}#${id}`
}

/** "Lightning Welder: 1st overall, bitcoin++ Berlin, ecash edition, 2024". */
export function winSummary(win: Win): string {
  return `${winName(win)}: ${resultLabel(win.result)}, ${win.event}, ${String(win.year)}`
}
