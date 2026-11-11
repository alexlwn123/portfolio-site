import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { FALLBACK_SHAPES, HAND_SET_LOOKS, stickerLook } from './stickerLooks'
import { winFacts } from './winFacts'

const facts = winFacts(content)
const looks = facts.map((win, index) => stickerLook(win, index))

describe('stickerLook', () => {
  it('has a hand-set sticker for every win, and for nothing else', () => {
    expect(Object.keys(HAND_SET_LOOKS).toSorted()).toEqual(facts.map(({ id }) => id).toSorted())
  })

  it('gives the prize a shape no place has', () => {
    const prizeShapes = new Set(
      looks.filter((_, index) => facts[index]?.finish === 'prize').map(({ shape }) => shape),
    )
    const placeShapes = new Set(
      looks.filter((_, index) => facts[index]?.finish !== 'prize').map(({ shape }) => shape),
    )

    expect([...prizeShapes]).toEqual(['rosette'])
    expect(placeShapes.has('rosette')).toBe(false)
  })

  it('cuts the stickers in more shapes than a grid of cards would', () => {
    expect(new Set(looks.map(({ shape }) => shape)).size).toBeGreaterThanOrEqual(6)
  })

  it('never puts two stickers of one shape next to each other', () => {
    for (const [index, look] of looks.entries()) {
      expect(look.shape, facts[index]?.id).not.toBe(looks[index + 1]?.shape)
    }
  })

  it('lifts a corner of one or two, and only of stickers that have corners', () => {
    const lifting = looks.filter(({ lifting: lifts }) => lifts)

    expect(lifting.length).toBeGreaterThanOrEqual(1)
    expect(lifting.length).toBeLessThanOrEqual(2)
    for (const { shape } of lifting) {
      expect(['slab', 'ticket']).toContain(shape)
    }
  })

  it('cuts no first place in a low, wide shape, which would make it the smallest on the sheet', () => {
    const onTheSheet = facts.flatMap((win, index) =>
      win.finish === 'first' && !win.peeled ? [stickerLook(win, index)] : [],
    )

    expect(onTheSheet.length).toBeGreaterThan(0)
    for (const { shape } of onTheSheet) {
      expect(['slab', 'ticket']).not.toContain(shape)
    }
  })

  it('gives the win with a field the medal, which has a ring to letter it on', () => {
    const fielded = facts.findIndex(({ field }) => field !== null)

    expect(looks[fielded]?.shape).toBe('medal')
  })

  it('takes a shape in turn for a win added after these were drawn, and keeps the prize’s own', () => {
    const [first] = facts
    if (!first) {
      throw new Error('Expected a win')
    }
    const added = { ...first, id: 'won-later' }

    expect(stickerLook(added, 0)).toEqual({ shape: FALLBACK_SHAPES[0], lifting: false })
    expect(stickerLook(added, FALLBACK_SHAPES.length)).toEqual({
      shape: FALLBACK_SHAPES[0],
      lifting: false,
    })
    expect(stickerLook({ ...added, finish: 'prize' }, 1)).toEqual({
      shape: 'rosette',
      lifting: false,
    })
    expect(FALLBACK_SHAPES).not.toContain('rosette')
  })
})
