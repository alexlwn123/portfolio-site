import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { careerPath, NOW_KEY, type PathStop } from './path'
import { hangsPast, isQuiet, MOST_PAST } from './room'

const path = careerPath(content)

function indexOf(key: string): number {
  const index = path.findIndex((stop) => stop.key === key)
  if (index < 0) {
    throw new Error(`The path has no stop "${key}"`)
  }
  return index
}

function stop(key: string, jobs: number): PathStop {
  const [job] = path.flatMap((each) => each.jobs)
  if (job === undefined) {
    throw new Error('The record has no job')
  }
  return {
    key,
    year: Number(key),
    jobs: Array.from({ length: jobs }, () => job),
    schools: [],
    marks: [],
  }
}

describe('isQuiet', () => {
  it('is true for a year with no job, no school and nothing else', () => {
    expect(path.filter(isQuiet).map(({ key }) => key)).toEqual(['2019'])
  })

  it('is never true for the present, which is not a year', () => {
    const now = path[indexOf(NOW_KEY)]

    expect(now && isQuiet({ ...now, jobs: [] })).toBe(false)
  })

  it('is false for a year that holds only a school', () => {
    const start = path[indexOf('2018')]

    expect(start?.jobs).toEqual([])
    expect(start?.marks).toEqual([])
    expect(start && isQuiet(start)).toBe(false)
  })
})

describe('hangsPast', () => {
  it('lets a tag hang past every stop until the next that has a job of its own', () => {
    expect(hangsPast(path, indexOf(NOW_KEY))).toBe(2)
    expect(hangsPast(path, indexOf('2022'))).toBe(1)
  })

  it('gives a tag no room when the very next stop has a job', () => {
    expect(hangsPast(path, indexOf('2024'))).toBe(0)
    expect(hangsPast(path, indexOf('2023'))).toBe(0)
  })

  it('lets the first job hang to the foot of the path', () => {
    expect(hangsPast(path, indexOf('2020'))).toBe(path.length - 1 - indexOf('2020'))
  })

  it('is nothing for a stop that hangs no job', () => {
    expect(hangsPast(path, indexOf('2026'))).toBe(0)
    expect(hangsPast(path, indexOf('2018'))).toBe(0)
  })

  it('is nothing for a stop the path does not have', () => {
    expect(hangsPast(path, path.length)).toBe(0)
  })

  it('never hangs a tag past more stops than the path can draw', () => {
    const long = [
      stop('2030', 1),
      ...['2029', '2028', '2027', '2026', '2025'].map((key) => stop(key, 0)),
    ]

    expect(hangsPast(long, 0)).toBe(MOST_PAST)
  })
})
