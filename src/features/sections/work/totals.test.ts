import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { publishablePatents, publishableProjects } from '../../../content/derive'
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
      { kind: 'patents', count: stats.patents.filings, section: 'patents' },
    ])
  })

  it('counts only the projects he has confirmed', () => {
    const projects = pathTotals(content, stats).find((total) => total.kind === 'projects')

    expect(projects?.count).toBeLessThan(content.projects.length)
    expect(projects?.count).toBeGreaterThan(0)
  })

  it('counts every patent filing shown, whatever became of it', () => {
    const patents = pathTotals(content, stats).find((total) => total.kind === 'patents')

    expect(patents?.count).toBe(4)
    expect(patents?.count).toBe(publishablePatents(content.patents).length)
  })

  it('leaves out a total that is nothing yet', () => {
    const none = pathTotals({ projects: [] }, { ...stats, patents: { filings: 0 } })

    expect(none.map((total) => total.kind)).toEqual(['wins', 'organized', 'stage'])
  })
})
