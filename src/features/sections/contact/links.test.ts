import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { BAND_TONES, cityLine, contactBands, mailto } from './links'

describe('contactBands', () => {
  const bands = contactBands(content.profile.links)

  it('is one band for every link in the profile, in the profile’s order', () => {
    expect(bands.map(({ id }) => id)).toEqual(content.profile.links.map(({ id }) => id))
    expect(bands.map(({ href }) => href)).toEqual(content.profile.links.map(({ url }) => url))
  })

  it('prints the short label where the record has one, and the full label where it has not', () => {
    const labels = Object.fromEntries(bands.map(({ id, label }) => [id, label]))

    expect(labels.booking).toBe('Book 30 min')
    expect(labels.github).toBe('GitHub')
    expect(labels.bitcoinPlusPlus).toBe('bitcoin++ community profile')
    expect(labels.card).toBe('Business-card page')
  })

  it('cuts neighbouring bands from different colours, all of them pale enough for ink', () => {
    bands.slice(1).forEach((band, index) => {
      expect(band.tone, band.id).not.toBe(bands[index]?.tone)
    })
    expect(BAND_TONES).not.toContain('ink')
    for (const { tone } of bands) {
      expect(BAND_TONES).toContain(tone)
    }
  })

  it('is nothing for a profile with no links', () => {
    expect(contactBands([])).toEqual([])
  })
})

describe('mailto', () => {
  it('is the address as a link', () => {
    expect(mailto(content.profile.email)).toBe(`mailto:${content.profile.email}`)
  })
})

describe('cityLine', () => {
  it('is the city and its state, as an envelope has them', () => {
    expect(cityLine(content.profile.location)).toBe('Atlanta, GA')
  })
})
