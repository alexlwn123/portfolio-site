import { describe, expect, it } from 'vitest'

import { content, copy, stats } from '../../content'
import { buildMeta } from './meta'

const { profile } = content

describe('buildMeta', () => {
  const home = buildMeta('home', content, stats)
  const cv = buildMeta('cv', content, stats)
  const notFound = buildMeta('notFound', content, stats)

  it('titles the home page with his name and role', () => {
    expect(home.title).toContain(profile.name)
    expect(home.title).toContain(profile.role.title)
    expect(home.title).toContain(profile.role.organization)
  })

  it('describes him with numbers taken from the derived stats', () => {
    expect(home.description).toContain(`${String(stats.wins.total)} hackathon wins`)
    expect(home.description).toContain(`${String(stats.organized.count)} hackathons organized`)
    expect(home.description).toContain(`${String(stats.organized.countryCount)} countries`)
    expect(home.description).toContain(profile.location.city)
  })

  it('gives each indexable page a canonical URL on the site, with a trailing slash', () => {
    expect(home.canonical).toBe(`${profile.site}/`)
    expect(cv.canonical).toBe(`${profile.site}/cv/`)
  })

  it('titles and describes the CV page as his CV', () => {
    expect(cv.title).toContain('CV')
    expect(cv.title).toContain(profile.name)
    expect(cv.description).toContain(profile.name)
    expect(cv.description).not.toBe(home.description)
  })

  it('keeps the 404 page out of search results', () => {
    expect(notFound.title).toContain(copy.notFound.title)
    expect(notFound.robots).toBe('noindex')
    expect(notFound.canonical).toBeNull()
    expect(notFound.jsonLd).toBeNull()
  })

  it('lets search engines index the real pages', () => {
    expect(home.robots).toBe('index, follow')
    expect(cv.robots).toBe('index, follow')
  })

  it('points the social image at an absolute https URL on the site', () => {
    expect(home.image.startsWith(`${profile.site}/`)).toBe(true)
    expect(cv.image).toBe(home.image)
  })

  it('carries serialized Person JSON-LD on the real pages', () => {
    const parsed = JSON.parse(home.jsonLd ?? 'null') as Record<string, unknown>

    expect(parsed['@type']).toBe('Person')
    expect(parsed.name).toBe(profile.name)
    expect(parsed.image).toBe(home.image)
    expect(cv.jsonLd).toBe(home.jsonLd)
  })

  it('names the site after him', () => {
    expect(home.siteName).toBe(profile.name)
  })
})
