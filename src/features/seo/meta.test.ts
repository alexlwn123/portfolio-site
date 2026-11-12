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

  it('describes the whole career on the home page: the job, every employer before it, the patent filings', () => {
    const [current, ...earlier] = content.experience

    expect(home.description).toContain(`${profile.role.title} at ${profile.role.organization}`)
    expect(current?.organization).toBe(profile.role.organization)
    for (const { organization } of earlier) {
      expect(home.description).toContain(organization)
    }
    expect(home.description).toContain(
      `named inventor on ${String(stats.patents.filings)} patent filings`,
    )
    expect(home.description).toBe(
      'Minister of Development at Finite Computer in Atlanta. ' +
        'Earlier: Fedi, Zion, BlockSpaces, NCR Corporation. ' +
        '9 hackathon wins, 16 hackathons organized in 8 countries, ' +
        'named inventor on 4 patent filings.',
    )
  })

  it('follows the records: one employer, one filing, no "earlier" with nothing before', () => {
    const [current] = content.experience
    const early = { ...content, experience: current ? [current] : [] }
    const one = { ...stats, patents: { filings: 1 } }

    expect(buildMeta('home', early, stats).description).not.toContain('Earlier')
    expect(buildMeta('home', content, one).description).toContain(
      'named inventor on 1 patent filing.',
    )
    expect(buildMeta('home', content, one).description).not.toContain('1 patent filings')
  })

  it('counts filings, never a number of patents, and says nothing of what became of them', () => {
    expect(home.description).not.toMatch(/\b(\d+|two|three|four) (granted )?patents\b/i)
    expect(home.description).not.toMatch(/grant|pending|abandon|application/i)
  })

  it('stays short enough to be shown whole in a search result', () => {
    expect(home.description.length).toBeLessThanOrEqual(200)
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
