import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { pathTotals } from './totals'

describe('pathTotals', () => {
  it('reads every figure from the derived numbers, one for each other section', () => {
    expect(pathTotals(content, stats)).toEqual([
      { kind: 'wins', count: stats.wins.total, section: 'wins' },
      { kind: 'organized', count: stats.organized.count, section: 'organized' },
      { kind: 'stage', count: stats.bitcoinPlusPlus.stageSessions, section: 'talks' },
      {
        kind: 'projects',
        count: publishableProjects(content.projects).length,
        section: 'projects',
      },
      { kind: 'patents', count: stats.patents.granted, section: 'patents' },
    ])
  })

  it('counts only the projects he has confirmed', () => {
    const projects = pathTotals(content, stats).find((total) => total.kind === 'projects')

    expect(projects?.count).toBeLessThan(content.projects.length)
    expect(projects?.count).toBeGreaterThan(0)
  })

  it('counts granted patents only: an application is never one', () => {
    const patents = pathTotals(content, stats).find((total) => total.kind === 'patents')

    expect(patents?.count).toBe(2)
    expect(patents?.count).toBeLessThan(stats.patents.filings)
  })

  it('leaves out a total that is nothing yet', () => {
    const none = pathTotals(
      { projects: [] },
      { ...stats, patents: { granted: 0, pending: 0, filings: 0, anyPending: false } },
    )

    expect(none.map((total) => total.kind)).toEqual(['wins', 'organized', 'stage'])
  })
})
