import type {
  Content,
  Education,
  Experience,
  HeldEvent,
  PartialDate,
  Patent,
  Talk,
  Win,
} from '../../../content'
import { heldEvents, publishablePatents } from '../../../content/derive'
import { isoDate } from '../../../lib/formatDate'
import type { HomeSectionId } from '../sectionIds'

/*
 * The career as one path: a stop for the present and a stop for every year
 * back to the earliest on record. A job hangs from the year it began, because
 * no end date is recorded for any of them, and what else happened in a year
 * (wins, hackathons run, patents, the first talk) is worked out here from the
 * other records. Nothing on the path is typed in by hand.
 */

export type PathSource = Pick<
  Content,
  'experience' | 'education' | 'wins' | 'organized' | 'talks' | 'patents'
>

/** A patent filing with the date it needs to sit on the path. */
type Granted = Patent & { readonly status: Extract<Patent['status'], { kind: 'granted' }> }
type Filed = Patent & { readonly filed: NonNullable<Patent['filed']> }

/** Something else that happened in a year, from one of the other records. */
export type PathMark =
  | { readonly kind: 'wins'; readonly wins: readonly Win[] }
  | { readonly kind: 'organized'; readonly events: readonly HeldEvent[] }
  | { readonly kind: 'granted'; readonly patents: readonly Granted[] }
  | { readonly kind: 'filed'; readonly patents: readonly Filed[] }
  | { readonly kind: 'firstTalk'; readonly talk: Talk; readonly date: PartialDate }

export interface PathJob {
  readonly role: Experience
  /** Its place in the order he joined: the first job is 1. */
  readonly assetNumber: number
}

/** One graduation of the rule: the present, or a year. */
export interface PathStop {
  readonly key: string
  /** Null for the present. */
  readonly year: number | null
  readonly jobs: readonly PathJob[]
  readonly schools: readonly Education[]
  readonly marks: readonly PathMark[]
}

export const NOW_KEY = 'now'

const MARK_SECTIONS: Readonly<Record<PathMark['kind'], HomeSectionId>> = Object.freeze({
  wins: 'wins',
  organized: 'organized',
  granted: 'patents',
  filed: 'patents',
  firstTalk: 'talks',
})

/** The section of the page that tells the rest of what a mark stands for. */
export function markSection(kind: PathMark['kind']): HomeSectionId {
  return MARK_SECTIONS[kind]
}

const byDate = (one: PartialDate, other: PartialDate): number =>
  isoDate(one).localeCompare(isoDate(other))

/**
 * The first time he took a stage, as far as the record goes: the earliest
 * dated talk that was not a podcast. Null when there is none.
 */
export function firstStageTalk(
  talks: readonly Talk[],
): { readonly talk: Talk; readonly date: PartialDate } | null {
  const staged = talks
    .flatMap((talk) =>
      talk.when?.kind === 'date' && talk.format !== 'podcast'
        ? [{ talk, date: talk.when.date }]
        : [],
    )
    .toSorted((one, other) => byDate(one.date, other.date))
  return staged[0] ?? null
}

function isGranted(patent: Patent): patent is Granted {
  return patent.status.kind === 'granted'
}

function isFiled(patent: Patent): patent is Filed {
  return patent.filed !== null
}

/**
 * What else happened in a year, in one fixed order. A kind with nothing to
 * show is left out. The hackathons he ran come first: theirs is the longest
 * line, a list of cities, and the first sticker of a year is the one that is
 * given the most room.
 */
function marksOf(source: PathSource, year: number): readonly PathMark[] {
  const shown = publishablePatents(source.patents)
  const wins = source.wins.filter((win) => win.year === year)
  const events = heldEvents(source.organized)
    .filter((event) => event.date.start.year === year)
    .toSorted((one, other) => byDate(one.date.start, other.date.start))
  const granted = shown.filter(isGranted).filter(({ status }) => status.granted.year === year)
  const filed = shown
    .filter(isFiled)
    .filter((patent) => patent.filed.year === year)
    .toSorted((one, other) => byDate(one.filed, other.filed))
  const first = firstStageTalk(source.talks)

  return [
    ...(events.length > 0 ? [{ kind: 'organized', events } as const] : []),
    ...(wins.length > 0 ? [{ kind: 'wins', wins } as const] : []),
    ...(granted.length > 0 ? [{ kind: 'granted', patents: granted } as const] : []),
    ...(filed.length > 0 ? [{ kind: 'filed', patents: filed } as const] : []),
    ...(first?.date.year === year ? [{ kind: 'firstTalk', ...first } as const] : []),
  ]
}

/** When a job began, for putting jobs in order. The current one, undated, is the newest. */
function joinedAt(role: Experience): string {
  if (role.start !== null) {
    return isoDate(role.start)
  }
  if (!role.current) {
    throw new Error(
      `The job "${role.id}" has no start date and is not the current one, so the path has nowhere to pin it`,
    )
  }
  return NOW_KEY
}

/** Every job with its asset number, in the order he joined them: oldest first. */
function inJoiningOrder(experience: readonly Experience[]): readonly PathJob[] {
  const dated = experience.filter((role) => joinedAt(role) !== NOW_KEY)
  const undated = experience.filter((role) => joinedAt(role) === NOW_KEY)
  const oldestFirst = [
    ...dated.toSorted((one, other) => joinedAt(one).localeCompare(joinedAt(other))),
    // The record lists jobs newest first, so the last undated one listed came first.
    ...undated.toReversed(),
  ]
  return oldestFirst.map((role, index) => ({ role, assetNumber: index + 1 }))
}

/** The year a school hangs from. A school with no start has nowhere to go. */
function schoolYear(school: Education): number {
  if (school.start === null) {
    throw new Error(
      `The school "${school.id}" has no start date, so the path has nowhere to pin it`,
    )
  }
  return school.start.year
}

/** Every year anything on record is pinned to. */
function pinnedYears(source: PathSource, jobs: readonly PathJob[]): readonly number[] {
  const shown = publishablePatents(source.patents)
  const first = firstStageTalk(source.talks)
  return [
    ...jobs.flatMap(({ role }) => (role.current || role.start === null ? [] : [role.start.year])),
    ...source.education.map(schoolYear),
    ...source.wins.map((win) => win.year),
    ...heldEvents(source.organized).map((event) => event.date.start.year),
    ...shown.filter(isGranted).map(({ status }) => status.granted.year),
    ...shown.filter(isFiled).map((patent) => patent.filed.year),
    ...(first === null ? [] : [first.date.year]),
  ]
}

/** Every year from the newest down to the oldest, with none left out. */
function yearsBetween(years: readonly number[]): readonly number[] {
  if (years.length === 0) {
    return []
  }
  const newest = Math.max(...years)
  const oldest = Math.min(...years)
  return Array.from({ length: newest - oldest + 1 }, (_, index) => newest - index)
}

/**
 * The path, newest first: the present, holding the current job, then every
 * year down to the earliest on record. A year in which nothing is recorded
 * is still a stop, so the rule the path is drawn on keeps its scale.
 */
export function careerPath(source: PathSource): readonly PathStop[] {
  const newestFirst = inJoiningOrder(source.experience).toReversed()
  const current = newestFirst.filter(({ role }) => role.current)
  const past = newestFirst.filter(({ role }) => !role.current)
  const years = yearsBetween(pinnedYears(source, newestFirst))

  return [
    { key: NOW_KEY, year: null, jobs: current, schools: [], marks: [] },
    ...years.map((year) => ({
      key: String(year),
      year,
      jobs: past.filter(({ role }) => role.start?.year === year),
      schools: source.education.filter((school) => schoolYear(school) === year),
      marks: marksOf(source, year),
    })),
  ]
}
