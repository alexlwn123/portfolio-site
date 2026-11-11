import { describe, expect, it } from 'vitest'

import { MEDAL, MEDAL_RIM_PATH, medalRim, medalStarTransform } from './medal'

const CIRCUMFERENCE = 2 * Math.PI * MEDAL.rim
const TOP = 'NCR GLOBAL HACKATHON 2021'
const BOTTOM = 'TEAM ETH HEADS'

describe('MEDAL_RIM_PATH', () => {
  it('starts at six o’clock and goes round twice, so a phrase can cross the start', () => {
    const bottom = MEDAL.centre + MEDAL.rim

    expect(MEDAL_RIM_PATH.startsWith(`M${String(MEDAL.centre)},${String(bottom)}`)).toBe(true)
    expect(MEDAL_RIM_PATH.match(/a/g)).toHaveLength(4)
  })
})

describe('medalRim', () => {
  const { arcs, starAngles } = medalRim(TOP, BOTTOM)
  const [top, bottom] = arcs

  it('centres the first phrase on twelve o’clock and the second on six', () => {
    expect(top.start + top.length / 2).toBeCloseTo(CIRCUMFERENCE / 2, 1)
    expect(bottom.start + bottom.length / 2).toBeCloseTo(CIRCUMFERENCE, 1)
  })

  it('shares the rim by the length of each phrase, leaving a gap for each star', () => {
    expect(top.length / bottom.length).toBeCloseTo(TOP.length / BOTTOM.length, 1)
    expect(top.length + bottom.length + 2 * MEDAL.starGap).toBeCloseTo(CIRCUMFERENCE, 0)
  })

  it('never lets the phrases meet: each star has its gap', () => {
    expect(bottom.start - (top.start + top.length)).toBeCloseTo(MEDAL.starGap, 1)
    expect(top.start).toBeGreaterThan(0)
  })

  it('puts a star in the middle of each gap, mirrored left and right', () => {
    const [right, left] = starAngles

    expect(right).toBeGreaterThan(0)
    expect(right).toBeLessThan(180)
    expect(right + left).toBeCloseTo(360, 1)
  })

  it('puts the stars at three and nine o’clock when the phrases are as long as each other', () => {
    expect(medalRim('ABCDE', 'VWXYZ').starAngles).toEqual([90, 270])
  })

  it('gives a rim with no lettering its two stars and no lengths to divide by', () => {
    const blank = medalRim('', '')

    expect(blank.arcs.map(({ length }) => length)).toEqual([0, 0])
    expect(blank.starAngles.every(Number.isFinite)).toBe(true)
  })
})

describe('medalStarTransform', () => {
  it('turns a star into place about the centre of the medal', () => {
    expect(medalStarTransform(90)).toBe(
      `rotate(90 ${String(MEDAL.centre)} ${String(MEDAL.centre)}) translate(${String(MEDAL.centre)} ${String(MEDAL.star)})`,
    )
  })
})
