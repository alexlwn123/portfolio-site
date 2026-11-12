import { describe, expect, it } from 'vitest'

import { content, stats } from './index'
import { assertReferences } from './references'

describe('content', () => {
  it('is frozen all the way down', () => {
    expect(Object.isFrozen(content)).toBe(true)
    expect(Object.isFrozen(content.wins)).toBe(true)
    expect(Object.isFrozen(content.wins[0]?.result)).toBe(true)
    expect(Object.isFrozen(content.organized[1]?.location)).toBe(true)
    expect(Object.isFrozen(stats.organized.countries)).toBe(true)
  })

  it('exposes the derived numbers alongside the records', () => {
    expect(stats.wins.total).toBe(content.wins.length)
    expect(stats.organized.count).toBe(16)
    expect(stats.patents.filings).toBe(content.patents.filter((patent) => patent.shown).length)
  })
})

describe('assertReferences', () => {
  it('accepts the real content', () => {
    expect(() => {
      assertReferences(content)
    }).not.toThrow()
  })

  it('names a press item that points at a missing hackathon', () => {
    const [first, ...rest] = content.press
    if (!first) {
      throw new Error('Expected at least one press item')
    }
    const broken = {
      ...content,
      press: [
        {
          ...first,
          subject: {
            kind: 'organizedEvent' as const,
            organizedId: 'missing-event',
            namesEvent: false,
            namesOwner: false,
          },
        },
        ...rest,
      ],
    }

    expect(() => {
      assertReferences(broken)
    }).toThrow(/press\[0\]\.subject\.organizedId.*"missing-event"/)
  })

  it('names a press item that points at a missing win', () => {
    const broken = {
      ...content,
      press: content.press.map((item) =>
        item.subject.kind === 'win'
          ? { ...item, subject: { ...item.subject, winId: 'missing-win' } }
          : item,
      ),
    }

    expect(() => {
      assertReferences(broken)
    }).toThrow(/press\[1\]\.subject\.winId.*"missing-win"/)
  })

  it('names a project that points at a missing win', () => {
    const broken = {
      ...content,
      projects: content.projects.map((project, index) =>
        index === 0 ? { ...project, winId: 'missing-win' } : project,
      ),
    }

    expect(() => {
      assertReferences(broken)
    }).toThrow(/projects\[0\]\.winId.*"missing-win"/)
  })

  it('names a win that points at a missing hackathon', () => {
    const broken = {
      ...content,
      wins: content.wins.map((win, index) =>
        index === 0 ? { ...win, alsoOrganizedId: 'missing-event' } : win,
      ),
    }

    expect(() => {
      assertReferences(broken)
    }).toThrow(/wins\[0\]\.alsoOrganizedId.*"missing-event"/)
  })
})
