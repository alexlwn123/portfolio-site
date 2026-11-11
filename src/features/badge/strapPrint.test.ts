import { describe, expect, it } from 'vitest'

import { labelWidth } from '../stickers/geometry/labelFace'
import { STRAP_LETTERING, STRAP_STAR } from '../stickers/geometry/lanyard'
import { printStrap } from './strapPrint'

const { size, tracking } = STRAP_LETTERING
const LENGTH = 600
const widthOf = (word: string): number => labelWidth(word, size, tracking)

describe('what is printed along a strap', () => {
  it('prints the words in turn, over and over, from the very start of the strap', () => {
    const { words } = printStrap(['HACK', 'ORGANIZE', 'REPEAT'], LENGTH)

    expect(words.slice(0, 4).map(({ text }) => text)).toEqual([
      'HACK',
      'ORGANIZE',
      'REPEAT',
      'HACK',
    ])
    expect(words[0]?.length).toBeCloseTo(widthOf('HACK'), 6)
    expect((words[0]?.centre ?? 0) * LENGTH).toBeCloseTo(widthOf('HACK') / 2, 6)
  })

  it('puts a star after every word, with the mockup’s room either side of it', () => {
    const { words, stars } = printStrap(['HACK', 'ORGANIZE'], LENGTH)
    const firstStar = (stars[0] ?? 0) * LENGTH
    const secondWordStart = (words[1]?.centre ?? 0) * LENGTH - (words[1]?.length ?? 0) / 2

    expect(stars).toHaveLength(words.length)
    expect(firstStar).toBeCloseTo(
      widthOf('HACK') + (STRAP_STAR.before + STRAP_STAR.size / 2) * size,
      6,
    )
    expect(secondWordStart - firstStar).toBeCloseTo(
      (STRAP_STAR.size / 2 + STRAP_STAR.after) * size,
      6,
    )
  })

  it('covers the whole strap and starts nothing beyond its end', () => {
    const { words, stars } = printStrap(['alex.lwn.lol', 'ATL'], LENGTH)
    const starts = words.map(({ centre, length }) => centre * LENGTH - length / 2)
    const pitch = widthOf('alex.lwn.lol') + widthOf('ATL') + 2 * (0.33 + 0.79 + 0.49) * size

    expect(Math.max(...starts)).toBeLessThan(LENGTH)
    expect(Math.max(...starts)).toBeGreaterThan(LENGTH - pitch)
    expect(starts).toEqual(starts.toSorted((one, other) => one - other))
    expect(stars).toEqual(stars.toSorted((one, other) => one - other))
    expect(words.length).toBeGreaterThanOrEqual(Math.floor((LENGTH / pitch) * 2))
  })

  it('gives places as shares of the strap, so that they hold when it stretches', () => {
    const short = printStrap(['ATL'], 300)
    const long = printStrap(['ATL'], 600)

    expect((short.words[1]?.centre ?? 0) * 300).toBeCloseTo((long.words[1]?.centre ?? 0) * 600, 6)
    expect(short.words[1]?.centre).toBeLessThan(1)
  })

  it('prints nothing on a strap with no words or no length', () => {
    expect(printStrap([], LENGTH)).toEqual({ words: [], stars: [] })
    expect(printStrap(['ATL'], 0)).toEqual({ words: [], stars: [] })
    expect(printStrap([''], LENGTH)).toEqual({ words: [], stars: [] })
  })
})
