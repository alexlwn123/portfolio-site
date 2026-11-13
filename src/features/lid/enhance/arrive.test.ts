import { describe, expect, it } from 'vitest'

import { type Pace, takeTurns } from './arrive'

const PACE: Pace = { gapMs: 60, longestWaitMs: 480, rowPx: 48 }

function at(name: string, left: number, top: number) {
  return { item: name, left, top }
}

describe('takeTurns', () => {
  it('gives nothing a turn when nothing has come into view', () => {
    expect(takeTurns([], 1000, 0, PACE)).toEqual({ turns: [], freeAtMs: 0 })
  })

  it('lands the first at once and each neighbour a gap later, never two on one frame', () => {
    const { turns } = takeTurns([at('a', 0, 0), at('b', 200, 0), at('c', 400, 0)], 1000, 0, PACE)

    expect(turns.map(({ delayMs }) => delayMs)).toEqual([0, 60, 120])
    expect(new Set(turns.map(({ delayMs }) => delayMs)).size).toBe(turns.length)
  })

  it('goes in the order the eye reads them: a row at a time, left to right along it', () => {
    const batch = [at('low', 10, 300), at('right', 500, 12), at('left', 20, 30), at('mid', 240, 0)]

    expect(takeTurns(batch, 0, 0, PACE).turns.map(({ item }) => item)).toEqual([
      'left',
      'mid',
      'right',
      'low',
    ])
  })

  it('waits for whatever is still landing from the batch before', () => {
    const first = takeTurns([at('a', 0, 0), at('b', 100, 0)], 1000, 0, PACE)
    const second = takeTurns([at('c', 0, 200)], 1030, first.freeAtMs, PACE)

    expect(first.freeAtMs).toBe(1120)
    expect(second.turns).toEqual([{ item: 'c', delayMs: 90 }])
    expect(second.freeAtMs).toBe(1180)
  })

  it('starts again at once when the last batch landed long ago', () => {
    const { turns, freeAtMs } = takeTurns([at('a', 0, 0)], 9000, 1120, PACE)

    expect(turns).toEqual([{ item: 'a', delayMs: 0 }])
    expect(freeAtMs).toBe(9060)
  })

  it('never keeps a sticker waiting longer than the longest wait, however many arrive at once', () => {
    const many = Array.from({ length: 40 }, (_, index) => at(`s${String(index)}`, index * 10, 0))
    const { turns, freeAtMs } = takeTurns(many, 0, 0, PACE)

    expect(Math.max(...turns.map(({ delayMs }) => delayMs))).toBe(480)
    expect(turns.at(0)?.delayMs).toBe(0)
    // A crowd is squeezed into the longest wait, still in order and still apart.
    const delays = turns.map(({ delayMs }) => delayMs)
    expect(delays).toEqual(delays.toSorted((one, other) => one - other))
    expect(new Set(delays).size).toBe(delays.length)
    expect(freeAtMs).toBe(540)
  })

  it('does not change the batch it is given', () => {
    const batch = Object.freeze([at('b', 300, 0), at('a', 0, 0)])

    takeTurns(batch, 0, 0, PACE)

    expect(batch.map(({ item }) => item)).toEqual(['b', 'a'])
  })
})
