import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ContentError, parseContent, recordList } from './parse'

const itemSchema = z.strictObject({ id: z.string(), event: z.string().min(1) })

describe('parseContent', () => {
  it('returns the parsed value, deeply frozen', () => {
    const parsed = parseContent(recordList(itemSchema), [{ id: 'a', event: 'One' }], 'wins')

    expect(parsed).toEqual([{ id: 'a', event: 'One' }])
    expect(Object.isFrozen(parsed)).toBe(true)
    expect(Object.isFrozen(parsed[0])).toBe(true)
  })

  it('names the module and the field of a bad record', () => {
    const records = [
      { id: 'a', event: 'One' },
      { id: 'b', event: '' },
    ]

    expect(() => parseContent(recordList(itemSchema), records, 'wins')).toThrow(ContentError)
    expect(() => parseContent(recordList(itemSchema), records, 'wins')).toThrow(/wins\[1\]\.event/)
  })

  it('names a missing field', () => {
    expect(() => parseContent(recordList(itemSchema), [{ id: 'a' }], 'wins')).toThrow(
      /wins\[0\]\.event/,
    )
  })

  it('reports every problem, not only the first', () => {
    const records = [
      { id: 'a', event: '' },
      { id: 'b', event: '' },
    ]

    expect(() => parseContent(recordList(itemSchema), records, 'wins')).toThrow(
      /wins\[0\]\.event[\s\S]*wins\[1\]\.event/,
    )
  })

  it('names the module itself when the whole value is wrong', () => {
    expect(() => parseContent(itemSchema, null, 'profile')).toThrow(/profile:/)
  })
})

describe('recordList', () => {
  it('rejects two records with the same id', () => {
    const records = [
      { id: 'a', event: 'One' },
      { id: 'a', event: 'Two' },
    ]

    expect(() => parseContent(recordList(itemSchema), records, 'wins')).toThrow(
      /wins\[1\]\.id.*duplicate/i,
    )
  })
})
