import { describe, expect, it } from 'vitest'

import { content } from './index'
import type { Win } from './schema'
import { winName } from './winName'

function win(id: string): Win {
  const found = content.wins.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No win with id "${id}"`)
  }
  return found
}

describe('winName', () => {
  it('names a win by its project', () => {
    expect(winName(win('pleb-fm'))).toBe('Pleb FM')
  })

  it('names a win by its team when the project’s name is not known', () => {
    expect(winName(win('ncr-global-hackathon-2021'))).toBe('Eth Heads')
  })

  it('falls back on the event for a record with neither, which the schema refuses anyway', () => {
    const bare: Win = { ...win('pleb-fm'), project: null, team: null }

    expect(winName(bare)).toBe('SatsxSW hackathon')
  })
})
