import type { Win } from './schema'

/**
 * What a win is called: its project, or the team that entered it when the
 * project's name is not known. The schema makes sure there is one of the two.
 */
export function winName(win: Win): string {
  return win.project ?? win.team?.name ?? win.event
}
