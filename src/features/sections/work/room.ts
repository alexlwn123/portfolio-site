import type { PathStop } from './path'

/*
 * How much room a stop takes on the path. The rule is not to scale: a year
 * is as long as what happened in it. A year with nothing on record is a
 * break in the rule, and a job's tag may hang down past the years after it
 * in which no other job began, so that it costs no length of its own.
 */

/** A tag hangs past this many stops at most: the path's stylesheet has a class for each. */
export const MOST_PAST = 3

/** True for a year with nothing on record: no job, no school, nothing else. */
export function isQuiet({ year, jobs, schools, marks }: PathStop): boolean {
  return year !== null && jobs.length + schools.length + marks.length === 0
}

/**
 * How many of the stops after one its job tags may hang past: every stop
 * until the next that has a job of its own. A stop with no job hangs nothing.
 */
export function hangsPast(stops: readonly PathStop[], index: number): number {
  const stop = stops[index]
  if (stop === undefined || stop.jobs.length === 0) {
    return 0
  }
  const after = stops.slice(index + 1)
  const next = after.findIndex(({ jobs }) => jobs.length > 0)
  return Math.min(MOST_PAST, next < 0 ? after.length : next)
}
