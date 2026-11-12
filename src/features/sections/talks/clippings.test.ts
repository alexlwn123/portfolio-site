import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Press } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import { pressCuttings } from './clippings'

const { clippings, references } = pressCuttings(content)

function clipping(id: string) {
  const found = clippings.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No clipping for the press item "${id}"`)
  }
  return found
}

describe('pressCuttings', () => {
  it('cuts out the two pieces of coverage and keeps the reference page apart', () => {
    expect(clippings.map(({ id }) => id)).toEqual([
      'npr-all-things-considered',
      'hrf-winners-announcement',
    ])
    expect(references).toEqual([
      {
        id: 'ai-hack-for-freedom-winners',
        outlet: 'AI Hack for Freedom',
        label: 'Winners of all three editions',
        url: 'https://www.aihackforfreedom.org/winners.html',
      },
    ])
    expect(clippings.length + references.length).toBe(content.press.length)
  })

  it('words every clipping only as the press claim allows', () => {
    for (const item of content.press.filter(({ subject }) => subject.kind !== 'reference')) {
      const { claim } = pressClaim(item, content)

      expect(clipping(item.id)).toMatchObject({ claim, url: item.url })
      expect(clipping(item.id)).not.toHaveProperty('naming')
    }
  })

  it('says of the NPR piece that it covered a hackathon he helped organize, and no more', () => {
    const npr = clipping('npr-all-things-considered')

    expect(npr).toMatchObject({
      outlet: 'NPR',
      programme: 'All Things Considered',
      headline: 'Human rights activists look to harness AI for the greater good',
      byline: 'Reported by Jenna McLaughlin',
      claim:
        'Coverage of AI Hack for Freedom III in Washington, DC, a hackathon he helped organize.',
      date: { year: 2026, month: 10, day: 27 },
    })
    expect(JSON.stringify(npr)).not.toMatch(/as heard on|featured (on|in)|names neither/i)
  })

  it('has no headline, programme or byline to print for the announcement', () => {
    expect(clipping('hrf-winners-announcement')).toMatchObject({
      outlet: 'Human Rights Foundation',
      programme: null,
      headline: null,
      byline: null,
      claim: 'Announcement of the AI Hack for Freedom I winners, with Stringer Safety placed 1st.',
    })
  })

  it('has nothing to show when there is no press', () => {
    expect(pressCuttings({ ...content, press: [] })).toEqual({ clippings: [], references: [] })
  })

  it('keeps a clipping whose date is not recorded', () => {
    const [first] = content.press
    const undated: Press | undefined = first && { ...first, date: null }

    expect(pressCuttings({ ...content, press: undated ? [undated] : [] }).clippings[0]?.date).toBe(
      null,
    )
  })
})
