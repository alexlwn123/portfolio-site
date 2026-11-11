import { describe, expect, it } from 'vitest'

import { ContentError } from '../../../content/parse'
import { HIDDEN, parseLayout, parsePhoneLayout } from './schema'

const IDS = ['name', 'pill'] as const
const ARTBOARD = { width: 400, height: 600 }
const BLEED = 40

const valid = {
  name: { x: 10, y: 20, w: 300, r: -4, z: 6 },
  pill: { x: 30, y: 400, r: 5, z: 3 },
}

function parse(raw: unknown) {
  return parseLayout('desktop', IDS, ARTBOARD, raw)
}

describe('parseLayout', () => {
  it('returns the placements, frozen', () => {
    const layout = parse(valid)

    expect(layout).toEqual(valid)
    expect(Object.isFrozen(layout)).toBe(true)
    expect(Object.isFrozen(layout.name)).toBe(true)
  })

  it('keeps a placement without a width free of the key', () => {
    expect(Object.keys(parse(valid).pill)).toEqual(['x', 'y', 'r', 'z'])
  })

  it('names the sticker that has no placement', () => {
    expect(() => parse({ name: valid.name })).toThrow(ContentError)
    expect(() => parse({ name: valid.name })).toThrow(/lid\.placement\.desktop\.pill/)
  })

  it('refuses a placement for a sticker that does not exist', () => {
    expect(() => parse({ ...valid, ghost: valid.pill })).toThrow(/ghost/)
  })

  it.each([
    ['a missing coordinate', { y: 20, r: 0, z: 3 }],
    ['a non-finite coordinate', { x: Number.NaN, y: 20, r: 0, z: 3 }],
    ['a width of zero', { x: 10, y: 20, w: 0, r: 0, z: 3 }],
    ['a fractional layer', { x: 10, y: 20, r: 0, z: 2.5 }],
    ['a layer below the lid', { x: 10, y: 20, r: 0, z: 0 }],
    ['a full turn', { x: 10, y: 20, r: 200, z: 3 }],
    ['an unknown field', { x: 10, y: 20, r: 0, z: 3, h: 40 }],
  ])('refuses %s', (_, placement) => {
    expect(() => parse({ ...valid, pill: placement })).toThrow(/lid\.placement\.desktop\.pill/)
  })

  it.each([
    ['too far left', { x: -(BLEED + 1), y: 20, r: 0, z: 3 }],
    ['too far right', { x: 200, y: 20, w: 300, r: 0, z: 3 }],
    ['above the artboard', { x: 10, y: -(BLEED + 1), r: 0, z: 3 }],
    ['below the artboard', { x: 10, y: 601, r: 0, z: 3 }],
  ])('refuses a sticker placed %s', (_, placement) => {
    expect(() => parse({ ...valid, pill: placement })).toThrow(/artboard/)
  })

  it('lets a sticker hang over the edge by the bleed', () => {
    const hanging = { x: -BLEED, y: -BLEED, w: ARTBOARD.width + BLEED + BLEED, r: 0, z: 3 }

    expect(parse({ ...valid, name: hanging }).name).toEqual(hanging)
  })

  it('lets an artboard say how far above its top edge a placement may start', () => {
    const raised = { ...ARTBOARD, rise: 120 }
    const hung = { x: 10, y: -120, w: 260, r: 0, z: 3 }

    expect(parseLayout('wide', IDS, raised, { ...valid, name: hung }).name).toEqual(hung)
    expect(() => parse({ ...valid, name: hung })).toThrow(/artboard/)
    expect(() =>
      parseLayout('wide', IDS, raised, { ...valid, name: { ...hung, y: -121 } }),
    ).toThrow(/lid\.placement\.wide\.name/)
    // The rise is for the top edge only: the sides keep the bleed.
    expect(() =>
      parseLayout('wide', IDS, raised, { ...valid, name: { ...hung, x: -(BLEED + 1) } }),
    ).toThrow(/artboard/)
  })

  it('does not accept "hidden" on the desktop', () => {
    expect(() => parse({ ...valid, pill: HIDDEN })).toThrow(ContentError)
  })
})

describe('parsePhoneLayout', () => {
  it('accepts a placement or "hidden" for each sticker', () => {
    const layout = parsePhoneLayout('phone', IDS, ARTBOARD, { ...valid, pill: HIDDEN })

    expect(layout.pill).toBe(HIDDEN)
    expect(layout.name).toEqual(valid.name)
  })

  it('still checks the placements it is given', () => {
    const raw = { ...valid, pill: { x: 10, y: 9999, r: 0, z: 3 } }

    expect(() => parsePhoneLayout('phone', IDS, ARTBOARD, raw)).toThrow(
      /lid\.placement\.phone\.pill/,
    )
  })
})
