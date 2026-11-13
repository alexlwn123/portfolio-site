import { describe, expect, it } from 'vitest'

import { code39, CODE39_NARROW, CODE39_WIDE, code39Pattern } from './code39'

const SYMBOLS = Array.from('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *')
const ELEMENTS = 9
const WIDE_ELEMENTS = 3
const BARS = 5

const wideCount = (pattern: string): number =>
  Array.from(pattern).filter((part) => part === 'w').length
/** The bars of a pattern: every other element, starting with the first. */
const barsOf = (pattern: string): string =>
  Array.from(pattern)
    .filter((_, at) => at % 2 === 0)
    .join('')

describe('code39Pattern', () => {
  it.each([
    ['*', 'nwnnwnwnn'],
    ['0', 'nnnwwnwnn'],
    ['1', 'wnnwnnnnw'],
    ['7', 'nnnwnnwnw'],
    ['A', 'wnnnnwnnw'],
    ['L', 'nnwnnnnww'],
    ['Z', 'nwwnwnnnn'],
    ['-', 'nwnnnnwnw'],
  ])('writes %s as the standard prints it: %s', (symbol, pattern) => {
    expect(code39Pattern(symbol)).toBe(pattern)
  })

  it('makes every symbol nine elements, three of them wide: two bars and one space', () => {
    for (const symbol of SYMBOLS) {
      const pattern = code39Pattern(symbol)

      expect(pattern, symbol).toHaveLength(ELEMENTS)
      expect(wideCount(pattern), symbol).toBe(WIDE_ELEMENTS)
      expect(wideCount(barsOf(pattern)), symbol).toBe(2)
    }
  })

  it('gives no two symbols the same pattern', () => {
    const patterns = SYMBOLS.map(code39Pattern)

    expect(new Set(patterns).size).toBe(SYMBOLS.length)
  })

  it('refuses what Code 39 cannot print', () => {
    expect(() => code39Pattern('a')).toThrow(RangeError)
    expect(() => code39Pattern('é')).toThrow(/Code 39/)
    expect(() => code39Pattern('')).toThrow(RangeError)
  })
})

describe('code39', () => {
  it('draws five bars a symbol, with the start and stop marks around the text', () => {
    const { bars } = code39('AL-0004')

    expect(bars).toHaveLength(('AL-0004'.length + 2) * BARS)
  })

  it('is as wide as its symbols and the narrow gaps between them', () => {
    const symbols = 'A1'.length + 2
    const symbolWidth = (ELEMENTS - WIDE_ELEMENTS) * CODE39_NARROW + WIDE_ELEMENTS * CODE39_WIDE

    expect(code39('A1').width).toBe(symbols * symbolWidth + (symbols - 1) * CODE39_NARROW)
  })

  it('opens and closes with the same mark', () => {
    const { bars, width } = code39('7')
    const first = bars.slice(0, BARS).map((bar) => bar.width)
    const last = bars.slice(-BARS).map((bar) => bar.width)

    expect(first).toEqual([CODE39_NARROW, CODE39_NARROW, CODE39_WIDE, CODE39_WIDE, CODE39_NARROW])
    expect(last).toEqual(first)
    expect(bars[0]?.x).toBe(0)
    expect((bars.at(-1)?.x ?? 0) + (bars.at(-1)?.width ?? 0)).toBe(width)
  })

  it('lays the bars out left to right without one touching the next', () => {
    const { bars } = code39('NCR-0001')

    bars.slice(1).forEach((bar, index) => {
      const before = bars[index]
      expect(bar.x).toBeGreaterThan((before?.x ?? 0) + (before?.width ?? 0))
    })
  })

  it('draws different text differently', () => {
    expect(code39('AL-0001').bars).not.toEqual(code39('AL-0002').bars)
  })

  it('refuses text it cannot encode, the start mark included', () => {
    expect(() => code39('al-0001')).toThrow(RangeError)
    expect(() => code39('A*B')).toThrow(RangeError)
  })
})
