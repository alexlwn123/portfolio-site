import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { MAT, matPlaces, placeData, standInRows, type Standing } from './matRows'
import { type FaceKind, LEAD_PROJECT, projectStickers } from './projectStickers'

const stickers = projectStickers(content)
const places = matPlaces(stickers)

const rowsOf = (standings: readonly Standing[]): readonly (readonly Standing[])[] =>
  [...new Set(standings.map(({ row }) => row))].map((row) =>
    standings.filter((standing) => standing.row === row),
  )
const spans = (standings: readonly Standing[]): readonly number[] =>
  standings.map(({ span }) => span)
const sum = (numbers: readonly number[]): number => numbers.reduce((total, each) => total + each, 0)

describe('standInRows', () => {
  it('fills every row to the last column, so each one reaches both edges of the mat', () => {
    const standings = standInRows([10, 5, 5, 5, 6, 5, 6, 5, 6, 5, 5, 5, 5, 5, 5, 6, 6, 5, 4], 24)

    for (const row of rowsOf(standings)) {
      expect(sum(spans(row))).toBe(24)
    }
  })

  it('keeps the stickers in the order they were given, row after row from the first', () => {
    const standings = standInRows([4, 4, 4, 4, 4, 4], 12)

    expect(standings.map(({ row }) => row)).toEqual([1, 1, 1, 2, 2, 2])
  })

  it('says where each stands in its row: first, last or between', () => {
    const standings = standInRows([4, 4, 4, 4, 4, 4], 12)

    expect(standings.map(({ place }) => place)).toEqual([
      'first',
      'middle',
      'last',
      'first',
      'middle',
      'last',
    ])
  })

  it('shares the stickers out evenly, and leaves no short row at the foot', () => {
    // Seven of four fill a row of twelve twice over and a third: two rows, not two and a stub.
    const standings = standInRows([4, 4, 4, 4, 4, 4, 4], 12)
    const rows = rowsOf(standings)

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.length).toSorted()).toEqual([3, 4])
  })

  it('fits a row to the width by keeping each sticker to its share of it', () => {
    expect(spans(standInRows([5, 3], 12))).toEqual([8, 4])
    expect(spans(standInRows([10, 5, 5, 5], 24))).toEqual([9, 5, 5, 5])
  })

  it('never fits a row by cutting a wide sticker narrower than a regular one beside it', () => {
    const fitted = spans(standInRows([6, 5, 6, 5, 6], 24))

    expect(sum(fitted)).toBe(24)
    expect(Math.min(fitted[0] ?? 0, fitted[2] ?? 0, fitted[4] ?? 0)).toBeGreaterThanOrEqual(
      Math.max(fitted[1] ?? 0, fitted[3] ?? 0),
    )
  })

  it('takes from the widest when a sticker would otherwise be too narrow to read', () => {
    expect(spans(standInRows([8, 4, 3], 12))).toEqual([6, 3, 3])
  })

  it('never narrows a sticker past what can be read', () => {
    const standings = standInRows([3, 3, 3, 3, 3], 12)

    for (const { span } of standings) {
      expect(span).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives a sticker on its own the whole width', () => {
    expect(standInRows([5], 12)).toEqual([{ row: 1, span: 12, place: 'only' }])
  })

  it('stands nothing where there is nothing to stand', () => {
    expect(standInRows([], 12)).toEqual([])
  })
})

describe('matPlaces', () => {
  it('has a place for every sticker, and one for the scraps that close the mat', () => {
    expect(places.stickers).toHaveLength(stickers.length)
    expect(places.scraps.laptop.place).toBe('last')
    expect(places.scraps.tablet.place).toBe('last')
  })

  it('leads the first row with the lead project, cut the widest, on a laptop and on a tablet', () => {
    const lead = places.stickers[stickers.findIndex(({ id }) => id === LEAD_PROJECT)]

    for (const width of ['laptop', 'tablet'] as const) {
      const all = places.stickers.map((place) => place[width])

      expect(lead?.[width]).toMatchObject({ row: 1, place: 'first' })
      expect(lead?.[width].span).toBe(Math.max(...spans(all)))
    }
  })

  it('gives a sticker with a long caption more of its row than one with a few words', () => {
    const [plain] = stickers.filter(({ face }) => face.kind === 'plinko')
    if (!plain) {
      throw new Error('Expected the plinko board')
    }
    const wordy = { ...plain, id: 'wordy', description: 'word '.repeat(30).trim() }
    const terse = (id: string) => ({ ...plain, id, description: 'Few words.' })
    // After the lead and one more, a tablet's second row holds these two and the scraps.
    const { stickers: placed } = matPlaces([terse('lead'), terse('one'), wordy, terse('two')])
    const [, , long, short] = placed.map(({ tablet }) => tablet)

    expect(long?.row).toBe(short?.row)
    expect(long?.span).toBeGreaterThan(short?.span ?? 0)
  })

  it('fills every row of the mat, the scraps counted in', () => {
    for (const width of ['laptop', 'tablet'] as const) {
      const all = [...places.stickers, places.scraps].map((place) => place[width])

      for (const row of rowsOf(all)) {
        expect(sum(spans(row)), width).toBe(MAT[width].columns)
      }
    }
  })

  it('stands at least two projects in every row, and makes at least three rows of them', () => {
    for (const width of ['laptop', 'tablet'] as const) {
      const rows = rowsOf(places.stickers.map((place) => place[width]))

      expect(rows.length, width).toBeGreaterThanOrEqual(3)
      for (const row of rows) {
        expect(row.length, width).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('finds a place for a project nobody has drawn, without being told where', () => {
    const [first] = stickers
    if (!first) {
      throw new Error('Expected a sticker')
    }
    const bumper = {
      ...first,
      id: 'made-later',
      face: { kind: 'bumper' as FaceKind, lines: ['Made', 'later'] as const },
    }
    const more = matPlaces([
      ...stickers,
      { ...bumper, face: { kind: 'bumper', lines: ['Made', 'later'] } },
    ])

    expect(more.stickers).toHaveLength(stickers.length + 1)
    for (const width of ['laptop', 'tablet'] as const) {
      const all = [...more.stickers, more.scraps].map((place) => place[width])

      for (const row of rowsOf(all)) {
        expect(sum(spans(row)), width).toBe(MAT[width].columns)
      }
    }
  })
})

describe('placeData', () => {
  it('says the columns and the place at both widths', () => {
    expect(
      placeData({
        laptop: { row: 2, span: 5, place: 'middle' },
        tablet: { row: 3, span: 4, place: 'last' },
      }),
    ).toEqual({
      'data-span': 5,
      'data-place': 'middle',
      'data-span-tablet': 4,
      'data-place-tablet': 'last',
    })
  })

  it('says nothing for an item that was given no place', () => {
    expect(placeData(undefined)).toEqual({})
  })
})
