import { describe, expect, it } from 'vitest'

import { formatNumber, formatUsd, ordinal } from './formatNumber'

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1471)).toBe('1,471')
    expect(formatNumber(16)).toBe('16')
    expect(formatNumber(1234567)).toBe('1,234,567')
  })
})

describe('formatUsd', () => {
  it('writes whole dollars with a dollar sign and grouped thousands', () => {
    expect(formatUsd(163525)).toBe('$163,525')
    expect(formatUsd(6180)).toBe('$6,180')
  })
})

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [111, '111th'],
  ])('writes %i as %s', (value, expected) => {
    expect(ordinal(value)).toBe(expected)
  })
})
