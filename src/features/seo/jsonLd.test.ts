import { describe, expect, it } from 'vitest'

import { content } from '../../content'
import { buildPersonJsonLd, serializeJsonLd } from './jsonLd'

const IMAGE = 'https://example.com/portrait.png'

describe('serializeJsonLd', () => {
  it('escapes < so the JSON cannot break out of its script tag', () => {
    const hostile = { name: '</script><script>alert(1)</script>' }
    const serialized = serializeJsonLd(hostile)

    expect(serialized).not.toContain('<')
    expect(serialized).not.toMatch(/<\/script/i)
    expect(JSON.parse(serialized)).toEqual(hostile)
  })

  it('escapes >, & and the line separators that end a script line', () => {
    const awkward = { text: 'a > b && c \u2028 d \u2029 e <!-- f' }
    const serialized = serializeJsonLd(awkward)

    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(serialized)).toEqual(awkward)
  })
})

describe('buildPersonJsonLd', () => {
  const person = buildPersonJsonLd(content, IMAGE)

  it('is valid JSON with the expected fields', () => {
    const parsed: unknown = JSON.parse(serializeJsonLd(person))

    expect(parsed).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: content.profile.name,
      givenName: content.profile.givenName,
      familyName: content.profile.familyName,
      url: content.profile.site,
      image: IMAGE,
      jobTitle: content.profile.role.title,
      worksFor: { '@type': 'Organization', name: content.profile.role.organization },
      address: {
        '@type': 'PostalAddress',
        addressLocality: content.profile.location.city,
        addressRegion: content.profile.location.region,
        addressCountry: content.profile.location.country,
      },
      email: content.profile.email,
      sameAs: expect.any(Array) as unknown,
    })
  })

  it('lists his public profiles as sameAs, and not the booking or business-card pages', () => {
    const urlOf = (id: string) => content.profile.links.find((link) => link.id === id)?.url

    expect(person.sameAs).toEqual([
      urlOf('github'),
      urlOf('x'),
      urlOf('linkedin'),
      urlOf('devpost'),
      urlOf('bitcoinPlusPlus'),
    ])
    expect(person.sameAs).not.toContain(urlOf('booking'))
    expect(person.sameAs).not.toContain(urlOf('card'))
  })

  it('states nothing the record does not: no education or birth details', () => {
    expect(person).not.toHaveProperty('alumniOf')
    expect(person).not.toHaveProperty('birthDate')
  })
})
