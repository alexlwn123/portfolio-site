import { describe, expect, it } from 'vitest'

import { CAP_HEIGHT, displayWidth, setLines } from './fitLines'

const block = { x: 100, y: 80, width: 140, max: 34 }

describe('displayWidth', () => {
  it('adds up the display face’s glyphs, in ems', () => {
    expect(displayWidth('I')).toBeCloseTo(0.411)
    expect(displayWidth('CARGO')).toBeCloseTo(3.946)
  })

  it('measures as the face is set: shouted', () => {
    expect(displayWidth('kattis')).toBe(displayWidth('KATTIS'))
  })

  it('never underestimates the width the browser draws', () => {
    // Measured in Chromium with kerning: the sum of the advances is the wider.
    expect(displayWidth('Tapass.fun')).toBeGreaterThanOrEqual(6.897)
    expect(displayWidth('Chesscup Hack')).toBeGreaterThanOrEqual(9.47)
  })

  it('gives a glyph it has not measured the width of a wide letter', () => {
    expect(displayWidth('é')).toBe(displayWidth('M'))
    expect(displayWidth('')).toBe(0)
  })
})

describe('setLines', () => {
  it('sets a short line at the largest size, centred on the block', () => {
    const [line] = setLines(['Hack'], block)

    expect(line).toEqual({ text: 'Hack', size: 34, baseline: 92.6 })
    expect((line?.baseline ?? 0) - (CAP_HEIGHT * 34) / 2).toBeCloseTo(block.y, 1)
  })

  it('shrinks a long line until it is as wide as the block', () => {
    const [line] = setLines(['Leaderboard'], block)

    expect(line?.size).toBeLessThan(block.max)
    expect((line?.size ?? 0) * displayWidth('Leaderboard')).toBeCloseTo(block.width, 0)
  })

  it('sizes each line by itself and keeps the pair centred', () => {
    const [first, second] = setLines(['Cargo', 'Leaderboard'], block)
    const top = (first?.baseline ?? 0) - CAP_HEIGHT * (first?.size ?? 0)
    const bottom = second?.baseline ?? 0

    expect(first?.size).toBe(34)
    expect(second?.size).toBeCloseTo(17.1, 1)
    expect((top + bottom) / 2).toBeCloseTo(block.y, 0)
    expect(bottom - CAP_HEIGHT * (second?.size ?? 0)).toBeGreaterThan(first?.baseline ?? 0)
  })

  it('sets nothing when there is nothing to letter', () => {
    expect(setLines([], block)).toEqual([])
    expect(setLines([''], block)).toEqual([])
  })
})
