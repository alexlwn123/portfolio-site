import type { Content, Stats } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import type { HomeSectionId } from '../sectionIds'

/** One figure of the running count, and the section that tells the rest. */
export interface PathTotal {
  readonly kind: 'wins' | 'organized' | 'stage' | 'projects' | 'patents'
  readonly count: number
  readonly section: HomeSectionId
}

/**
 * Where the career stands today, one figure for each of the other sections:
 * wins, hackathons organized, bitcoin++ stage sessions, projects he has
 * confirmed, and patents granted. A figure of nothing is left out.
 */
export function pathTotals(content: Pick<Content, 'projects'>, stats: Stats): readonly PathTotal[] {
  const totals: readonly PathTotal[] = [
    { kind: 'wins', count: stats.wins.total, section: 'wins' },
    { kind: 'organized', count: stats.organized.count, section: 'organized' },
    { kind: 'stage', count: stats.bitcoinPlusPlus.stageSessions, section: 'talks' },
    { kind: 'projects', count: publishableProjects(content.projects).length, section: 'projects' },
    { kind: 'patents', count: stats.patents.granted, section: 'patents' },
  ]
  return totals.filter(({ count }) => count > 0)
}
