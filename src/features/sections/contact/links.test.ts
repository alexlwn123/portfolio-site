import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { BAND_TONES, cityLine, CONTACT_LINK_IDS, contactBands, mailto } from './links'

describe('contactBands', () => {
  const bands = contactBands(content.profile.links)
  const urlOf = (id: string): string | undefined =>
    content.profile.links.find((link) => link.id === id)?.url

  it('is a band for each of the four ways to reach him, in the order he chose', () => {
    expect(CONTACT_LINK_IDS).toEqual(['x', 'github', 'booking', 'linkedin'])
    expect(bands.map(({ id }) => id)).toEqual(CONTACT_LINK_IDS)
    expect(bands.map(({ href }) => href)).toEqual(CONTACT_LINK_IDS.map(urlOf))
  })

  it('leaves out the other links the record holds: they are not ways to reach him', () => {
    const offered = bands.map(({ id }) => id)

    for (const id of ['devpost', 'bitcoinPlusPlus', 'card'] as const) {
      expect(content.profile.links.map((link) => link.id)).toContain(id)
      expect(offered).not.toContain(id)
    }
  })

  it('prints the short label where the record has one, and the full label where it has not', () => {
    expect(bands.map(({ label }) => label)).toEqual(['X', 'GitHub', 'Book 30 min', 'LinkedIn'])
  })

  it('is a band less for a record that has dropped one of the four', () => {
    const without = content.profile.links.filter(({ id }) => id !== 'booking')

    expect(contactBands(without).map(({ id }) => id)).toEqual(['x', 'github', 'linkedin'])
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
