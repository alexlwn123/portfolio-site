import { describe, expect, it } from 'vitest'

import { NAME_ADVANCE_UNKNOWN, NAME_ADVANCES, NAME_OPTICAL_SIZE, setLine } from './nameFace'

describe('the name’s lettering', () => {
  it('has every capital, each a sensible part of an em, measured at one optical size', () => {
    for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(NAME_ADVANCES[character], character).toBeGreaterThan(0.15)
      expect(NAME_ADVANCES[character], character).toBeLessThan(0.95)
    }
    expect(Object.isFrozen(NAME_ADVANCES)).toBe(true)
    expect(NAME_OPTICAL_SIZE).toBe(96)
  })
})

describe('setLine', () => {
  const line = setLine('Alex', 174, 27, 426)

  it('gives every letter a place of its own, in the case it was written in', () => {
    expect(line.map(({ letter }) => letter)).toEqual(['A', 'l', 'e', 'x'])
  })

  it('starts the first letter where the line starts and ends the last where it ends', () => {
    const last = line.at(-1)

    expect(line[0]?.x).toBe(27)
    expect((last?.x ?? 0) + (last?.advance ?? 0)).toBeCloseTo(27 + 426, 1)
  })

  it('spreads what is left of the measure evenly between the letters, and none after the last', () => {
    const gaps = line
      .slice(1)
      .map(({ x }, index) => x - ((line[index]?.x ?? 0) + (line[index]?.advance ?? 0)))

    expect(gaps).toHaveLength(3)
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0] ?? 0, 2)
    }
    expect(gaps[0]).toBeGreaterThan(0)
  })

  it('sets each letter as wide as the face draws it, shouted, at the size asked for', () => {
    expect(line[0]?.advance).toBeCloseTo(0.6084 * 174, 2)
    expect(setLine('LEWIN', 131, 27, 426)[2]?.advance).toBeCloseTo(0.8904 * 131, 2)
    expect(setLine('alex', 174, 27, 426).map(({ x }) => x)).toEqual(line.map(({ x }) => x))
  })

  it('sets the letters where Chromium set the two lines of the name, to within two units', () => {
    // Read off the page before the name was drawn letter by letter. The browser kerned E and X.
    const before = {
      Alex: [27, 149.394, 243.655, 354.798],
      Lewin: [27, 103.083, 189.73, 323.933, 367.32],
    }

    for (const [index, x] of before.Alex.entries()) {
      expect(Math.abs((line[index]?.x ?? 0) - x)).toBeLessThan(2)
    }
    for (const [index, x] of before.Lewin.entries()) {
      expect(setLine('Lewin', 131, 27, 426)[index]?.x).toBeCloseTo(x, 0)
    }
  })

  it('leaves a gap for a space and sets no letter there', () => {
    const two = setLine('Jo Li', 100, 0, 400)

    expect(two.map(({ letter }) => letter)).toEqual(['J', 'o', 'L', 'i'])
    expect((two[2]?.x ?? 0) - (two[1]?.x ?? 0)).toBeGreaterThan((two[1]?.x ?? 0) - (two[0]?.x ?? 0))
  })

  it('takes a character it does not know to be a middling capital', () => {
    const [first, second] = setLine('Ø!', 100, 0, 400)

    expect(first?.advance).toBeCloseTo(NAME_ADVANCE_UNKNOWN * 100, 3)
    expect(second?.advance).toBeCloseTo(NAME_ADVANCE_UNKNOWN * 100, 3)
  })

  it('sets a single letter in the middle of the measure, and nothing for an empty line', () => {
    const [only] = setLine('X', 100, 20, 400)

    expect((only?.x ?? 0) + (only?.advance ?? 0) / 2).toBeCloseTo(220, 3)
    expect(setLine('', 100, 20, 400)).toEqual([])
  })

  it('rounds to a thousandth of a unit, so the markup stays short', () => {
    for (const { x } of line) {
      expect(Number(x.toFixed(3))).toBe(x)
    }
  })
})
