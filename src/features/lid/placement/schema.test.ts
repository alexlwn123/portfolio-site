import { describe, expect, it } from 'vitest'

import { ContentError } from '../../../content/parse'
import { COVER_RISE } from './artboards'
import { HIDDEN, parseCoverLayout, parseLayout, parsePhoneLayout } from './schema'

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

describe('parseCoverLayout', () => {
  const FIELD = { width: 400, height: 600 }
  const cover = {
    name: { from: 'left', against: 'middle', x: 0, y: -200, w: 300, r: -4, z: 6 },
    pill: { from: 'right', against: 'bottom', x: 20, y: 30, r: 5, z: 3 },
  }

  function parseCover(raw: unknown) {
    return parseCoverLayout('cover.wide', IDS, FIELD, raw)
  }

  it('returns the placements, frozen, each with the edge and the line it is measured from', () => {
    const layout = parseCover(cover)

    expect(layout).toEqual(cover)
    expect(Object.isFrozen(layout.name)).toBe(true)
    expect(layout.pill).toMatchObject({ from: 'right', against: 'bottom' })
  })

  it('names the sticker that has no placement, or one that says nothing of where it is measured from', () => {
    expect(() => parseCover({ name: cover.name })).toThrow(/lid\.placement\.cover\.wide\.pill/)
    expect(() => parseCover({ ...cover, pill: valid.pill })).toThrow(
      /lid\.placement\.cover\.wide\.pill/,
    )
    expect(() => parseCover({ ...cover, pill: { ...cover.pill, from: 'centre' } })).toThrow(
      ContentError,
    )
  })

  it.each([
    ['left of the column', { ...cover.pill, x: -(BLEED + 1) }],
    ['wider than the column', { ...cover.name, x: 200 }],
    ['below the bottom of the screen', { ...cover.pill, y: -1 }],
    ['higher than the screen is tall', { ...cover.pill, y: FIELD.height + 1 }],
    ['further above the middle than the top is', { ...cover.name, y: -(FIELD.height / 2) - 1 }],
    ['further below the middle than the bottom is', { ...cover.name, y: FIELD.height / 2 + 1 }],
  ])('refuses a sticker placed %s', (_, placement) => {
    expect(() => parseCover({ ...cover, pill: placement })).toThrow(/cover/)
  })

  it('lets what hangs from the top of the screen start above it, by the rise and no more', () => {
    const hung = { from: 'right', against: 'top', x: -12, y: -COVER_RISE, w: 260, r: 0, z: 9 }

    expect(parseCover({ ...cover, pill: hung }).pill).toEqual(hung)
    expect(() => parseCover({ ...cover, pill: { ...hung, y: -COVER_RISE - 1 } })).toThrow(/cover/)
  })

  it('measures the bleed from whichever edge the placement is measured from', () => {
    const hanging = { ...cover.pill, x: -BLEED, w: FIELD.width + BLEED + BLEED }

    expect(parseCover({ ...cover, pill: hanging }).pill).toEqual(hanging)
  })
})
