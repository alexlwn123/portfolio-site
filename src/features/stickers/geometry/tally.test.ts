import { describe, expect, it } from 'vitest'

import { TALLY_GROUP, tallyMarks } from './tally'

const isSlash = (stroke: string): boolean => stroke.includes('L')

describe('tallyMarks', () => {
  it('Tally draws N marks in fives', () => {
    const { strokes } = tallyMarks(16)

    expect(TALLY_GROUP).toBe(5)
    expect(strokes).toHaveLength(16)
    expect(strokes.map(isSlash).flatMap((slash, index) => (slash ? [index] : []))).toEqual([
      4, 9, 14,
    ])
  })

  it('draws the first group as the mockup does', () => {
    expect(tallyMarks(5).strokes).toEqual([
      'M8 6l-1 30',
      'M17 5l1 31',
      'M27 6l-1 30',
      'M36 5l1 31',
      'M2 30L43 10',
    ])
  })

  it('gives each group of five its own row', () => {
    expect(tallyMarks(16)).toMatchObject({ width: 50, height: 170 })
    expect(tallyMarks(5).height).toBeLessThan(tallyMarks(6).height)
  })

  it('draws the mockup’s three rows, then starts again with the first hand', () => {
    const { strokes } = tallyMarks(16)

    expect(strokes.slice(5, 10)).toEqual([
      'M8 52l1 30',
      'M18 51l-1 31',
      'M27 52l1 30',
      'M37 51l-1 31',
      'M2 77L44 55',
    ])
    expect(strokes.slice(10, 15)).toEqual([
      'M7 98l1 30',
      'M17 97l1 31',
      'M27 98l-1 30',
      'M36 97l1 31',
      'M1 122L43 102',
    ])
    expect(strokes[15]).toBe('M8 144l-1 30')
  })

  it.each([
    [0, 0],
    [1, 1],
    [4, 4],
    [7.9, 7],
    [-3, 0],
  ])('draws %d as %d marks', (count, marks) => {
    expect(tallyMarks(count).strokes).toHaveLength(marks)
    expect(tallyMarks(count).height).toBeGreaterThan(0)
  })
})
