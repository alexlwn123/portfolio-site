import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { HeldEvent } from '../../../content'
import { heldEvents, upcomingEvents } from '../../../content/derive'
import { type BandLook, bandLook, FALLBACK_LOOKS, HAND_SET_LOOKS } from './bandLooks'

const held = heldEvents(content.organized)
const looks = content.organized.map((event, index) => bandLook(event, index))

/** A look as one word, to tell two neighbours apart. */
function signature(look: BandLook): string {
  return JSON.stringify(look)
}

describe('bandLook', () => {
  it('leaves an upcoming hackathon’s band blank: it is still on the roll', () => {
    for (const event of upcomingEvents(content.organized)) {
      expect(bandLook(event, 0)).toEqual({ kind: 'blank' })
    }
  })

  it('has a hand-set band for every hackathon held, and for nothing else', () => {
    expect(Object.keys(HAND_SET_LOOKS).toSorted()).toEqual(held.map(({ id }) => id).toSorted())
  })

  it('never gives a held hackathon a blank band', () => {
    for (const event of held) {
      expect(bandLook(event, 0).kind, event.id).not.toBe('blank')
    }
  })

  it('makes the largest hackathon the holographic one, as the mockup did', () => {
    const largest = held.reduce((most, event) =>
      (event.participants?.count ?? 0) > (most.participants?.count ?? 0) ? event : most,
    )

    expect(largest.id).toBe('bitcoin-2025-official-hackathon')
    expect(bandLook(largest, 0)).toEqual({ kind: 'foil' })
    expect(looks.filter(({ kind }) => kind === 'foil')).toHaveLength(1)
  })

  it('makes the two-hour hackathon the thin one', () => {
    const thin = held.filter((event) => {
      const look = bandLook(event, 0)
      return look.kind === 'tyvek' && look.thin
    })

    expect(thin.map(({ id }) => id)).toEqual(['btcpp-ai-turbo-austin-2025'])
  })

  it('gives the two college hackathons the silicone bands', () => {
    const silicone = held.filter((event) => bandLook(event, 0).kind === 'silicone')

    expect(silicone.map(({ id }) => id)).toEqual(['auburnhacks-2021', 'auburnhacks-2020'])
  })

  it('never puts two bands that look the same next to each other', () => {
    for (const [index, look] of looks.entries()) {
      const next = looks[index + 1]
      if (next !== undefined) {
        expect(signature(look), content.organized[index]?.id).not.toBe(signature(next))
      }
    }
  })

  it('takes a look in turn for a hackathon held after the mockup was drawn', () => {
    const [first] = held
    if (!first) {
      throw new Error('Expected a held hackathon')
    }
    const later: HeldEvent = { ...first, id: 'held-after-the-mockup' }

    expect(bandLook(later, 0)).toEqual(FALLBACK_LOOKS[0])
    expect(bandLook(later, 1)).toEqual(FALLBACK_LOOKS[1])
    expect(bandLook(later, FALLBACK_LOOKS.length)).toEqual(FALLBACK_LOOKS[0])
    expect(FALLBACK_LOOKS.every(({ kind }) => kind !== 'blank' && kind !== 'foil')).toBe(true)
  })
})
